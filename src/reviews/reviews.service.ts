import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';

@Injectable()
export class ReviewsService {
  constructor(@InjectModel(Review.name) private reviewModel: Model<Review>) {}
  // Create new review
  async create(createReviewDto: CreateReviewDto) {
    // Determine if this is a guest review
    const isGuestReview = !createReviewDto.userId;

    // Check if user already reviewed this product
    const existingReviewQuery: any = {
      productId: createReviewDto.productId,
    };
    if (isGuestReview) {
      // For guest users, check by email if provided, otherwise by name + phone
      if (createReviewDto.customerEmail) {
        existingReviewQuery.customerEmail = createReviewDto.customerEmail;
      } else {
        // If no email, check by name and phone to prevent duplicates
        existingReviewQuery.customerName = createReviewDto.customerName;
        if (createReviewDto.customerPhone) {
          existingReviewQuery.customerPhone = createReviewDto.customerPhone;
        }
      }
    } else {
      // For registered users, check by userId
      existingReviewQuery.userId = createReviewDto.userId;
    }

    const existingReview = await this.reviewModel.findOne(existingReviewQuery);

    if (existingReview) {
      throw new BadRequestException('Bạn đã đánh giá sản phẩm này rồi');
    }

    // Check if this is a verified purchase
    let isVerifiedPurchase = false;
    if (createReviewDto.orderId || createReviewDto.orderNumber) {
      // TODO: Check if order exists and contains this product
      // For now, we assume it's verified if order info is provided
      isVerifiedPurchase = true;
    }

    const reviewData = {
      ...createReviewDto,
      productId: new Types.ObjectId(createReviewDto.productId),
      userId: createReviewDto.userId
        ? new Types.ObjectId(createReviewDto.userId)
        : undefined,
      orderId: createReviewDto.orderId
        ? new Types.ObjectId(createReviewDto.orderId)
        : undefined,
      isVerifiedPurchase,
      isGuestReview: isGuestReview || createReviewDto.isGuestReview,
      status: 'pending', // Require admin approval
    };

    const review = await this.reviewModel.create(reviewData);
    return review;
  }

  // Get all reviews with filters
  async findAll(query: any = {}) {
    const {
      productId,
      status = 'approved',
      page = 1,
      limit = 10,
      sort = '-createdAt',
    } = query;

    const filter: any = {};

    if (productId) {
      filter.productId = new Types.ObjectId(productId);
    }

    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    const reviews = await this.reviewModel
      .find(filter)
      .populate('productId', 'name image')
      .populate('userId', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await this.reviewModel.countDocuments(filter);

    return {
      reviews,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: total,
      },
    };
  }

  // Get reviews for a specific product
  async getProductReviews(productId: string, query: any = {}) {
    const { page = 1, limit = 5, rating } = query;

    const filter: any = {
      productId: new Types.ObjectId(productId),
      status: 'approved',
    };

    if (rating) {
      filter.rating = parseInt(rating);
    }

    const skip = (page - 1) * limit;

    const reviews = await this.reviewModel
      .find(filter)
      .populate('userId', 'name')
      .select('-customerEmail') // Hide email from public
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await this.reviewModel.countDocuments(filter);

    // Get rating statistics
    const ratingStats = await this.getRatingStats(productId);

    return {
      reviews,
      ratingStats,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: total,
      },
    };
  }

  // Get rating statistics for a product
  async getRatingStats(productId: string) {
    const stats = await this.reviewModel.aggregate([
      {
        $match: {
          productId: new Types.ObjectId(productId),
          status: 'approved',
        },
      },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          rating5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          rating4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          rating3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          rating2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          rating1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
        },
      },
    ]);

    if (stats.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
      };
    }

    const result = stats[0];
    return {
      totalReviews: result.totalReviews,
      averageRating: Math.round(result.averageRating * 10) / 10,
      ratingDistribution: {
        5: result.rating5,
        4: result.rating4,
        3: result.rating3,
        2: result.rating2,
        1: result.rating1,
      },
    };
  }

  // Get single review
  async findOne(id: string) {
    const review = await this.reviewModel
      .findById(id)
      .populate('productId', 'name image')
      .populate('userId', 'name email');

    if (!review) {
      throw new NotFoundException('Không tìm thấy đánh giá');
    }

    return review;
  }

  // Update review (admin only)
  async update(id: string, updateReviewDto: UpdateReviewDto) {
    const review = await this.reviewModel.findByIdAndUpdate(
      id,
      updateReviewDto,
      { new: true },
    );

    if (!review) {
      throw new NotFoundException('Không tìm thấy đánh giá');
    }

    return review;
  }

  // Approve review (admin)
  async approveReview(id: string) {
    const review = await this.reviewModel.findByIdAndUpdate(
      id,
      { status: 'approved' },
      { new: true },
    );

    if (!review) {
      throw new NotFoundException('Không tìm thấy đánh giá');
    }

    return review;
  }

  // Reject review (admin)
  async rejectReview(id: string) {
    const review = await this.reviewModel.findByIdAndUpdate(
      id,
      { status: 'rejected' },
      { new: true },
    );

    if (!review) {
      throw new NotFoundException('Không tìm thấy đánh giá');
    }

    return review;
  }

  // Admin reply to review
  async replyToReview(id: string, reply: string) {
    const review = await this.reviewModel.findByIdAndUpdate(
      id,
      {
        adminReply: reply,
        adminReplyAt: new Date(),
      },
      { new: true },
    );

    if (!review) {
      throw new NotFoundException('Không tìm thấy đánh giá');
    }

    return review;
  }

  // Delete review
  async remove(id: string) {
    const review = await this.reviewModel.findByIdAndDelete(id);

    if (!review) {
      throw new NotFoundException('Không tìm thấy đánh giá');
    }

    return { message: 'Đã xóa đánh giá thành công' };
  }
  // Get pending reviews (admin)
  async getPendingReviews(query: any = {}) {
    return this.findAll({ ...query, status: 'pending' });
  }
  // Verify guest review with order number and email
  async verifyGuestReview(
    orderNumber: string,
    email?: string,
    productId?: string,
    customerName?: string,
    customerPhone?: string,
  ) {
    // TODO: Implement order verification logic
    // This should check if the order number exists, belongs to the customer,
    // and contains the specified product

    // For now, return a simple check
    const hasOrderNumber = !!orderNumber;
    const hasCustomerInfo = !!(email || customerName);
    const orderExists = hasOrderNumber && hasCustomerInfo && productId;

    return {
      isValid: orderExists,
      canReview: orderExists,
      message: orderExists
        ? 'Đơn hàng hợp lệ, bạn có thể đánh giá sản phẩm'
        : 'Không tìm thấy đơn hàng hoặc thông tin không chính xác',
    };
  }
  // Get reviews by customer email (for guest users to view their reviews)
  async getReviewsByEmail(email: string) {
    if (!email) {
      return [];
    }

    const reviews = await this.reviewModel
      .find({ customerEmail: email })
      .populate('productId', 'name image')
      .sort('-createdAt')
      .lean();

    return reviews;
  }

  // Get reviews by customer name and phone (for guest users without email)
  async getReviewsByCustomerInfo(customerName: string, customerPhone?: string) {
    const query: any = { customerName };

    if (customerPhone) {
      query.customerPhone = customerPhone;
    }

    const reviews = await this.reviewModel
      .find(query)
      .populate('productId', 'name image')
      .sort('-createdAt')
      .lean();

    return reviews;
  }
}
