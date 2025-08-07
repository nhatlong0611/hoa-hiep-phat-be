import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  IsArray,
  IsOptional,
  ValidateNested,
  IsObject,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// BoxOption DTO
class BoxOptionDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;
}

// EggOption DTO
class EggOptionDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  weight: number;
}

// NutritionInfo DTO
class NutritionInfoDto {
  @IsNumber()
  @IsOptional()
  calories?: number;

  @IsNumber()
  @IsOptional()
  protein?: number;

  @IsNumber()
  @IsOptional()
  carbs?: number;

  @IsNumber()
  @IsOptional()
  fat?: number;
}

// Review DTO
class ReviewDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsOptional()
  userName?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsOptional()
  @Type(() => Date)
  createdAt?: Date;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  type: string[];

  @IsString()
  @IsNotEmpty()
  filling: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  mainIngredients?: string[];

  @IsString()
  @IsNotEmpty()
  shape: string;

  @IsString()
  @IsNotEmpty()
  crustType: string;

  @IsNumber()
  @IsNotEmpty()
  weight: number;

  @IsString()
  @IsOptional()
  size?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  percentageOff?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  shelfLife?: number;

  @IsString()
  @IsOptional()
  storage?: string;

  @IsObject()
  @ValidateNested()
  @Type(() => NutritionInfoDto)
  @IsOptional()
  nutritionInfo?: NutritionInfoDto;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  price: number;

  @IsString()
  @IsOptional()
  image?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  imageUrls?: string[];

  @IsNumber()
  @Min(0)
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categories?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BoxOptionDto)
  @IsOptional()
  boxOptions?: BoxOptionDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EggOptionDto)
  @IsOptional()
  eggOptions?: EggOptionDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewDto)
  @IsOptional()
  reviews?: ReviewDto[];

  @IsNumber()
  @Min(0)
  @Max(5)
  @IsOptional()
  averageRating?: number;
}
