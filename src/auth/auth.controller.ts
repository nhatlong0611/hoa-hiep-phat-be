import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Request() req, @Res() response: Response) {
    console.log('Raw request body:', req.body);
    console.log('Request headers:', req.headers);

    const { email, password } = req.body || {};

    console.log(
      'Login endpoint called with email:',
      email,
      'password:',
      password ? '[HIDDEN]' : 'undefined',
    );
    try {
      const user = await this.authService.validateUser(email, password);
      const result = await this.authService.login(user, response);
      return response.json(result);
    } catch (error) {
      console.error('Login error:', error.message);
      return response.status(401).json({ message: 'Invalid credentials' });
    }
  }

  @Post('register')
  async register(
    @Body() createUserDto: CreateUserDto,
    @Res() response: Response,
  ) {
    const result = await this.authService.register(createUserDto, response);
    return response.json(result);
  }
}
