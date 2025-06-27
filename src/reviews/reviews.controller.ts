import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Put,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { VerifyGuestReviewDto } from './dto/verify-guest-review.dto';
import { SearchCustomerReviewsDto } from './dto/search-customer-reviews.dto';
import { successResponse } from '../helper/response.helper';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // Create new review
  @Post()
  async create(@Body() createReviewDto: CreateReviewDto) {
    const review = await this.reviewsService.create(createReviewDto);
    return successResponse(review, 'Đánh giá đã được gửi và đang chờ duyệt');
  }

  // Get all reviews (admin)
  @Get('admin')
  async getAllReviews(@Query() query: any) {
    const result = await this.reviewsService.findAll(query);
    return successResponse(result, 'Lấy danh sách đánh giá thành công');
  }

  // Get pending reviews (admin)
  @Get('admin/pending')
  async getPendingReviews(@Query() query: any) {
    const result = await this.reviewsService.getPendingReviews(query);
    return successResponse(
      result,
      'Lấy danh sách đánh giá chờ duyệt thành công',
    );
  }

  // Get reviews for a product
  @Get('product/:productId')
  async getProductReviews(
    @Param('productId') productId: string,
    @Query() query: any,
  ) {
    const result = await this.reviewsService.getProductReviews(
      productId,
      query,
    );
    return successResponse(result, 'Lấy đánh giá sản phẩm thành công');
  }

  // Get rating stats for a product
  @Get('product/:productId/stats')
  async getProductRatingStats(@Param('productId') productId: string) {
    const stats = await this.reviewsService.getRatingStats(productId);
    return successResponse(stats, 'Lấy thống kê đánh giá thành công');
  }

  // Get single review
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const review = await this.reviewsService.findOne(id);
    return successResponse(review, 'Lấy thông tin đánh giá thành công');
  }

  // Update review (admin)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    const review = await this.reviewsService.update(id, updateReviewDto);
    return successResponse(review, 'Cập nhật đánh giá thành công');
  }

  // Approve review (admin)
  @Put(':id/approve')
  async approveReview(@Param('id') id: string) {
    const review = await this.reviewsService.approveReview(id);
    return successResponse(review, 'Đã duyệt đánh giá thành công');
  }

  // Reject review (admin)
  @Put(':id/reject')
  async rejectReview(@Param('id') id: string) {
    const review = await this.reviewsService.rejectReview(id);
    return successResponse(review, 'Đã từ chối đánh giá');
  }

  // Reply to review (admin)
  @Put(':id/reply')
  async replyToReview(
    @Param('id') id: string,
    @Body() body: { reply: string },
  ) {
    const review = await this.reviewsService.replyToReview(id, body.reply);
    return successResponse(review, 'Đã phản hồi đánh giá thành công');
  } // Delete review
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.reviewsService.remove(id);
    return successResponse(result, 'Xóa đánh giá thành công');
  } // Verify guest review eligibility
  @Post('verify-guest')
  async verifyGuestReview(@Body() verifyGuestReviewDto: VerifyGuestReviewDto) {
    const result = await this.reviewsService.verifyGuestReview(
      verifyGuestReviewDto.orderNumber,
      verifyGuestReviewDto.email,
      verifyGuestReviewDto.productId,
      verifyGuestReviewDto.customerName,
      verifyGuestReviewDto.customerPhone,
    );
    return successResponse(result, result.message);
  }
  // Get reviews by customer email (for guest users)
  @Get('customer/:email')
  async getCustomerReviews(@Param('email') email: string) {
    const reviews = await this.reviewsService.getReviewsByEmail(email);
    return successResponse(
      reviews,
      'Lấy danh sách đánh giá của khách hàng thành công',
    );
  }
  // Get reviews by customer name (for guest users without email)
  @Post('customer/search')
  async searchCustomerReviews(@Body() searchDto: SearchCustomerReviewsDto) {
    const reviews = await this.reviewsService.getReviewsByCustomerInfo(
      searchDto.customerName,
      searchDto.customerPhone,
    );
    return successResponse(
      reviews,
      'Lấy danh sách đánh giá của khách hàng thành công',
    );
  }
}
