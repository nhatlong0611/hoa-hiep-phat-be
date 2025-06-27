import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../entities/user.entity';

@Injectable()
export class VietQRService {
  constructor(
    private configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ) {}

  async generateDepositQRCode(amount: number, userId: string): Promise<{ qrCodeUrl: string, transactionCode: string }> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const transactionCode = `NAPTIEN${user.userCode}`;
    const bankId = this.configService.get('BANK_ID');
    const accountNo = this.configService.get('BANK_ACCOUNT_NO');
    const accountName = this.configService.get('BANK_ACCOUNT_NAME');
    const template = 'compact2';
    
    const encodedAccountName = encodeURIComponent(accountName);
    const encodedDescription = encodeURIComponent(transactionCode);

    const qrCodeUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${amount}&addInfo=${encodedDescription}&accountName=${encodedAccountName}`;

    return {
      qrCodeUrl,
      transactionCode
    };
  }
}
