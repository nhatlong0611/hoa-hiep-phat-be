import { IsNotEmpty, IsString, IsEmail, IsOptional } from 'class-validator';

export class VerifyGuestReviewDto {
  @IsNotEmpty()
  @IsString()
  orderNumber: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;
}
