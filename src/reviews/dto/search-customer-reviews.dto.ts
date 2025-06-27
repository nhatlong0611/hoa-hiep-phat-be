import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class SearchCustomerReviewsDto {
  @IsNotEmpty()
  @IsString()
  customerName: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;
}
