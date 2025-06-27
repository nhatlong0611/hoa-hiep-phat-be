import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Review extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  userId?: Types.ObjectId; // Optional - chỉ có khi user đã đăng nhập
  @Prop({ required: true })
  customerName: string;

  @Prop({ required: false })
  customerEmail?: string;

  @Prop()
  customerPhone?: string; // Thêm số điện thoại cho guest user

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ required: true })
  comment: string;

  @Prop([String])
  images?: string[];

  @Prop({ default: 'pending', enum: ['pending', 'approved', 'rejected'] })
  status: string;
  @Prop({ type: Types.ObjectId, ref: 'Order' })
  orderId?: Types.ObjectId; // Guest order cũng có thể link được

  @Prop({ default: false })
  isVerifiedPurchase: boolean; // Kiểm tra từ order number hoặc email

  @Prop({ default: false })
  isGuestReview: boolean; // Đánh dấu đây là review từ guest

  @Prop()
  orderNumber?: string; // Lưu order number để verify cho guest

  @Prop()
  adminReply?: string;

  @Prop()
  adminReplyAt?: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
