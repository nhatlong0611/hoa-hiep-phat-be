import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Cart } from './entities/cart.entity';
import { Product } from '../products/entities/product.entity';
import { AddToCartDto } from './dto/create-cart.dto';
import {
  UpdateCartDto,
  GuestCheckoutDto,
  CartValidationDto,
  CreateOrderDto,
} from './dto/update-cart.dto';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<Cart>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    private ordersService: OrdersService,
  ) {}

  async findUserCart(userId: string): Promise<Cart> {
    if (!userId || !isValidObjectId(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    let cart = await this.cartModel.findOne({ userId, isCheckedOut: false });
    if (!cart) {
      cart = await this.cartModel.create({ userId, items: [] });
    }
    return cart;
  }

  async addToCart(userId: string, addToCartDto: AddToCartDto): Promise<Cart> {
    const { productId, quantity, note } = addToCartDto;

    // Kiểm tra sản phẩm tồn tại
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    // Kiểm tra số lượng trong kho
    if (product.stock < quantity) {
      throw new Error('Số lượng sản phẩm trong kho không đủ');
    }

    let cart = await this.findUserCart(userId);

    // Tìm item trong giỏ
    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId,
    );

    if (itemIndex > -1) {
      // Cập nhật số lượng nếu sản phẩm đã có trong giỏ
      cart.items[itemIndex].quantity += quantity;
      cart.items[itemIndex].note = note;
    } else {
      // Thêm sản phẩm mới vào giỏ
      cart.items.push({
        productId,
        productName: product.name,
        image: product.image,
        price: product.price,
        quantity,
        note,
      });
    }

    return cart.save();
  }

  async updateQuantity(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<Cart> {
    const cart = await this.findUserCart(userId);
    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId,
    );

    if (itemIndex === -1) {
      throw new NotFoundException('Sản phẩm không có trong giỏ hàng');
    }

    if (quantity <= 0) {
      // Xóa item nếu số lượng <= 0
      cart.items.splice(itemIndex, 1);
    } else {
      // Cập nhật số lượng
      cart.items[itemIndex].quantity = quantity;
    }

    return cart.save();
  }

  async removeFromCart(userId: string, productId: string): Promise<Cart> {
    const cart = await this.findUserCart(userId);
    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId,
    );

    if (itemIndex === -1) {
      throw new NotFoundException('Sản phẩm không có trong giỏ hàng');
    }

    cart.items.splice(itemIndex, 1);
    return cart.save();
  }

  async clearCart(userId: string): Promise<Cart> {
    const cart = await this.findUserCart(userId);
    cart.items = [];
    return cart.save();
  }

  async checkoutCart(userId: string): Promise<Cart> {
    const cart = await this.findUserCart(userId);
    if (cart.items.length === 0) {
      throw new Error('Giỏ hàng trống');
    }
    cart.isCheckedOut = true;
    return cart.save();
  }

  async updateCart(
    userId: string,
    updateCartDto: UpdateCartDto,
  ): Promise<Cart> {
    const cart = await this.findUserCart(userId);
    if (!cart) {
      throw new NotFoundException('Giỏ hàng không tồn tại');
    }

    // Map của các sản phẩm cần cập nhật số lượng
    const quantityUpdates = new Map();
    updateCartDto.items.forEach((item) => {
      quantityUpdates.set(item.productId, item.quantity);
    });

    // Xử lý cập nhật số lượng
    for (let i = cart.items.length - 1; i >= 0; i--) {
      const item = cart.items[i];
      const productId = item.productId.toString();

      if (quantityUpdates.has(productId)) {
        const newQuantity = quantityUpdates.get(productId);

        if (newQuantity <= 0) {
          // Xóa item nếu số lượng = 0
          cart.items.splice(i, 1);
        } else {
          // Cập nhật số lượng mới
          cart.items[i].quantity = newQuantity;
        }

        // Đánh dấu đã cập nhật
        quantityUpdates.delete(productId);
      }
    }

    // Thông báo nếu có sản phẩm không tìm thấy trong giỏ
    if (quantityUpdates.size > 0) {
      const notFoundIds = Array.from(quantityUpdates.keys()).join(', ');
      console.warn(`Không tìm thấy sản phẩm trong giỏ hàng: ${notFoundIds}`);
    }

    return cart.save();
  }

  // Process guest checkout
  async processGuestCheckout(guestCheckoutDto: GuestCheckoutDto) {
    const {
      items,
      customerName,
      customerEmail,
      customerPhone,
      deliveryAddress,
      deliveryNote,
      paymentMethod,
    } = guestCheckoutDto;

    // Validate all items first
    const validation = await this.validateCartItems({ items });
    if (!validation.isValid) {
      throw new BadRequestException(
        `Có lỗi với giỏ hàng: ${validation.errors.join(', ')}`,
      );
    }

    // Calculate total
    const total = await this.calculateCartTotal({ items });

    // Create order using OrdersService
    const orderData = {
      orderType: 'guest',
      items: validation.validatedItems,
      customer: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
      },
      delivery: {
        address: deliveryAddress,
        note: deliveryNote,
      },
      payment: {
        method: paymentMethod,
        amount: total.totalAmount,
      },
      status: 'pending',
      totalAmount: total.totalAmount,
      itemCount: total.itemCount,
    };

    // Save order to database
    const order = await this.ordersService.createOrder(orderData);

    // Update product stock
    for (const item of validation.validatedItems) {
      await this.productModel.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      });
    }

    return order;
  }

  // Validate cart items (check stock, prices)
  async validateCartItems(cartValidationDto: CartValidationDto) {
    const { items } = cartValidationDto;
    const errors: string[] = [];
    const validatedItems: Array<{
      productId: string;
      productName: string;
      image: string;
      price: number;
      quantity: number;
      note?: string;
      subtotal: number;
    }> = [];

    for (const item of items) {
      const product = await this.productModel.findById(item.productId);

      if (!product) {
        errors.push(`Sản phẩm ${item.productId} không tồn tại`);
        continue;
      }

      if (product.stock < item.quantity) {
        errors.push(
          `Sản phẩm ${product.name} chỉ còn ${product.stock} trong kho`,
        );
        continue;
      }

      validatedItems.push({
        productId: item.productId,
        productName: product.name,
        image: product.image,
        price: product.price,
        quantity: item.quantity,
        note: item.note,
        subtotal: product.price * item.quantity,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      validatedItems,
    };
  }

  // Calculate cart total
  async calculateCartTotal(cartValidationDto: CartValidationDto) {
    const validation = await this.validateCartItems(cartValidationDto);

    if (!validation.isValid) {
      throw new BadRequestException(
        'Không thể tính tổng do có lỗi trong giỏ hàng',
      );
    }

    const totalAmount = validation.validatedItems.reduce(
      (sum, item) => sum + item.subtotal,
      0,
    );
    const itemCount = validation.validatedItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    return {
      items: validation.validatedItems,
      totalAmount,
      itemCount,
      deliveryFee: 0, // You can add delivery fee logic here
      finalTotal: totalAmount,
    };
  }

  // Create order with new structure
  async createOrder(createOrderDto: CreateOrderDto) {
    const {
      items,
      shippingInfo,
      paymentMethod,
      deliveryMethod,
      subtotal,
      deliveryFee,
      totalAmount,
      note,
      isGuestOrder,
      createAccount,
    } = createOrderDto;

    // Validate items against database
    const validatedItems: Array<{
      productId: string;
      productName: string;
      image: string;
      price: number;
      quantity: number;
      note?: string;
      subtotal: number;
    }> = [];

    for (const item of items) {
      const product = await this.productModel.findById(item.productId);

      if (!product) {
        throw new BadRequestException(
          `Sản phẩm ${item.productId} không tồn tại`,
        );
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Sản phẩm ${product.name} chỉ còn ${product.stock} trong kho`,
        );
      }

      // Verify price (optional - in case frontend price is outdated)
      if (product.price !== item.price) {
        throw new BadRequestException(
          `Giá sản phẩm ${product.name} đã thay đổi. Vui lòng làm mới giỏ hàng`,
        );
      }

      validatedItems.push({
        productId: item.productId,
        productName: product.name,
        image: product.image,
        price: item.price,
        quantity: item.quantity,
        note: item.note,
        subtotal: item.price * item.quantity,
      });
    }

    // Verify total calculation
    const calculatedSubtotal = validatedItems.reduce(
      (sum, item) => sum + item.subtotal,
      0,
    );
    if (calculatedSubtotal !== subtotal) {
      throw new BadRequestException('Tổng tiền không chính xác');
    }

    if (calculatedSubtotal + deliveryFee !== totalAmount) {
      throw new BadRequestException('Tổng tiền cuối không chính xác');
    }

    // Create order data
    const orderData = {
      orderType: isGuestOrder ? 'guest' : 'user',
      items: validatedItems,
      shipping: shippingInfo,
      payment: {
        method: paymentMethod,
        amount: totalAmount,
      },
      delivery: {
        method: deliveryMethod,
        fee: deliveryFee,
      },
      pricing: {
        subtotal,
        deliveryFee,
        totalAmount,
      },
      note,
      status: 'pending',
      createAccount,
    };

    // Save order
    const order = await this.ordersService.createOrder(orderData);

    // Update product stock
    for (const item of validatedItems) {
      await this.productModel.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      });
    }

    return order;
  }
}
