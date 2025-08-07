import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Payment, PaymentDocument } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(Payment.name)
    private paymentModel: Model<PaymentDocument>,
    private configService: ConfigService,
    @Inject(forwardRef(() => OrdersService))
    private ordersService: OrdersService,
  ) {}

  // Xử lý webhook từ Sepay
  async handleSepayWebhook(webhookData: any, authHeader?: string) {
    console.log(
      '🔔 Sepay Webhook received:',
      JSON.stringify(webhookData, null, 2),
    );

    // Kiểm tra API Key nếu có cấu hình
    const sepayApiKey = this.configService.get('SEPAY_API_KEY');
    if (sepayApiKey && authHeader && authHeader !== `Apikey ${sepayApiKey}`) {
      throw new UnauthorizedException('Invalid API Key');
    }

    const {
      id,
      gateway,
      transactionDate,
      accountNumber,
      code,
      content,
      transferType,
      transferAmount,
      accumulated,
      subAccount,
      referenceCode,
      description,
    } = webhookData;

    // Chỉ xử lý giao dịch tiền vào (in)
    if (transferType !== 'in') {
      console.log('⚠️ Ignoring outbound transaction');
      return { success: false, message: 'Not an inbound transaction' };
    }

    // Tìm orderCode trong nội dung chuyển khoản
    // Tìm pattern ORD + số (3-6 chữ số)
    const orderCodeMatch = content.match(/ORD\d{3,6}/i);
    if (!orderCodeMatch) {
      console.log('⚠️ No order code found in transfer content:', content);
      return {
        success: false,
        message: 'No order code found in transfer content',
      };
    }

    const orderCode = orderCodeMatch[0].toUpperCase();
    console.log('🔍 Extracted order code:', orderCode);

    // Tìm payment theo orderCode
    const payment = await this.paymentModel.findOne({ orderCode });
    if (!payment) {
      console.log('❌ Payment not found for orderCode:', orderCode);
      throw new NotFoundException(`Payment not found for order ${orderCode}`);
    }

    console.log(
      '✅ Found payment:',
      payment._id,
      'with amount:',
      payment.amount,
    );

    // Kiểm tra số tiền có khớp không (cho phép sai lệch nhỏ)
    const amountDifference = Math.abs(transferAmount - payment.amount);
    const tolerance = 1000; // Cho phép sai lệch 1000 VND

    if (amountDifference > tolerance) {
      console.log(
        `⚠️ Amount mismatch: expected ${payment.amount}, received ${transferAmount}`,
      );
      return {
        success: false,
        message: `Amount mismatch: expected ${payment.amount}, received ${transferAmount}`,
      };
    }

    // Cập nhật trạng thái payment thành công
    payment.status = 'completed';
    payment.paidAt = new Date(transactionDate);
    payment.sepayTransactionId = id.toString();
    payment.sepayReferenceCode = referenceCode;
    payment.sepayGateway = gateway;
    await payment.save();

    console.log('💰 Payment updated to completed status');

    // Tự động tạo order từ thông tin payment
    try {
      const orderData = {
        orderNumber: payment.orderCode,
        orderType: payment.orderData?.isGuestOrder ? 'guest' : 'user',
        items: payment.orderData?.items?.map((item) => {
          const mappedItem = {
            ...item,
            productId: new Types.ObjectId(item.productId),
          };

          // Log để debug selectedEgg
          if (item.selectedEgg) {
            console.log(
              '🥚 Selected egg found:',
              JSON.stringify(item.selectedEgg, null, 2),
            );
          }
          if (item.selectedBox) {
            console.log(
              '📦 Selected box found:',
              JSON.stringify(item.selectedBox, null, 2),
            );
          }

          return mappedItem;
        }),
        shipping: payment.customerInfo,
        payment: {
          method: payment.paymentMethod,
          amount: payment.amount,
          status: 'paid',
          transactionId: payment._id,
          paidAt: payment.paidAt,
          sepayTransactionId: payment.sepayTransactionId,
          sepayReferenceCode: payment.sepayReferenceCode,
        },
        delivery: {
          method: payment.orderData?.deliveryMethod,
          fee: payment.orderData?.deliveryFee,
        },
        pricing: {
          subtotal: payment.orderData?.subtotal,
          deliveryFee: payment.orderData?.deliveryFee,
          totalAmount: payment.orderData?.totalAmount,
        },
        note: payment.orderData?.note,
        status: 'confirmed',
        createAccount: payment.orderData?.createAccount,
      };

      console.log(
        '📦 Creating order with data:',
        JSON.stringify(orderData, null, 2),
      );
      const createdOrder = await this.ordersService.createOrder(orderData);

      console.log('✅ Order created successfully:', createdOrder._id);

      return {
        success: true,
        message: 'Payment confirmed & order created',
        paymentId: payment._id,
        orderId: createdOrder._id,
        orderNumber: createdOrder.orderNumber,
        sepayTransactionId: id,
      };
    } catch (orderError) {
      console.error('❌ Failed to create order:', orderError);
      return {
        success: true,
        message: 'Payment confirmed but order creation failed',
        paymentId: payment._id,
        error: orderError.message,
      };
    }
  }

  async createPayment(
    userId: string | null,
    createPaymentDto: CreatePaymentDto,
  ) {
    try {
      // Sinh mã đơn hàng duy nhất (orderCode) với tiền tố ORD và 3-6 ký tự số
      let orderCode = '';
      let isUnique = false;
      while (!isUnique) {
        const randomLength = Math.floor(Math.random() * 4) + 3; // 3-6 ký tự
        const randomNumber = Math.floor(
          Math.random() * Math.pow(10, randomLength),
        )
          .toString()
          .padStart(randomLength, '0');
        orderCode = `ORD${randomNumber}`;
        // Kiểm tra trùng lặp trong DB
        const existing = await this.paymentModel.findOne({ orderCode });
        if (!existing) isUnique = true;
      }

      const userIdObjId = userId ? new Types.ObjectId(userId) : null;
      const { bankCode, amount, orderData, customerInfo } = createPaymentDto;

      // Tạo payment record, lưu kèm thông tin người dùng
      const payment = new this.paymentModel({
        userId: userIdObjId,
        amount: amount,
        currency: 'VND',
        status: 'pending',
        paymentMethod: 'sepay',
        description: `Thanh toán đơn hàng ${orderCode}`,
        orderCode: orderCode,
        customerInfo: customerInfo,
        orderData: orderData,
      });

      const savedPayment = await payment.save();

      // Trả về thông tin Sepay format
      const sepayResponse = {
        paymentId: savedPayment._id,
        amount: savedPayment.amount,
        orderCode: savedPayment.orderCode,
        bankAccount:
          this.configService.get('SEPAY_BANK_ACCOUNT') || '0347178790',
        bankName: this.configService.get('SEPAY_BANK_NAME') || 'MB',
        accountName:
          this.configService.get('SEPAY_ACCOUNT_NAME') || 'CHU PHAN NHAT LONG',
        transferContent: savedPayment.orderCode,
      };

      return { data: sepayResponse };
    } catch (error) {
      throw new BadRequestException('Failed to create payment');
    }
  }
  async getPaymentStatus(paymentId: string) {
    const payment = await this.paymentModel
      .findById(paymentId)
      .populate('userId', 'fullName email');

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async debugGetRawPayment(orderCode: string) {
    console.log('🔍 Debug: Querying payment with orderCode:', orderCode);

    const payment = await this.paymentModel
      .findOne({ sepayId: orderCode })
      .lean() // Get raw object without Mongoose transformations
      .exec();

    console.log('📋 Debug: Found payment:', payment);

    if (!payment) {
      // Check all payments to see what's available
      const allPayments = await this.paymentModel
        .find({})
        .select('sepayId status amount')
        .lean()
        .exec();

      console.log('📋 Debug: All payments in DB:', allPayments);
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async getPaymentByOrderCode(orderCode: string) {
    console.log('🔍 Getting payment for orderCode:', orderCode);

    const payment = await this.paymentModel
      .findOne({ orderCode: orderCode })
      .populate('userId', 'fullName email')
      .exec();

    console.log('📋 Found payment with status:', payment?.status);

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const result = {
      paymentId: payment._id,
      status: payment.status,
      amount: payment.amount,
      description: payment.description,
      paidAt: payment.paidAt,
      orderCode: payment.sepayId,
      rawStatus: payment.status, // Add raw status for debugging
    };

    console.log('📤 Returning payment result:', result);

    return result;
  }

  async getAllPayments(
    page: number = 1,
    limit: number = 10,
    status?: string,
    search?: string,
  ) {
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    // Add search functionality
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { paymentId: { $regex: search, $options: 'i' } },
      ];

      // If search term looks like a MongoDB ObjectId, also search by _id
      if (search.match(/^[0-9a-fA-F]{24}$/)) {
        filter.$or.push({ _id: search });
      }
    }

    const payments = await this.paymentModel
      .find(filter)
      .populate('userId', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.paymentModel.countDocuments(filter);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPaymentsByUserId(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    const payments = await this.paymentModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.paymentModel.countDocuments({ userId });

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPaymentById(paymentId: string) {
    const payment = await this.paymentModel
      .findById(paymentId)
      .populate('userId', 'fullName email')
      .exec();

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async getPaymentsByStatus(
    status: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    const payments = await this.paymentModel
      .find({ status })
      .populate('userId', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.paymentModel.countDocuments({ status });

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPaymentStatistics() {
    const totalPayments = await this.paymentModel.countDocuments();
    const completedPayments = await this.paymentModel.countDocuments({
      status: 'completed',
    });
    const pendingPayments = await this.paymentModel.countDocuments({
      status: 'pending',
    });
    const failedPayments = await this.paymentModel.countDocuments({
      status: 'failed',
    });

    const totalRevenue = await this.paymentModel.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    return {
      totalPayments,
      completedPayments,
      pendingPayments,
      failedPayments,
      totalRevenue: totalRevenue[0]?.total || 0,
    };
  }
}
