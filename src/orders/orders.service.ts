import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './entities/order.entity';
import { PaymentSession } from './entities/payment-session.entity';
import { PopulatedOrder } from './interfaces/populated-order.interface';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(PaymentSession.name)
    private paymentSessionModel: Model<PaymentSession>,
  ) {}

  create(createOrderDto: CreateOrderDto) {
    return 'This action adds a new order';
  }

  findAll() {
    return `This action returns all orders`;
  }

  findOne(id: number) {
    return `This action returns a #${id} order`;
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }

  // Unified create order method
  async createOrder(orderData: any) {
    const order = {
      orderNumber: this.generateOrderNumber(),
      ...orderData,
    };

    const savedOrder = await this.orderModel.create(order);

    console.log('Order created:', savedOrder);
    return savedOrder;
  }

  private generateOrderNumber(): string {
    const prefix = 'BTC'; // Bánh Trung Thu
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  }

  // Track order by order number
  async trackOrder(orderNumber: string) {
    console.log('🔍 Tracking order:', orderNumber);

    const order = (await this.orderModel
      .findOne({ orderNumber })
      .populate({
        path: 'items.productId',
        model: 'Product',
        select: 'name image price description category',
      })
      .select('-__v')
      .lean()) as any; // Use any instead of PopulatedOrder for now

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng với mã này');
    }

    console.log('📦 Order items after populate:', order.items);

    // Check if populate worked
    if (order.items && order.items.length > 0) {
      console.log(
        '🔍 First item productId type:',
        typeof order.items[0].productId,
      );
      console.log('🔍 First item productId value:', order.items[0].productId);

      // Check if it's populated (should be object with _id, name, etc.)
      const productId = order.items[0].productId;
      if (typeof productId === 'object' && productId.name) {
        console.log('✅ Populate worked! Product name:', productId.name);
      } else {
        console.log('❌ Populate failed - still ObjectId');
      }
    }

    // Add status timeline
    const statusTimeline = this.getStatusTimeline(
      order.status,
      order.createdAt,
    );

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      statusText: this.getStatusText(order.status),
      statusTimeline,
      items: order.items,
      shipping: order.shipping,
      pricing: order.pricing,
      payment: order.payment,
      delivery: order.delivery,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  // Get full order details
  async getOrderDetails(id: string) {
    const order = await this.orderModel
      .findById(id)
      .populate(
        'items.productId',
        'name image price description category stock',
      )
      .select('-__v');

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    return order;
  }

  // Update order status
  async updateOrderStatus(
    id: string,
    statusUpdate: { status: string; note?: string },
  ) {
    const { status, note } = statusUpdate;

    const order = await this.orderModel.findByIdAndUpdate(
      id,
      {
        status,
        $push: {
          statusHistory: {
            status,
            note,
            updatedAt: new Date(),
          },
        },
      },
      { new: true },
    );

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    return order;
  }

  // Create payment for order
  async createOrderPayment(
    orderNumber: string,
    paymentData: { bankCode: string; amount: number },
  ) {
    const order = await this.orderModel.findOne({ orderNumber });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    if (order.status === 'delivered' || order.status === 'cancelled') {
      throw new BadRequestException('Không thể thanh toán cho đơn hàng này');
    }

    // Verify amount matches order total
    if (paymentData.amount !== order.pricing.totalAmount) {
      throw new BadRequestException(
        'Số tiền thanh toán không khớp với đơn hàng',
      );
    }

    // Generate payment info (similar to wallet top-up)
    const paymentInfo = {
      orderNumber,
      transactionId: `PAY_${Date.now()}`,
      amount: paymentData.amount,
      bankCode: paymentData.bankCode,
      accountNumber: this.getBankAccountNumber(paymentData.bankCode),
      accountName: 'CHU PHAN NHAT LONG',
      transferContent: `Thanh toan don hang ${orderNumber}`,
      qrCode: this.generateQRCode(
        paymentData.bankCode,
        paymentData.amount,
        orderNumber,
      ),
      status: 'pending',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      createdAt: new Date(),
    };

    // Update order with payment info
    await this.orderModel.findOneAndUpdate(
      { orderNumber },
      {
        $set: {
          'payment.transactionId': paymentInfo.transactionId,
          'payment.status': 'pending',
          'payment.expiresAt': paymentInfo.expiresAt,
        },
      },
    );

    return paymentInfo;
  }

  // Check payment status
  async checkOrderPaymentStatus(orderNumber: string) {
    const order = await this.orderModel.findOne({ orderNumber });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    return {
      orderNumber,
      paymentStatus: order.payment.status || 'pending',
      orderStatus: order.status,
      amount: order.pricing.totalAmount,
      transactionId: order.payment.transactionId,
    };
  }

  // Handle payment webhook
  async handlePaymentWebhook(webhookData: any) {
    // This would integrate with your bank's webhook
    const { transactionId, amount, status, orderNumber } = webhookData;

    if (status === 'success') {
      // Update order status to confirmed and paid
      await this.orderModel.findOneAndUpdate(
        { orderNumber },
        {
          $set: {
            'payment.status': 'paid',
            'payment.paidAt': new Date(),
            status: 'confirmed',
          },
          $push: {
            statusHistory: {
              status: 'confirmed',
              note: 'Đã thanh toán thành công',
              updatedAt: new Date(),
            },
          },
        },
      );

      return { success: true, message: 'Đơn hàng đã được xác nhận' };
    }

    return { success: false, message: 'Thanh toán thất bại' };
  }

  // Create payment session (before order)
  async createPaymentSession(requestData: any) {
    const { bankCode, amount, orderData, customerInfo } = requestData;

    // Generate shorter sessionId to avoid bank truncation
    const sessionId = `SESSION${Date.now()}`;

    // Verify amount matches
    if (amount !== orderData.totalAmount) {
      throw new BadRequestException(
        'Số tiền thanh toán không khớp với tổng đơn hàng',
      );
    }

    // Merge orderData with customerInfo for session
    const sessionData: any = {
      sessionId,
      items: orderData.items,
      shippingInfo: orderData.shippingInfo || customerInfo,
      paymentMethod: orderData.paymentMethod,
      deliveryMethod: orderData.deliveryMethod,
      subtotal: orderData.subtotal,
      deliveryFee: orderData.deliveryFee,
      totalAmount: orderData.totalAmount,
      note: orderData.note,
      isGuestOrder: orderData.isGuestOrder,
      createAccount: orderData.createAccount,
      bankCode,
      status: 'pending',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    };

    // If bank transfer, generate payment info
    if (orderData.paymentMethod === 'bank_transfer' && bankCode) {
      const transactionId = `PAY_${Date.now()}`;
      const transferContent = `Thanh toan session ${sessionId}`;

      sessionData.transactionId = transactionId;
      sessionData.accountNumber = this.getBankAccountNumber(bankCode);
      sessionData.transferContent = transferContent;
      sessionData.qrCode = this.generateQRCodeForSession(
        bankCode,
        amount,
        sessionId,
      );
    }

    const savedSession = await this.paymentSessionModel.create(sessionData);

    return {
      sessionId: savedSession.sessionId,
      expiresAt: savedSession.expiresAt,
      paymentInfo:
        orderData.paymentMethod === 'bank_transfer'
          ? {
              bankCode: savedSession.bankCode,
              accountNumber: savedSession.accountNumber,
              accountName: 'CHU PHAN NHAT LONG',
              amount: savedSession.totalAmount,
              transferContent: savedSession.transferContent,
              qrCode: savedSession.qrCode,
              transactionId: savedSession.transactionId,
            }
          : null,
      orderSummary: {
        items: savedSession.items,
        subtotal: savedSession.subtotal,
        deliveryFee: savedSession.deliveryFee,
        totalAmount: savedSession.totalAmount,
        customerInfo: savedSession.shippingInfo,
      },
    };
  }

  // Check payment session status
  async checkPaymentSessionStatus(sessionId: string) {
    const session = await this.paymentSessionModel.findOne({ sessionId });

    if (!session) {
      throw new NotFoundException('Không tìm thấy phiên thanh toán');
    }

    // Check if expired
    if (session.expiresAt < new Date() && session.status === 'pending') {
      session.status = 'expired';
      await session.save();
    }

    // Auto-check payment if still pending
    if (session.status === 'pending') {
      console.log(`🔍 Auto-checking payment for session: ${sessionId}`);

      try {
        const isPaid = await this.checkBankTransactionFromGoogleSheets(
          sessionId,
          session.totalAmount,
        );

        if (isPaid) {
          console.log(
            `💰 Payment found! Auto-confirming session: ${sessionId}`,
          );

          // Update session to paid
          session.status = 'paid';
          session.paidAt = new Date();
          await session.save();

          // Try to create order automatically
          try {
            const order = await this.confirmPaymentAndCreateOrder(sessionId);
            console.log(`✅ Order auto-created: ${order.orderNumber}`);

            return {
              sessionId: session.sessionId,
              status: 'paid',
              expiresAt: session.expiresAt,
              orderNumber: order.orderNumber,
              totalAmount: session.totalAmount,
              autoConfirmed: true,
              message: 'Thanh toán đã được xác nhận và đơn hàng đã được tạo',
            };
          } catch (orderError) {
            console.error(
              `❌ Failed to auto-create order for session ${sessionId}:`,
              orderError,
            );

            return {
              sessionId: session.sessionId,
              status: 'paid',
              expiresAt: session.expiresAt,
              orderNumber: null,
              totalAmount: session.totalAmount,
              autoConfirmed: true,
              message:
                'Thanh toán đã được xác nhận nhưng tạo đơn hàng thất bại',
            };
          }
        } else {
          console.log(`💭 No payment found yet for session: ${sessionId}`);
        }
      } catch (checkError) {
        console.error(
          `❌ Error auto-checking session ${sessionId}:`,
          checkError,
        );
      }
    }

    return {
      sessionId: session.sessionId,
      status: session.status,
      expiresAt: session.expiresAt,
      orderNumber: session.orderNumber,
      totalAmount: session.totalAmount,
      autoConfirmed: false,
    };
  }

  // Confirm payment and create order
  async confirmPaymentAndCreateOrder(sessionId: string) {
    const session = await this.paymentSessionModel.findOne({ sessionId });

    if (!session) {
      throw new NotFoundException('Không tìm thấy phiên thanh toán');
    }

    if (session.status !== 'paid') {
      throw new BadRequestException('Phiên thanh toán chưa được thanh toán');
    }

    if (session.orderNumber) {
      throw new BadRequestException('Đơn hàng đã được tạo từ phiên này');
    }

    // Convert string productId to ObjectId
    const processedItems = session.items.map((item) => ({
      ...item,
      productId: new Types.ObjectId(item.productId),
    }));

    // Create order from session data
    const orderData = {
      orderType: session.isGuestOrder ? 'guest' : 'user',
      items: processedItems,
      shipping: session.shippingInfo,
      payment: {
        method: session.paymentMethod,
        amount: session.totalAmount,
        status: 'paid',
        transactionId: session.transactionId,
        paidAt: session.paidAt,
      },
      delivery: {
        method: session.deliveryMethod,
        fee: session.deliveryFee,
      },
      pricing: {
        subtotal: session.subtotal,
        deliveryFee: session.deliveryFee,
        totalAmount: session.totalAmount,
      },
      note: session.note,
      status: 'confirmed',
      createAccount: session.createAccount,
    };

    const order = await this.createOrder(orderData);

    // Update session with order number
    session.orderNumber = order.orderNumber;
    await session.save();

    return order;
  }

  // Enhanced webhook with auto-confirm
  async handlePaymentSessionWebhook(webhookData: any) {
    const { sessionId, transactionId, amount, status, bankReference } =
      webhookData;

    console.log('Payment webhook received:', webhookData);

    if (status === 'success') {
      const session = await this.paymentSessionModel.findOneAndUpdate(
        { sessionId, transactionId },
        {
          $set: {
            status: 'paid',
            paidAt: new Date(),
            bankReference,
          },
        },
        { new: true },
      );

      if (session) {
        try {
          const order = await this.confirmPaymentAndCreateOrder(sessionId);
          console.log('Order auto-created from webhook:', order.orderNumber);

          return {
            success: true,
            message: 'Thanh toán và tạo đơn hàng thành công',
            sessionId,
            orderNumber: order.orderNumber,
          };
        } catch (error) {
          console.error('Auto create order failed:', error);
          return {
            success: true,
            message: 'Thanh toán thành công nhưng tạo đơn hàng thất bại',
            sessionId,
          };
        }
      }
    }

    return { success: false, message: 'Thanh toán thất bại' };
  }

  // Cron job: Check pending payments every 5 minutes using Google Sheets
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkPendingPaymentsCron() {
    console.log('🔍 Checking pending payments via Google Sheets...');

    const pendingSessions = await this.paymentSessionModel.find({
      status: 'pending',
      paymentMethod: 'bank_transfer',
      expiresAt: { $gt: new Date() },
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
    });

    console.log(`Found ${pendingSessions.length} pending sessions to check`);

    let confirmedCount = 0;
    for (const session of pendingSessions) {
      try {
        const isPaid = await this.checkBankTransactionFromGoogleSheets(
          session.sessionId,
          session.totalAmount,
        );

        if (isPaid) {
          session.status = 'paid';
          session.paidAt = new Date();
          await session.save();

          try {
            const order = await this.confirmPaymentAndCreateOrder(
              session.sessionId,
            );
            console.log(
              `✅ Auto confirmed payment for session: ${session.sessionId} -> Order: ${order.orderNumber}`,
            );
            confirmedCount++;
          } catch (error) {
            console.error(
              `❌ Failed to create order for session ${session.sessionId}:`,
              error,
            );
          }
        }
      } catch (error) {
        console.error(`❌ Error checking session ${session.sessionId}:`, error);
      }
    }

    if (confirmedCount > 0) {
      console.log(`🎉 Successfully confirmed ${confirmedCount} payments`);
    }
  }

  // Check bank transaction from Google Sheets
  private async checkBankTransactionFromGoogleSheets(
    sessionId: string,
    expectedAmount: number,
  ): Promise<boolean> {
    try {
      const googleSheetsUrl =
        'https://script.googleusercontent.com/macros/echo?user_content_key=AehSKLgEkIe5D0pjwmMqxZvfQUFgERMUbIf0mmtj3wHsArhuuLhawWkKBm41okCESaX8nzh_L8yrh9qQCIbnV03IWqVW9mRoQuhuuw6XszsC1TWkxUYf2XTWZh6bKUpU9m7Wf6-az-3Gry8LOvr75pSxUz-6s03AC9fRSTR80gTKyhAQs_UlLfnSHVT4KIlwxA0dSR0qFEP6KwMuzEr9bs1TjfYuxBJs7Y_RvItn5nExeRhWjuQd-gIZPugeFFXzvGov7ycktEDWWexZdvinrcr6rbWswV-Hag&lib=MmEi5WXS_m9PGYbvzwuzKAG44Rhk0v8Km';

      const response = await fetch(googleSheetsUrl);
      const result = await response.json();

      console.log('Google Sheets response:', result);

      // Check if response has data array
      if (!result || !result.data || !Array.isArray(result.data)) {
        console.log('Invalid response structure from Google Sheets', result);
        return false;
      }

      const transactions = result.data;

      // Extract timestamp from sessionId for flexible matching
      // SESSION_1749192317927_cx67a1uwz -> 1749192317927
      const sessionTimestamp = sessionId.replace('SESSION_', '').split('_')[0];

      // Multiple search patterns
      const searchPatterns = [
        `Thanh toan session ${sessionId}`, // Full sessionId
        `Thanh toan session SESSION${sessionTimestamp}`, // Without underscores
        `SESSION${sessionTimestamp}`, // Just the timestamp part
        sessionTimestamp, // Just timestamp
      ];

      console.log(`Searching for patterns: ${searchPatterns.join(', ')}`);

      for (const transaction of transactions) {
        const description =
          transaction['Mô tả'] || transaction.description || '';
        const amount = parseFloat(
          transaction['Giá trị'] || transaction.amount || 0,
        );

        console.log(`Checking transaction: ${description} - Amount: ${amount}`);

        // Check multiple patterns
        for (const pattern of searchPatterns) {
          if (
            description.includes(pattern) &&
            Math.abs(amount - expectedAmount) < 1
          ) {
            console.log(
              `💰 Payment found for session ${sessionId} with pattern "${pattern}": ${description} - Amount: ${amount}`,
            );
            return true;
          }
        }
      }

      console.log(
        `💭 No payment found for session ${sessionId} with any pattern`,
      );
      return false;
    } catch (error) {
      console.error('Error checking Google Sheets:', error);
      return false;
    }
  }

  // Cron job: Cleanup expired sessions every 30 minutes
  @Cron(CronExpression.EVERY_30_MINUTES)
  async cleanupExpiredSessionsCron() {
    console.log('🧹 Cleaning up expired sessions...');

    const result = await this.paymentSessionModel.updateMany(
      {
        status: 'pending',
        expiresAt: { $lt: new Date() },
      },
      {
        $set: { status: 'expired' },
      },
    );

    console.log(`🗑️ Expired ${result.modifiedCount} payment sessions`);
  }

  // Manual check payment for admin/testing
  async manualCheckPayment(sessionId: string) {
    const session = await this.paymentSessionModel.findOne({ sessionId });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.status !== 'pending') {
      return { status: session.status, message: 'Session already processed' };
    }

    // Force check Google Sheets
    const isPaid = await this.checkBankTransactionFromGoogleSheets(
      sessionId,
      session.totalAmount,
    );

    if (isPaid) {
      session.status = 'paid';
      session.paidAt = new Date();
      await session.save();

      const order = await this.confirmPaymentAndCreateOrder(sessionId);
      return {
        status: 'confirmed',
        message: 'Payment confirmed and order created',
        orderNumber: order.orderNumber,
      };
    }

    return { status: 'still_pending', message: 'Payment not yet received' };
  }

  // Get orders by phone or email (for guest tracking)
  async getOrdersByContact(contact: string) {
    const orders = await this.orderModel
      .find({
        $or: [{ 'shipping.phone': contact }, { 'shipping.email': contact }],
      })
      .select(
        'orderNumber status pricing.totalAmount createdAt shipping.fullName',
      )
      .sort({ createdAt: -1 })
      .limit(10);

    return orders;
  }

  // Get status text in Vietnamese
  private getStatusText(status: string): string {
    const statusMap = {
      pending: 'Đang chờ xác nhận',
      confirmed: 'Đã xác nhận',
      preparing: 'Đang chuẩn bị',
      shipping: 'Đang giao hàng',
      delivered: 'Đã giao hàng thành công',
      cancelled: 'Đã hủy',
    };

    return statusMap[status] || 'Không xác định';
  }

  // Generate status timeline
  private getStatusTimeline(currentStatus: string, createdAt: Date) {
    const statuses = [
      { key: 'pending', text: 'Đơn hàng đã được tạo', icon: '📝' },
      { key: 'confirmed', text: 'Đơn hàng đã được xác nhận', icon: '✅' },
      { key: 'preparing', text: 'Đang chuẩn bị bánh', icon: '👨‍🍳' },
      { key: 'shipping', text: 'Đang giao hàng', icon: '🚚' },
      { key: 'delivered', text: 'Đã giao hàng thành công', icon: '🎉' },
    ];

    const currentIndex = statuses.findIndex((s) => s.key === currentStatus);

    return statuses.map((status, index) => ({
      ...status,
      completed: index <= currentIndex,
      current: index === currentIndex,
      timestamp: index === 0 ? createdAt : null,
    }));
  }

  // Helper methods
  private getBankAccountNumber(bankCode: string): string {
    const bankAccounts = {
      VCB: '1031293650',
    };
    return bankAccounts[bankCode];
  }

  private generateQRCode(
    bankCode: string,
    amount: number,
    orderNumber: string,
  ): string {
    const accountNumber = this.getBankAccountNumber(bankCode);
    const transferContent = `Thanh toan don hang ${orderNumber}`;

    return `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.jpg?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}`;
  }

  private generateQRCodeForSession(
    bankCode: string,
    amount: number,
    sessionId: string,
  ): string {
    const accountNumber = this.getBankAccountNumber(bankCode);
    const transferContent = `Thanh toan session ${sessionId}`;

    return `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.jpg?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}`;
  }
}
