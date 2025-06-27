import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// DTO for cart items with price included
class OrderCartItem {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @IsOptional()
  note?: string;
}

// Shipping information
class ShippingInfo {
  @IsString()
  fullName: string;

  @IsString()
  phone: string;

  @IsEmail()
  email: string;

  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsString()
  district: string;

  @IsString()
  @IsOptional()
  ward?: string;

  @IsString()
  @IsOptional()
  note?: string;
}

// New order DTO
export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderCartItem)
  items: OrderCartItem[];

  @ValidateNested()
  @Type(() => ShippingInfo)
  shippingInfo: ShippingInfo;

  @IsString()
  paymentMethod: string; // 'cod', 'bank_transfer', 'momo'

  @IsString()
  deliveryMethod: string; // 'standard', 'express'

  @IsNumber()
  @Min(0)
  subtotal: number;

  @IsNumber()
  @Min(0)
  deliveryFee: number;

  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsString()
  @IsOptional()
  note?: string;

  @IsBoolean()
  isGuestOrder: boolean;

  @IsBoolean()
  @IsOptional()
  createAccount?: boolean;
}

// DTO for guest cart items (no authentication required)
class GuestCartItem {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  note?: string;
}

// For authenticated users (optional)
class CartItemUpdate {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(0)
  quantity: number;
}

// For guest checkout - no authentication needed
export class GuestCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuestCartItem)
  items: GuestCartItem[];
}

// For authenticated users (keep existing functionality)
export class UpdateCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemUpdate)
  items: CartItemUpdate[];
}

// Guest checkout information
export class GuestCheckoutDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuestCartItem)
  items: GuestCartItem[];

  // Customer information
  @IsString()
  customerName: string;

  @IsEmail()
  customerEmail: string;

  @IsString()
  customerPhone: string;

  // Delivery address
  @IsString()
  deliveryAddress: string;

  @IsString()
  @IsOptional()
  deliveryNote?: string;

  // Payment method
  @IsString()
  paymentMethod: string; // 'cod', 'bank_transfer', 'momo', etc.
}

// Validate cart items (check stock, calculate total)
export class CartValidationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuestCartItem)
  items: GuestCartItem[];
}
