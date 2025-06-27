import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  BadRequestException,
  Put,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/create-cart.dto';
import {
  UpdateCartDto,
  GuestCheckoutDto,
  CartValidationDto,
  CreateOrderDto,
} from './dto/update-cart.dto';
import { QuantityUpdateDto } from './dto/quantity-update.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser, GetUserId } from '../auth/decorators/get-user.decorator';
import { successResponse } from '../helper/response.helper';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // Authenticated routes
  @UseGuards(JwtAuthGuard)
  @Get()
  async findUserCart(@GetUserId() userId: string) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    const cart = await this.cartService.findUserCart(userId);
    return successResponse(cart, 'Lấy thông tin giỏ hàng thành công');
  }

  @Post('add')
  async addToCart(
    @GetUserId() userId: string,
    @Body() addToCartDto: AddToCartDto,
  ) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    const cart = await this.cartService.addToCart(userId, addToCartDto);
    return successResponse(cart, 'Thêm sản phẩm vào giỏ hàng thành công');
  }

  @Patch('update/:productId')
  async updateQuantity(
    @GetUserId() userId: string,
    @Param('productId') productId: string,
    @Body('quantity') quantity: number,
  ) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    const cart = await this.cartService.updateQuantity(
      userId,
      productId,
      quantity,
    );
    return successResponse(cart, 'Cập nhật số lượng thành công');
  }

  @Patch('quantity/:productId')
  async updateItemQuantity(
    @GetUserId() userId: string,
    @Param('productId') productId: string,
    @Body() quantityUpdateDto: QuantityUpdateDto,
  ) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const { quantity } = quantityUpdateDto;

    const cart = await this.cartService.updateQuantity(
      userId,
      productId,
      quantity,
    );
    return successResponse(cart, 'Cập nhật số lượng thành công');
  }

  @Delete('remove/:productId')
  async removeFromCart(
    @GetUserId() userId: string,
    @Param('productId') productId: string,
  ) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    const cart = await this.cartService.removeFromCart(userId, productId);
    return successResponse(cart, 'Xóa sản phẩm khỏi giỏ hàng thành công');
  }

  @Delete('clear')
  async clearCart(@GetUserId() userId: string) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    const cart = await this.cartService.clearCart(userId);
    return successResponse(cart, 'Xóa toàn bộ giỏ hàng thành công');
  }

  @Post('checkout')
  async checkoutCart(@GetUserId() userId: string) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    const cart = await this.cartService.checkoutCart(userId);
    return successResponse(cart, 'Đặt hàng thành công');
  }

  @Put('update')
  async updateCart(
    @GetUserId() userId: string,
    @Body() updateCartDto: UpdateCartDto,
  ) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    const cart = await this.cartService.updateCart(userId, updateCartDto);
    return successResponse(cart, 'Cập nhật giỏ hàng thành công');
  }

  // Public routes (no authentication required)
  @Post('guest-checkout')
  async guestCheckout(@Body() guestCheckoutDto: GuestCheckoutDto) {
    const order = await this.cartService.processGuestCheckout(guestCheckoutDto);
    return successResponse(
      order,
      `Đặt hàng thành công! Mã đơn hàng: ${order.orderNumber}`,
    );
  }

  @Post('validate')
  async validateCart(@Body() cartValidationDto: CartValidationDto) {
    const validation =
      await this.cartService.validateCartItems(cartValidationDto);
    return successResponse(validation, 'Kiểm tra giỏ hàng thành công');
  }

  @Post('calculate-total')
  async calculateTotal(@Body() cartValidationDto: CartValidationDto) {
    const total = await this.cartService.calculateCartTotal(cartValidationDto);
    return successResponse(total, 'Tính tổng tiền thành công');
  }

  // New order API
  @Post('create-order')
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    const order = await this.cartService.createOrder(createOrderDto);
    return successResponse(
      order,
      `Đặt hàng thành công! Mã đơn hàng: ${order.orderNumber}`,
    );
  }
}
