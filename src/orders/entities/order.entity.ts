import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

// Shipping information schema
class ShippingInfo {
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

// Selected box schema
class SelectedBox {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  price: number;
}

// Order item schema
class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop()
  productName?: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  price: number;

  @Prop()
  boxPrice?: number;

  @Prop()
  totalPrice?: number;

  @Prop()
  image?: string;

  @Prop()
  note?: string;

  @Prop({ type: Object })
  selectedBox?: SelectedBox;
}

// Status history schema
class StatusHistory {
  @Prop({ required: true })
  status: string;

  @Prop()
  note?: string;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ required: true, unique: true })
  orderNumber: string;

  @Prop({ required: true })
  orderType: string; // 'guest' | 'user'

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId?: string;

  @Prop({ type: [OrderItem], required: true })
  items: OrderItem[];

  @Prop({ type: ShippingInfo, required: true })
  shipping: ShippingInfo;

  @Prop({
    type: {
      method: String,
      amount: Number,
      status: { type: String, default: 'pending' }, // 'pending', 'paid', 'failed'
      transactionId: String,
      paidAt: Date,
      expiresAt: Date,
    },
    required: true,
  })
  payment: {
    method: string;
    amount: number;
    status?: string;
    transactionId?: string;
    paidAt?: Date;
    expiresAt?: Date;
  };

  @Prop({
    type: {
      method: String,
      fee: Number,
    },
    required: true,
  })
  delivery: {
    method: string;
    fee: number;
  };

  @Prop({
    type: {
      subtotal: Number,
      deliveryFee: Number,
      totalAmount: Number,
    },
    required: true,
  })
  pricing: {
    subtotal: number;
    deliveryFee: number;
    totalAmount: number;
  };

  @Prop()
  note?: string;

  @Prop({ required: true, default: 'pending' })
  status: string; // 'pending', 'confirmed', 'preparing', 'shipping', 'delivered', 'cancelled'

  @Prop({ type: [StatusHistory], default: [] })
  statusHistory: StatusHistory[];

  @Prop({ default: false })
  createAccount?: boolean;

  // Automatically added by timestamps
  createdAt: Date;
  updatedAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
