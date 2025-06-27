import { IsNotEmpty, IsString, IsNumber, Min, IsArray } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  type: string[];

  @IsString()
  @IsNotEmpty()
  filling: string;

  @IsString()
  @IsNotEmpty()
  shape: string;

  @IsString()
  @IsNotEmpty()
  crustType: string;

  @IsNumber()
  @IsNotEmpty()
  weight: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  price: number;

  @IsString()
  image: string;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsArray()
  @IsString({ each: true })
  categories: string[];
}
