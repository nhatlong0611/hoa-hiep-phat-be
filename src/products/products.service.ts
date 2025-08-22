import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const createdProduct = new this.productModel(createProductDto);
    return createdProduct.save();
  }

  async findAll(): Promise<any[]> {
    const products = await this.productModel.find().exec();
    return products.map((product) => this.transformProductForFrontend(product));
  }

  async findOne(id: string): Promise<any> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return this.transformProductForFrontend(product);
  }

  // Transform product để phù hợp với frontend
  private transformProductForFrontend(product: Product): any {
    const productObj = product.toObject();

    // Nếu có eggOptions và không có price cố định, tính giá từ eggOptions
    if (
      productObj.eggOptions &&
      productObj.eggOptions.length > 0 &&
      !productObj.price
    ) {
      // Lấy giá thấp nhất từ eggOptions làm giá hiển thị
      const minPrice = Math.min(
        ...productObj.eggOptions.map((egg) => egg.price),
      );
      productObj.displayPrice = minPrice;
      productObj.priceRange = {
        min: minPrice,
        max: Math.max(...productObj.eggOptions.map((egg) => egg.price)),
      };
    } else if (productObj.price) {
      // Nếu có giá cố định thì dùng giá đó
      productObj.displayPrice = productObj.price;
    }

    return productObj;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, updateProductDto, { new: true })
      .exec();

    if (!updatedProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return updatedProduct;
  }

  async remove(id: string): Promise<Product> {
    const deletedProduct = await this.productModel.findByIdAndDelete(id).exec();

    if (!deletedProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return deletedProduct;
  }

  async addReview(productId: string, review: any): Promise<Product> {
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    product.reviews.push(review);

    // Calculate new average rating
    const totalRating = product.reviews.reduce(
      (sum, rev) => sum + rev.rating,
      0,
    );
    product.averageRating = totalRating / product.reviews.length;

    return product.save();
  }

  async updateStock(productId: string, quantity: number): Promise<Product> {
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    product.stock = quantity;
    return product.save();
  }

  async findByCategory(category: string): Promise<Product[]> {
    return this.productModel.find({ categories: category }).exec();
  }

  async findByType(type: string): Promise<Product[]> {
    return this.productModel.find({ type: type }).exec();
  }

  async getProductDetail(id: string): Promise<Product> {
    const product = await this.productModel
      .findById(id)
      .select('-__v') // Loại bỏ field __v
      .populate({
        path: 'reviews',
        select: '-__v',
      })
      .exec();

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }
}
