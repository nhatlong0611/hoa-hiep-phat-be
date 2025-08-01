import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Request,
} from '@nestjs/common';
import { PaymentService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { successResponse, errorResponse } from '../helper/response.helper';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create')
  async createPayment(@Body() createPaymentDto: CreatePaymentDto) {
    try {
      const payment = await this.paymentService.createPayment(
        null,
        createPaymentDto,
      );
      return successResponse(payment, 'Payment created successfully');
    } catch (error) {
      return errorResponse(error.message);
    }
  }

  @Post('sepay/webhook')
  async handleSepayWebhook(@Body() webhookData: any, @Request() req) {
    try {
      const authHeader =
        req.headers['authorization'] || req.headers['Authorization'] || '';
      const result = await this.paymentService.handleSepayWebhook(
        webhookData,
        authHeader,
      );
      return successResponse(result, 'Webhook processed successfully');
    } catch (error) {
      return errorResponse(error.message);
    }
  }

  @Get('status/:paymentId')
  async getPaymentStatus(@Param('paymentId') paymentId: string) {
    try {
      const payment = await this.paymentService.getPaymentStatus(paymentId);
      return successResponse(payment, 'Payment status retrieved successfully');
    } catch (error) {
      return errorResponse(error.message);
    }
  }

  @Get('check-status/:orderCode')
  async checkPaymentStatus(@Param('orderCode') orderCode: string) {
    try {
      console.log('Received orderCode:', orderCode);
      const payment =
        await this.paymentService.getPaymentByOrderCode(orderCode);
      return successResponse(payment, 'Payment status retrieved successfully');
    } catch (error) {
      console.error('Error checking payment status:', error.message);
      return errorResponse(error.message);
    }
  }

  @Get('debug/payment/:orderCode')
  async debugGetPayment(@Param('orderCode') orderCode: string) {
    try {
      console.log('🔍 Debug: Looking for orderCode:', orderCode);

      // Raw MongoDB query
      const payment = await this.paymentService.debugGetRawPayment(orderCode);

      console.log(
        '📋 Debug: Raw payment from DB:',
        JSON.stringify(payment, null, 2),
      );

      return successResponse(payment, 'Raw payment data retrieved');
    } catch (error) {
      console.error('🚨 Debug error:', error);
      return errorResponse(error.message);
    }
  }

  @Get('list')
  async getAllPayments(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    try {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;

      const result = await this.paymentService.getAllPayments(
        pageNum,
        limitNum,
        status,
        search,
      );
      return successResponse(result, 'Payments retrieved successfully');
    } catch (error) {
      return errorResponse(error.message);
    }
  }

  @Get('user/list')
  async getUserPayments(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    try {
      const userId = req.user.sub || req.user.id;
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;

      const result = await this.paymentService.getPaymentsByUserId(
        userId,
        pageNum,
        limitNum,
      );
      return successResponse(result, 'User payments retrieved successfully');
    } catch (error) {
      return errorResponse(error.message);
    }
  }

  @Get('details/:paymentId')
  async getPaymentById(@Param('paymentId') paymentId: string) {
    try {
      const payment = await this.paymentService.getPaymentById(paymentId);
      return successResponse(payment, 'Payment details retrieved successfully');
    } catch (error) {
      return errorResponse(error.message);
    }
  }

  @Get('status-filter/:status')
  async getPaymentsByStatus(
    @Param('status') status: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    try {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;

      const result = await this.paymentService.getPaymentsByStatus(
        status,
        pageNum,
        limitNum,
      );
      return successResponse(
        result,
        'Payments filtered by status retrieved successfully',
      );
    } catch (error) {
      return errorResponse(error.message);
    }
  }

  @Get('statistics')
  async getPaymentStatistics() {
    try {
      const statistics = await this.paymentService.getPaymentStatistics();
      return successResponse(
        statistics,
        'Payment statistics retrieved successfully',
      );
    } catch (error) {
      return errorResponse(error.message);
    }
  }
}
