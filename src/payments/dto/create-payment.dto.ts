import {
  IsNumber,
  IsOptional,
  IsString,
  IsObject,
  IsArray,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class OrderItem {
  @IsString()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  note?: string;
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

class OrderData {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItem)
  items: OrderItem[];

  @IsObject()
  @ValidateNested()
  @Type(() => ShippingInfo)
  shippingInfo: ShippingInfo;

  @IsString()
  paymentMethod: string;

  @IsString()
  deliveryMethod: string;

  @IsNumber()
  subtotal: number;

  @IsNumber()
  deliveryFee: number;

  @IsNumber()
  totalAmount: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsBoolean()
  isGuestOrder: boolean;

  @IsBoolean()
  createAccount: boolean;
}

export class CreatePaymentDto {
  @IsString()
  bankCode: string;

  @IsNumber()
  amount: number;

  @IsObject()
  @ValidateNested()
  @Type(() => OrderData)
  orderData: OrderData;

  @IsObject()
  @ValidateNested()
  @Type(() => ShippingInfo)
  customerInfo: ShippingInfo;
}
