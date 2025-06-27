import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class DatabaseConnectionService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseConnectionService.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

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
