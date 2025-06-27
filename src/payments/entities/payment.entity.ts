import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: MongooseSchema.Types.ObjectId, auto: true })
  _id: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Order', required: true })
  order: MongooseSchema.Types.ObjectId;

  @Prop({ 
    type: String, 
    required: true,
    enum: ['vnpay', 'momo', 'stripe'] 
  })
  provider: string;

  @Prop({ type: Object, required: true })
  payload: Record<string, any>;

  @Prop({ type: Boolean, default: false })
  verified: boolean;

  @Prop({ type: Date, required: true, default: Date.now })
  receivedAt: Date;

  @Prop()
  createdAt: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
