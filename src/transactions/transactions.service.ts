import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import {
  Transaction,
  TransactionDocument,
} from './entities/transaction.entity';
import { BankTransaction } from '../users/interfaces/bank-transaction.interface';
import { UsersService } from '../users/users.service';
import { User, UserDocument } from '../users/entities/user.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    private usersService: UsersService,
  ) {}

  create(createTransactionDto: CreateTransactionDto) {
    return 'This action adds a new transaction';
  }
  findAll() {
    return this.transactionModel
      .find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }
  // Get all transactions with pagination and filters for admin dashboard
  async findAllForAdmin(query: any = {}) {
    const { page = 1, limit = 20, startDate, endDate, userId } = query;

    const filter: any = {};

    // Filter by user
    if (userId) {
      filter.userId = new mongoose.Types.ObjectId(userId);
    }

    // Filter by date range
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    const skip = (page - 1) * limit;

    const transactions = await this.transactionModel
      .find(filter)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .exec();

    const total = await this.transactionModel.countDocuments(filter);

    return {
      transactions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total: total,
        limit: parseInt(limit),
      },
    };
  }
  // Get revenue statistics for admin dashboard
  async getRevenueStats(query: any = {}) {
    const { startDate, endDate, groupBy = 'day' } = query;

    const matchStage: any = {
      processed: true, // Only count processed transactions as revenue
    };

    // Filter by date range
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) {
        matchStage.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        matchStage.createdAt.$lte = new Date(endDate);
      }
    }

    let groupFormat;
    switch (groupBy) {
      case 'hour':
        groupFormat = '%Y-%m-%d %H:00:00';
        break;
      case 'day':
        groupFormat = '%Y-%m-%d';
        break;
      case 'week':
        groupFormat = '%Y-%U';
        break;
      case 'month':
        groupFormat = '%Y-%m';
        break;
      case 'year':
        groupFormat = '%Y';
        break;
      default:
        groupFormat = '%Y-%m-%d';
    }
    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: groupFormat, date: '$createdAt' },
          },
          totalRevenue: { $sum: '$amount' },
          totalTransactions: { $sum: 1 },
          avgTransactionAmount: { $avg: '$amount' },
        },
      },
      { $sort: { _id: 1 as 1 } },
    ];

    const revenueData = await this.transactionModel.aggregate(pipeline);

    // Get overall stats
    const overallStats = await this.transactionModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalTransactions: { $sum: 1 },
          avgTransactionAmount: { $avg: '$amount' },
          maxTransactionAmount: { $max: '$amount' },
          minTransactionAmount: { $min: '$amount' },
        },
      },
    ]);

    return {
      revenueData,
      overallStats: overallStats[0] || {
        totalRevenue: 0,
        totalTransactions: 0,
        avgTransactionAmount: 0,
        maxTransactionAmount: 0,
        minTransactionAmount: 0,
      },
    };
  }
  // Get transaction statistics by type
  async getTransactionStatsByType() {
    // Since we don't have type field, we'll analyze by description patterns
    const stats = await this.transactionModel.aggregate([
      {
        $addFields: {
          transactionType: {
            $cond: {
              if: { $regexMatch: { input: '$description', regex: /NAPTIEN/i } },
              then: 'deposit',
              else: 'other',
            },
          },
        },
      },
      {
        $group: {
          _id: '$transactionType',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' },
        },
      },
      { $sort: { count: -1 as -1 } },
    ]);

    return stats;
  }

  // Get recent transactions for dashboard
  async getRecentTransactions(limit: number = 10) {
    return this.transactionModel
      .find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  findOne(id: number) {
    return `This action returns a #${id} transaction`;
  }

  update(id: number, updateTransactionDto: UpdateTransactionDto) {
    return `This action updates a #${id} transaction`;
  }

  remove(id: number) {
    return `This action removes a #${id} transaction`;
  }

  private parseTransactionCode(description: string): string | null {
    const match = description.match(/NAPTIEN(\d{3})/);
    return match ? match[1] : null;
  }

  async verifyAndProcess(bankTransaction: BankTransaction): Promise<boolean> {
    console.log('=== TRANSACTION VERIFICATION STARTED ===');
    console.log('Received transaction:', JSON.stringify(bankTransaction));

    try {
      // Kiểm tra dữ liệu đầu vào
      if (!bankTransaction.bankTransactionId) {
        console.log('Transaction failed: Missing required fields');
        return false;
      }

      const userCode = this.parseTransactionCode(bankTransaction.description);
      console.log('Parsed user code:', userCode);

      if (!userCode) {
        console.log('Transaction failed: Invalid transaction code format');
        return false;
      }

      try {
        const user = await this.usersService.findByUserCode(userCode);
        console.log('Found user:', user.email, 'with ID:', user._id);

        // Check if transaction already exists
        const existingTransaction = await this.transactionModel.findOne({
          bankTransactionId: bankTransaction.bankTransactionId,
        });

        if (existingTransaction) {
          console.log(
            'Transaction already processed:',
            bankTransaction.bankTransactionId,
          );
          return false;
        }
        console.log('Creating transaction record...');
        const transaction = new this.transactionModel({
          bankTransactionId: bankTransaction.bankTransactionId,
          amount: bankTransaction.amount,
          description: bankTransaction.description,
          transactionDate: new Date(bankTransaction.transactionDate),
          accountNumber: bankTransaction.accountNumber,
          userId: user._id,
          userCode: userCode,
          processed: true,
        });

        await transaction.save();
        console.log('Transaction record created successfully');

        console.log(
          'Depositing amount:',
          bankTransaction.amount,
          'to user account',
        );
        await this.usersService.deposit(
          user._id.toString(),
          bankTransaction.amount,
          `Bank deposit - Transaction ID: ${bankTransaction.bankTransactionId}`,
        );
        console.log(
          'Deposit successful. New balance:',
          user.balance + bankTransaction.amount,
        );

        console.log('=== TRANSACTION VERIFICATION COMPLETED SUCCESSFULLY ===');
        return true;
      } catch (error) {
        console.log('Error details:', error.message);
        console.log('=== TRANSACTION VERIFICATION FAILED ===');
        return false;
      }
    } catch (error) {
      console.error('=== TRANSACTION VERIFICATION ERROR ===');
      console.error('Error processing transaction:', error.message);
      console.error('Stack trace:', error.stack);
      return false;
    }
  }

  async findByTransactionId(
    bankTransactionId: number,
  ): Promise<TransactionDocument | null> {
    return this.transactionModel.findOne({ bankTransactionId }).exec();
  }

  async findByUserId(userId: string | any): Promise<TransactionDocument[]> {
    console.log('Finding transactions for userId (raw):', userId);

    if (!userId) {
      console.error('Invalid userId provided:', userId);
      return [];
    }

    // Chuyển đổi userId thành string nếu là object
    const userIdStr =
      typeof userId === 'object' && userId.toString
        ? userId.toString()
        : userId;
    console.log('userId as string:', userIdStr);

    try {
      // Đảm bảo userId đúng định dạng ObjectId
      const objectIdUserId = new mongoose.Types.ObjectId(userIdStr);
      console.log('Converted to ObjectId:', objectIdUserId);

      const transactions = await this.transactionModel
        .find({ userId: objectIdUserId })
        .sort({ createdAt: -1 })
        .exec();

      console.log(
        `Found ${transactions.length} transactions in database for userId:`,
        userIdStr,
      );
      return transactions;
    } catch (error) {
      console.error('Error finding transactions:', error.message);
      return [];
    }
  }
}
