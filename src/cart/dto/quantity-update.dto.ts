import { IsNumber, IsNotEmpty, Min } from 'class-validator';

export class QuantityUpdateDto {
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  quantity: number;
}
