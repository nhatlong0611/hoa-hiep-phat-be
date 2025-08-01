import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: String, default: 'VND' })
  currency: string;

  @Prop({
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending',
  })
  status: string;

  @Prop({ type: String, default: 'sepay' })
  paymentMethod: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: String, unique: true })
  orderCode: string;

  @Prop({ type: Date })
  paidAt: Date;

  @Prop({ type: String })
  sepayId: string;

  @Prop({ type: String })
  sepayTransactionId: string;

  @Prop({ type: String })
  sepayReferenceCode: string;

  @Prop({ type: String })
  sepayGateway: string;

  @Prop({ type: Object })
  sepayWebhook: Record<string, any>;

  @Prop({ type: Object })
  orderData: any;

  @Prop({ type: Object })
  customerInfo: any;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
