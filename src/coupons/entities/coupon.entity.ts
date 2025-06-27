import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CouponDocument = Coupon & Document;

@Schema({ timestamps: true })
export class Coupon {
  @Prop({ type: MongooseSchema.Types.ObjectId, auto: true })
  _id: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, required: true, unique: true })
  code: string;

  @Prop({ type: Number, required: true })
  discountPercent: number;

  @Prop({ type: Number })
  maxDiscount: number;

  @Prop({ type: Date, required: true })
  expiresAt: Date;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Number, default: 0 })
  usageCount: number;

  @Prop({ type: Number })
  maxUsage: number;

  @Prop()
  createdAt: Date;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
