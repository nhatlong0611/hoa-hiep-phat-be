import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { CouponsModule } from './coupons/coupons.module';
import { PaymentsModule } from './payments/payments.module';
import { TransactionsModule } from './transactions/transactions.module';
import { CategoriesModule } from './categories/categories.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AuthModule } from './auth/auth.module';
import { CartModule } from './cart/cart.module';
import { ScheduleModule } from '@nestjs/schedule';
import { Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { ModuleRef } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.DB_CONNECTION_LINK || ''),
    UsersModule,
    ProductsModule,
    OrdersModule,
    CouponsModule,
    PaymentsModule,
    TransactionsModule,
    CategoriesModule,
    ReviewsModule,
    AuthModule,
    CartModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  private readonly logger = new Logger(AppModule.name);

  constructor(@InjectConnection() private connection: Connection, private moduleRef: ModuleRef) {}

  onModuleInit() {
    this.connection.on('connected', () => {
      this.logger.log('Database connected successfully!');
    });
    this.connection.on('error', (err) => {
      this.logger.error('Database connection error:', err);
    });
    this.connection.on('disconnected', () => {
      this.logger.warn('Database disconnected!');
    });
  }
}

