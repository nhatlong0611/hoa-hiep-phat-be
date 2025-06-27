import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsNotEmpty, IsString } from 'class-validator';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Role } from '../enums/role.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  _id: MongooseSchema.Types.ObjectId;

  @IsString()
  @IsNotEmpty()
  @Prop({ required: true, unique: true })
  email: string;

  @IsNotEmpty()
  @IsString()
  @Prop({ required: true })
  password: string;

  @IsNotEmpty()
  @IsString()
  @Prop()
  name: string;

  @IsNotEmpty()
  @IsString()
  @Prop()
  phone: string;

  @IsNotEmpty()
  @IsString()
  @Prop()
  address: string;

  @IsNotEmpty()
  @Prop({ type: Number, default: 0 })
  balance: number;

  @Prop({ type: String, enum: Role, default: Role.USER })
  role: Role;

  @Prop({ 
    type: String, 
    unique: true, 
    required: true,
    match: /^[0-9]{3}$/ 
  })
  userCode: string;

  @Prop([{
    type: {
      type: String,
      enum: ['deposit', 'withdraw'],
      required: true
    },
    amount: { type: Number, required: true },
    description: String,
    createdAt: { type: Date, default: Date.now }
  }])
  transactions: Array<{
    type: string;
    amount: number;
    description?: string;
    createdAt: Date;
  }>;
}

export const UserSchema = SchemaFactory.createForClass(User);
