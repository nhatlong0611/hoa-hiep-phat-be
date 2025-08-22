import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  IsDate,
  IsArray,
  IsObject,
  ValidateNested,
  IsOptional,
  IsUrl,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Document, Schema as MongooseSchema } from 'mongoose';

// Tạo class cho thông tin hộp đựng
class BoxOption {
  @IsString()
  @Prop({ required: true })
  id: string; // ID của hộp

  @IsString()
  @Prop({ required: true })
  name: string; // Tên hộp

  @IsNumber()
  @Min(0)
  @Prop({ required: true })
  price: number; // Giá hộp
}

// Tạo class cho tùy chọn trứng
class EggOption {
  @IsString()
  @Prop({ required: true })
  id: string; // "1_egg", "2_egg", "no_egg"

  @IsString()
  @Prop({ required: true })
  name: string; // "1 trứng (150g)", "2 trứng (180g)", "Chay"

  @IsNumber()
  @Min(0)
  @Prop({ required: true })
  price: number; // Giá của option này

  @IsNumber()
  @Min(0)
  @Prop({ required: true })
  weight: number; // Trọng lượng (gram)
}

// Tạo class cho thông tin dinh dưỡng
class NutritionInfo {
  @IsNumber()
  @IsOptional()
  @Prop()
  calories: number; // kcal

  @IsNumber()
  @IsOptional()
  @Prop()
  protein: number; // g

  @IsNumber()
  @IsOptional()
  @Prop()
  carbs: number; // g

  @IsNumber()
  @IsOptional()
  @Prop()
  fat: number; // g
}

// Tạo class cho đánh giá
class Review {
  @IsString()
  @Prop({ required: true })
  userId: string; // ID của người đánh giá

  @IsString()
  @Prop()
  userName: string; // Tên của người đánh giá

  @IsNumber()
  @Min(1)
  @Max(5)
  @Prop({ required: true })
  rating: number; // Điểm đánh giá (1-5)

  @IsString()
  @Prop()
  comment: string; // Nội dung đánh giá

  @IsDate()
  @Prop({ default: Date.now })
  createdAt: Date; // Thời gian đánh giá
}

@Schema({ collection: 'products' }) // Make sure collection name is correct
export class Product extends Document {
  @IsString()
  @IsNotEmpty()
  @Prop({ required: true })
  name: string;

  @IsString()
  @Prop()
  description: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  @Prop({ required: true, type: [String] })
  type: string[]; // Chuyển thành array

  @IsString()
  @IsNotEmpty()
  @Prop({ required: true })
  filling: string;

  @IsArray()
  @IsString({ each: true })
  @Prop({ type: [String], default: [] })
  mainIngredients: string[]; // Thành phần chính: Bột mì, Đậu xanh, Trứng muối, v.v.

  @IsString()
  @IsNotEmpty()
  @Prop({ required: true })
  shape: string;

  @IsString()
  @IsNotEmpty()
  @Prop({ required: true })
  crustType: string;

  @IsNumber()
  @IsNotEmpty()
  @Prop({ required: true })
  weight: number; // gram

  @IsString()
  @IsOptional()
  @Prop()
  size: string; // kích thước, ví dụ: "8cm x 8cm"

  @IsNumber()
  @IsOptional()
  @Prop({ default: 0 })
  percentageOff: number; // Phần trăm giảm giá, nếu có

  @IsNumber()
  @IsOptional()
  @Prop()
  shelfLife: number; // số ngày bảo quản

  @IsString()
  @IsOptional()
  @Prop()
  storage: string; // hướng dẫn bảo quản

  // Thông tin dinh dưỡng
  @IsObject()
  @ValidateNested()
  @Type(() => NutritionInfo)
  @Prop({ type: Object, default: {} })
  nutritionInfo: NutritionInfo;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Prop()
  price?: number;

  @IsString()
  @Prop()
  image: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Prop({ type: [String], default: [] })
  imageUrls: string[]; // Array of image URLs

  @IsNumber()
  @Min(0)
  @Prop({ default: 0 })
  quantity: number; // Số lượng bánh còn lại

  @IsNumber()
  @Min(0)
  @Prop({ default: 0 })
  stock: number;

  @IsArray()
  @IsString({ each: true })
  @Prop({ type: [String], default: [] })
  categories: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BoxOption)
  @Prop({ type: [Object], default: [] })
  boxOptions: BoxOption[]; // Các loại hộp có sẵn

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EggOption)
  @Prop({ type: [Object], default: [] })
  eggOptions: EggOption[]; // Các tùy chọn trứng có sẵn

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Review)
  @Prop({ type: [Object], default: [] })
  reviews: Review[]; // Đánh giá từ người dùng

  @IsNumber()
  @Min(0)
  @Max(5)
  @Prop({ default: 0 })
  averageRating: number; // Điểm đánh giá trung bình

  // Tự động được thêm bởi timestamps: true
  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
