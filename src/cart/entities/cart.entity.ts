import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

// Class cho từng item trong giỏ hàng
class CartItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  @IsNotEmpty()
  productId: string;

  @Prop({ required: true })
  @IsString()
  productName: string;

  @Prop()
  @IsString()
  image: string;

  @Prop({ required: true })
  @IsNumber()
  @Min(0)
  price: number;

  @Prop({ required: true, min: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @Prop()
  note?: string; // Ghi chú cho từng sản phẩm (ví dụ: "Không cho trứng muối")
}

@Schema({ timestamps: true })
export class Cart extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ type: [CartItem], default: [] })
  items: CartItem[];

  @Prop({ default: 0 })
  @IsNumber()
  @Min(0)
  totalAmount: number; // Tổng tiền của giỏ hàng

  @Prop({ default: 0 })
  @IsNumber()
  itemCount: number; // Tổng số sản phẩm trong giỏ

  @Prop({ default: false })
  isCheckedOut: boolean; // Đánh dấu giỏ hàng đã checkout chưa

  // Tự động được thêm bởi timestamps
  createdAt: Date;
  updatedAt: Date;
}

export const CartSchema = SchemaFactory.createForClass(Cart);

// Middleware để tự động tính totalAmount và itemCount
CartSchema.pre('save', function(next) {
  if (this.items) {
    this.totalAmount = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    this.itemCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
  }
  next();
});
