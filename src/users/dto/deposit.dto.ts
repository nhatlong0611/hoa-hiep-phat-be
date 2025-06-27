import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class DepositDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;
}
