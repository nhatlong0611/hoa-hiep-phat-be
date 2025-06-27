import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { successResponse } from '../helper/response.helper';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(+id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(+id);
  }

  // Track order by order number (public API - no auth required)
  @Get('track/:orderNumber')
  async trackOrder(@Param('orderNumber') orderNumber: string) {
    const order = await this.ordersService.trackOrder(orderNumber);
    return successResponse(order, 'Lấy thông tin đơn hàng thành công');
  }

  // Get order details by ID
  @Get('details/:id')
  async getOrderDetails(@Param('id') id: string) {
    const order = await this.ordersService.getOrderDetails(id);
    return successResponse(order, 'Lấy chi tiết đơn hàng thành công');
  }

  // Update order status (admin only - you might want to add auth guard)
  @Patch('status/:id')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() statusUpdate: { status: string; note?: string },
  ) {
    const order = await this.ordersService.updateOrderStatus(id, statusUpdate);
    return successResponse(order, 'Cập nhật trạng thái đơn hàng thành công');
  }

  // Create payment for order (bank transfer)
  @Post('payment/:orderNumber')
  async createOrderPayment(
    @Param('orderNumber') orderNumber: string,
    @Body() paymentData: { bankCode: string; amount: number },
  ) {
    const payment = await this.ordersService.createOrderPayment(
      orderNumber,
      paymentData,
    );
    return successResponse(payment, 'Tạo thanh toán thành công');
  }

  // Check payment status
  @Get('payment/:orderNumber/status')
  async checkOrderPaymentStatus(@Param('orderNumber') orderNumber: string) {
    const status =
      await this.ordersService.checkOrderPaymentStatus(orderNumber);
    return successResponse(status, 'Kiểm tra trạng thái thanh toán thành công');
  }

  // Webhook for payment confirmation (from bank/payment gateway)
  @Post('payment/webhook')
  async paymentWebhook(@Body() webhookData: any) {
    const result = await this.ordersService.handlePaymentWebhook(webhookData);
    return successResponse(result, 'Xử lý webhook thành công');
  }

  // Create payment session
  @Post('payment-session')
  async createPaymentSession(
    @Body()
    sessionData: {
      bankCode: string;
      amount: number;
      orderData: any;
      customerInfo: any;
    },
  ) {
    const session = await this.ordersService.createPaymentSession(sessionData);
    return successResponse(session, 'Tạo phiên thanh toán thành công');
  }

  // Check payment session status
  @Get('payment-session/:sessionId/status')
  async checkPaymentSessionStatus(@Param('sessionId') sessionId: string) {
    const status =
      await this.ordersService.checkPaymentSessionStatus(sessionId);
    return successResponse(
      status,
      'Kiểm tra trạng thái phiên thanh toán thành công',
    );
  }

  // Confirm payment and create order
  @Post('payment-session/:sessionId/confirm')
  async confirmPaymentAndCreateOrder(@Param('sessionId') sessionId: string) {
    const order =
      await this.ordersService.confirmPaymentAndCreateOrder(sessionId);
    return successResponse(order, 'Tạo đơn hàng thành công');
  }

  // Webhook for payment session
  @Post('payment-session/webhook')
  async paymentSessionWebhook(@Body() webhookData: any) {
    const result =
      await this.ordersService.handlePaymentSessionWebhook(webhookData);
    return successResponse(result, 'Xử lý webhook phiên thanh toán thành công');
  }

  // Manual check payment for admin
  @Post('payment-session/:sessionId/manual-check')
  async manualCheckPayment(@Param('sessionId') sessionId: string) {
    const result = await this.ordersService.manualCheckPayment(sessionId);
    return successResponse(result, 'Manual payment check completed');
  }

  // Force run pending payments check (for testing)
  @Post('admin/check-pending-payments')
  async forceCheckPendingPayments() {
    await this.ordersService.checkPendingPaymentsCron();
    return successResponse({}, 'Pending payments check completed');
  }
}
