import { IsNumber } from 'class-validator';

export class DepositRequestDto {
  @IsNumber()
  amount: number;
}
