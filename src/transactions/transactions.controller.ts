import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { BankTransaction } from '../users/interfaces/bank-transaction.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Request } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Transaction,
  TransactionDocument,
} from './entities/transaction.entity';
import { successResponse } from '../helper/response.helper';

@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
  ) {}

  @Post('verify')
  async verifyTransaction(@Body() transaction: BankTransaction) {
    const success =
      await this.transactionsService.verifyAndProcess(transaction);
    return {
      success,
      message: success
        ? 'Transaction processed successfully'
        : 'Transaction failed',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/history')
  async getUserTransactions(@Req() req) {
    console.log('Full request user object:', req.user);

    // Kiểm tra các ID có thể có
    const userId = req.user.id || req.user._id || req.user.sub;
    console.log('Using userId:', userId);

    if (!userId) {
      return {
        transactions: [],
        error: 'User ID not found in token',
        user: req.user,
      };
    }
    const transactions = await this.transactionsService.findByUserId(userId);
    return { transactions };
  }

  // Admin endpoints
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Get('admin/all')
  async getAllTransactions(@Query() query: any) {
    const result = await this.transactionsService.findAllForAdmin(query);
    return successResponse(result, 'Lấy danh sách giao dịch thành công');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Get('admin/revenue-stats')
  async getRevenueStats(@Query() query: any) {
    const stats = await this.transactionsService.getRevenueStats(query);
    return successResponse(stats, 'Lấy thống kê doanh thu thành công');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Get('admin/stats-by-type')
  async getTransactionStatsByType() {
    const stats = await this.transactionsService.getTransactionStatsByType();
    return successResponse(
      stats,
      'Lấy thống kê giao dịch theo loại thành công',
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Get('admin/recent')
  async getRecentTransactions(@Query('limit') limit?: string) {
    const transactions = await this.transactionsService.getRecentTransactions(
      limit ? parseInt(limit) : 10,
    );
    return successResponse(transactions, 'Lấy giao dịch gần đây thành công');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Get('admin/dashboard-summary')
  async getDashboardSummary() {
    const [revenueStats, typeStats, recentTransactions] = await Promise.all([
      this.transactionsService.getRevenueStats(),
      this.transactionsService.getTransactionStatsByType(),
      this.transactionsService.getRecentTransactions(5),
    ]);

    const summary = {
      totalRevenue: revenueStats.overallStats.totalRevenue,
      totalTransactions: revenueStats.overallStats.totalTransactions,
      avgTransactionAmount: revenueStats.overallStats.avgTransactionAmount,
      typeStats,
      recentTransactions,
    };

    return successResponse(summary, 'Lấy tổng quan dashboard thành công');
  }
}
