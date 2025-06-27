# Review System Documentation

## Overview

This review system supports both registered users and guest users (customers who don't need to create an account). It allows customers to review products they have purchased without requiring authentication.

## Key Features

### Guest User Support

- Customers can submit reviews without creating an account
- Reviews are identified by email address for guest users
- Support for order verification through order number
- Guest reviews are marked with `isGuestReview: true`

### Verified Purchase System

- Reviews can be linked to specific orders
- Support for both registered user orders and guest orders
- Order verification helps identify legitimate reviews

### Admin Moderation

- All reviews start with "pending" status
- Admin can approve, reject, or reply to reviews
- Admin can view all pending reviews for moderation

## API Endpoints

### Create Review (Guest or Registered User)

```
POST /reviews
```

**Request Body:**

```json
{
  "productId": "64f7a3b2c9d8e1234567890a",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+84901234567", // Optional
  "rating": 5,
  "comment": "Great product!",
  "images": ["image1.jpg"], // Optional
  "orderId": "64f7a3b2c9d8e1234567890b", // Optional
  "orderNumber": "ORD-2024-001", // For guest verification
  "isGuestReview": true // Optional, auto-detected if userId is missing
}
```

### Verify Guest Review Eligibility

```
POST /reviews/verify-guest
```

**Request Body:**

```json
{
  "orderNumber": "ORD-2024-001",
  "email": "customer@example.com",
  "productId": "64f7a3b2c9d8e1234567890a"
}
```

### Get Product Reviews

```
GET /reviews/product/{productId}
```

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 5)
- `rating`: Filter by rating (1-5)

### Get Product Rating Statistics

```
GET /reviews/product/{productId}/stats
```

**Response:**

```json
{
  "data": {
    "totalReviews": 150,
    "averageRating": 4.3,
    "ratingDistribution": {
      "5": 75,
      "4": 45,
      "3": 20,
      "2": 8,
      "1": 2
    }
  }
}
```

### Get Customer Reviews (Guest Users)

```
GET /reviews/customer/{email}
```

### Admin Endpoints

#### Get All Reviews

```
GET /reviews/admin
```

#### Get Pending Reviews

```
GET /reviews/admin/pending
```

#### Approve Review

```
PUT /reviews/{id}/approve
```

#### Reject Review

```
PUT /reviews/{id}/reject
```

#### Reply to Review

```
PUT /reviews/{id}/reply
```

**Request Body:**

```json
{
  "reply": "Thank you for your feedback!"
}
```

## Database Schema

### Review Entity

```typescript
{
  productId: ObjectId, // Required
  userId?: ObjectId, // Optional - only for registered users
  customerName: string, // Required
  customerEmail: string, // Required
  customerPhone?: string, // Optional
  rating: number, // 1-5, required
  comment: string, // Required
  images?: string[], // Optional
  status: string, // 'pending' | 'approved' | 'rejected'
  orderId?: ObjectId, // Optional, links to order
  isVerifiedPurchase: boolean, // Auto-calculated
  isGuestReview: boolean, // Auto-detected or set manually
  orderNumber?: string, // For guest verification
  adminReply?: string, // Optional admin response
  adminReplyAt?: Date, // When admin replied
  createdAt: Date,
  updatedAt: Date
}
```

## Usage Examples

### Frontend Integration for Guest Checkout

1. **After Guest Checkout Completion:**

   ```javascript
   // Save order info for review purposes
   localStorage.setItem(
     'recentOrder',
     JSON.stringify({
       orderNumber: 'ORD-2024-001',
       customerEmail: 'customer@example.com',
       products: [
         /* product list */
       ],
     }),
   );
   ```

2. **Product Review Form (Guest):**

   ```javascript
   const submitGuestReview = async (reviewData) => {
     const response = await fetch('/reviews', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         ...reviewData,
         isGuestReview: true,
       }),
     });

     const result = await response.json();
     // Handle success/error
   };
   ```

3. **Verify Guest Can Review:**
   ```javascript
   const verifyGuestReview = async (orderNumber, email, productId) => {
     const response = await fetch('/reviews/verify-guest', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ orderNumber, email, productId }),
     });

     const result = await response.json();
     return result.data.canReview;
   };
   ```

## Security Considerations

1. **Email Verification**: Consider implementing email verification for guest reviews
2. **Rate Limiting**: Implement rate limiting to prevent spam reviews
3. **Order Verification**: The `verifyGuestReview` method should be connected to your order system
4. **Admin Authentication**: Ensure admin endpoints are properly protected

## Next Steps

1. **Connect Order Verification**: Implement actual order verification logic in `verifyGuestReview` method
2. **Email Notifications**: Add email notifications for review status changes
3. **Image Upload**: Implement image upload functionality for review images
4. **Spam Detection**: Add spam detection for review content
5. **Review Helpful Votes**: Allow users to vote if reviews are helpful

## Notes

- All reviews start with "pending" status and require admin approval
- Guest users can view their reviews by providing their email address
- The system prevents duplicate reviews per product per customer (by email for guests, by userId for registered users)
- Order verification helps identify verified purchases vs. unverified reviews
