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

class SelectedBox {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsNumber()
  price: number;
}

class EggOption {
  @IsString()
  id: string; // "1_egg", "2_egg", "no_egg"

  @IsString()
  name: string; // "1 trứng (150g)", "2 trứng (180g)", "Chay"

  @IsNumber()
  price: number; // Giá của option này

  @IsNumber()
  weight: number; // Trọng lượng (gram)
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

  @IsObject()
  @ValidateNested()
  @Type(() => EggOption)
  @IsOptional()
  selectedEgg?: EggOption;
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
