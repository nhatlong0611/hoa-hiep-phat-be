import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Session cart item (keep as string for flexibility in payment session)
class SessionCartItem {
  @Prop({ required: true })
  productId: string; // Keep as string in session, convert to ObjectId when creating order

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  price: number;

  @Prop()
  note?: string;
}

// Session shipping info
class SessionShippingInfo {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  district: string;

  @Prop()
  ward?: string;

  @Prop()
  note?: string;
}

@Schema({ timestamps: true })
export class PaymentSession extends Document {
  @Prop({ required: true, unique: true })
  sessionId: string;

  @Prop({ type: [SessionCartItem], required: true })
  items: SessionCartItem[];

  @Prop({ type: SessionShippingInfo, required: true })
  shippingInfo: SessionShippingInfo;

  @Prop({ required: true })
  paymentMethod: string;

  @Prop({ required: true })
  deliveryMethod: string;

  @Prop({ required: true })
  subtotal: number;

  @Prop({ required: true })
  deliveryFee: number;

  @Prop({ required: true })
  totalAmount: number;

  @Prop()
  note?: string;

  @Prop({ required: true })
  isGuestOrder: boolean;

  @Prop({ default: false })
  createAccount?: boolean;

  // Payment info
  @Prop()
  bankCode?: string;

  @Prop()
  transactionId?: string;

  @Prop()
  qrCode?: string;

  @Prop()
  accountNumber?: string;

  @Prop()
  transferContent?: string;

  @Prop({ required: true, default: 'pending' })
  status: string; // 'pending', 'paid', 'expired', 'cancelled'

  @Prop({ required: true })
  expiresAt: Date;

  @Prop()
  paidAt?: Date;

  @Prop()
  orderNumber?: string; // Set when order is created

  // Auto timestamps
  createdAt: Date;
  updatedAt: Date;
}

export const PaymentSessionSchema =
  SchemaFactory.createForClass(PaymentSession);
