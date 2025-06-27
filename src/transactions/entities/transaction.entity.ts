import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ required: true })
  bankTransactionId: number; // Mã GD từ ngân hàng

  @Prop({ required: true })
  amount: number; // Giá trị

  @Prop({ required: true })
  description: string; // Mô tả

  @Prop({ required: true })
  transactionDate: Date; // Ngày diễn ra

  @Prop({ required: true })
  accountNumber: string; // Số tài khoản
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: MongooseSchema.Types.ObjectId;
  @Prop({ required: true })
  userCode: string;

  @Prop({ default: true })
  processed: boolean;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
