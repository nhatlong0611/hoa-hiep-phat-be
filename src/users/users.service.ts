import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  private async generateUserCode(): Promise<string> {
    while (true) {
      // Tạo số ngẫu nhiên 3 chữ số
      const code = String(Math.floor(Math.random() * 900) + 100);

      // Kiểm tra xem mã đã tồn tại chưa
      const existingUser = await this.userModel.findOne({ userCode: code });
      if (!existingUser) {
        return code;
      }
    }
  }

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email,
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const userCode = await this.generateUserCode();
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const newUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      userCode,
    });

    return newUser.save();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().exec();
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async findOne(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async remove(id: string): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndDelete(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async deposit(
    userId: string,
    amount: number,
    description?: string,
  ): Promise<UserDocument> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.balance = (user.balance || 0) + amount;

    if (!user.transactions) {
      user.transactions = [];
    }

    user.transactions.push({
      type: 'deposit',
      amount,
      description,
      createdAt: new Date(),
    });

    return await user.save();
  }

  async withdraw(
    userId: string,
    amount: number,
    description?: string,
  ): Promise<UserDocument> {
    const user = await this.findById(userId);
    if (user.balance < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    user.balance -= amount;
    user.transactions.push({
      type: 'withdraw',
      amount,
      description,
      createdAt: new Date(),
    });
    return await user.save();
  }

  async getTransactions(userId: string) {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.transactions || [];
  }

  async findByUserCode(userCode: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ userCode }).exec();
    if (!user) {
      throw new NotFoundException(`User with code ${userCode} not found`);
    }
    return user;
  }

  async getUserProfile(userId: string): Promise<UserDocument> {
    const user = await this.userModel
      .findById(userId)
      .select('-password') // Loại bỏ trường password
      .exec();
      
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
