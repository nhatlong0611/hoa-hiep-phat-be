import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { DepositRequestDto } from './dto/deposit-request.dto';
import { DepositDto } from './dto/deposit.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { TransactionsService } from 'src/transactions/transactions.service';
import { BankTransaction } from './interfaces/bank-transaction.interface';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly transactionsService: TransactionsService,
  ) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // Move all specific routes before parameterized routes
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@GetUser() user) {
    console.log('Getting profile for user:', user.id);
    const userProfile = await this.usersService.getUserProfile(user.id);
    const { password, __v, ...profile } = userProfile.toObject();
    return { user: profile };
  }

  @Post('verify-transaction')
  async verifyTransaction(@Body() transaction: BankTransaction) {
    const success =
      await this.transactionsService.verifyAndProcess(transaction);
    return {
      success,
      message: success
        ? 'Transaction processed successfully'
        : 'Failed to process transaction',
    };
  }

  // Then put all parameterized routes
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post(':id/deposit')
  async deposit(@Param('id') id: string, @Body() depositDto: DepositDto) {
    return this.usersService.deposit(
      id,
      depositDto.amount,
      depositDto.description,
    );
  }

  @Get(':id/balance')
  async getBalance(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return { balance: user.balance };
  }

  @Get(':id/transactions')
  async getTransactions(@Param('id') id: string) {
    return this.usersService.getTransactions(id);
  }

  @Get(':id/payment-code')
  async getPaymentCode(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return {
      userCode: user.userCode,
      description: `NAPTIEN${user.userCode}`,
    };
  }
}
