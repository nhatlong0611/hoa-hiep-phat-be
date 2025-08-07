import {
  IsNumber,
  IsOptional,
  IsString,
  IsObject,
  IsArray,
  IsBoolean,
  ValidateNested,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

class SelectedBox {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsNumber()
  price: number;
}

class OrderItem {
  @IsString()
  productId: string;

  @IsString()
  @IsOptional()
  productName?: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  price: number;

  @IsNumber()
  @IsOptional()
  boxPrice?: number;

  @IsNumber()
  @IsOptional()
  totalPrice?: number;

  @IsString()
  @IsOptional()
  image?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsObject()
  @ValidateNested()
  @Type(() => SelectedBox)
  @IsOptional()
  selectedBox?: SelectedBox;
}

class ShippingInfo {
  @IsString()
  fullName: string;

  @IsString()
  phone: string;

  @IsString()
  email: string;

  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  ward?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

class PaymentInfo {
  @IsString()
  method: string;

  @IsNumber()
  amount: number;

  @IsString()
  status: string;

  @IsString()
  @IsOptional()
  transactionId?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  paidAt?: Date;

  @IsString()
  @IsOptional()
  sepayTransactionId?: string;

  @IsString()
  @IsOptional()
  sepayReferenceCode?: string;
}

class DeliveryInfo {
  @IsString()
  method: string;

  @IsNumber()
  fee: number;
}

class PricingInfo {
  @IsNumber()
  subtotal: number;

  @IsNumber()
  deliveryFee: number;

  @IsNumber()
  totalAmount: number;
}

export class CreateOrderDto {
  @IsString()
  orderNumber: string;

  @IsString()
  orderType: string; // 'guest' or 'user'

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItem)
  items: OrderItem[];

  @IsObject()
  @ValidateNested()
  @Type(() => ShippingInfo)
  shipping: ShippingInfo;

  @IsObject()
  @ValidateNested()
  @Type(() => PaymentInfo)
  payment: PaymentInfo;

  @IsObject()
  @ValidateNested()
  @Type(() => DeliveryInfo)
  delivery: DeliveryInfo;

  @IsObject()
  @ValidateNested()
  @Type(() => PricingInfo)
  pricing: PricingInfo;

  @IsOptional()
  @IsString()
  note?: string;

  @IsString()
  status: string;

  @IsBoolean()
  @IsOptional()
  createAccount?: boolean;
}
