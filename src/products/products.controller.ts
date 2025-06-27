import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { successResponse } from 'src/helper/response.helper';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Routes cần auth
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async create(@Body() createProductDto: CreateProductDto) {
    const product = await this.productsService.create(createProductDto);
    return successResponse(product, 'Thêm bánh trung thu mới thành công!');
  }

  // Routes công khai - không cần auth
  @Get()
  async findAll() {
    const products = await this.productsService.findAll();
    return successResponse(products, 'Lấy danh sách bánh thành công!');
  }

  @Get('category/:category')
  async findByCategory(@Param('category') category: string) {
    const products = await this.productsService.findByCategory(category);
    return successResponse(products, 'Lấy danh sách bánh theo danh mục thành công!');
  }

  @Get('type/:type')
  async findByType(@Param('type') type: string) {
    const products = await this.productsService.findByType(type);
    return successResponse(products, 'Lấy danh sách bánh theo loại thành công!');
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const product = await this.productsService.findOne(id);
    return successResponse(product, 'Lấy thông tin bánh thành công!');
  }

  @Get(':id/detail')
  async getProductDetail(@Param('id') id: string) {
    const product = await this.productsService.getProductDetail(id);
    return successResponse(product, 'Lấy chi tiết sản phẩm thành công!');
  }

  // Routes cần auth
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    const product = await this.productsService.update(id, updateProductDto);
    return successResponse(product, 'Cập nhật thông tin bánh thành công!');
  }

  @Patch(':id/stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateStock(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ) {
    const product = await this.productsService.updateStock(id, quantity);
    return successResponse(product, 'Cập nhật số lượng bánh thành công!');
  }

  @Post(':id/reviews')
  @UseGuards(JwtAuthGuard) // Chỉ cần đăng nhập, không cần role admin
  async addReview(
    @Param('id') id: string,
    @Body() review: any,
  ) {
    const product = await this.productsService.addReview(id, review);
    return successResponse(product, 'Thêm đánh giá thành công!');
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    const product = await this.productsService.remove(id);
    return successResponse(product, 'Xóa bánh thành công!');
  }
}
