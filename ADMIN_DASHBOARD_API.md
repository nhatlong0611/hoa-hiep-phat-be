# Admin Dashboard API Documentation

## Transactions Management & Revenue Analytics

### API Endpoints cho Admin Dashboard

#### 1. Lấy tất cả giao dịch (có phân trang và filter)

```
GET /transactions/admin/all
```

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Query Parameters:**

- `page`: Số trang (default: 1)
- `limit`: Số lượng items mỗi trang (default: 20)
- `startDate`: Từ ngày (format: YYYY-MM-DD)
- `endDate`: Đến ngày (format: YYYY-MM-DD)
- `userId`: Filter theo user ID

**Example:**

```
GET /transactions/admin/all?page=1&limit=20&startDate=2024-01-01&endDate=2024-12-31&userId=6839faed4386e67d11b62feb
```

**Response:**

```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "_id": "683a9dfabdff0c27535cd50d",
        "bankTransactionId": 10854187,
        "amount": 10000,
        "description": "020097042205311303462025SY5B655801.86118.130347.NAPTIEN394",
        "transactionDate": "2025-05-31T06:03:47.000Z",
        "accountNumber": "1031293650",
        "userId": {
          "_id": "6839faed4386e67d11b62feb",
          "name": "Nguyễn Văn A",
          "email": "user@example.com",
          "phone": "+84901234567"
        },
        "userCode": "394",
        "processed": true,
        "createdAt": "2025-05-31T06:13:14.623Z",
        "updatedAt": "2025-05-31T06:13:14.623Z"
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 10,
      "total": 200,
      "limit": 20
    }
  },
  "message": "Lấy danh sách giao dịch thành công"
}
```

#### 2. Thống kê doanh thu

```
GET /transactions/admin/revenue-stats
```

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Query Parameters:**

- `startDate`: Từ ngày (format: YYYY-MM-DD)
- `endDate`: Đến ngày (format: YYYY-MM-DD)
- `groupBy`: Nhóm theo thời gian (`hour`, `day`, `week`, `month`, `year`) - default: `day`

**Example:**

```
GET /transactions/admin/revenue-stats?startDate=2024-01-01&endDate=2024-01-31&groupBy=day
```

**Response:**

```json
{
  "success": true,
  "data": {
    "revenueData": [
      {
        "_id": "2024-01-01",
        "totalRevenue": 2500000,
        "totalTransactions": 5,
        "avgTransactionAmount": 500000
      },
      {
        "_id": "2024-01-02",
        "totalRevenue": 1800000,
        "totalTransactions": 3,
        "avgTransactionAmount": 600000
      }
    ],
    "overallStats": {
      "totalRevenue": 15000000,
      "totalTransactions": 45,
      "avgTransactionAmount": 333333.33,
      "maxTransactionAmount": 2000000,
      "minTransactionAmount": 100000
    }
  },
  "message": "Lấy thống kê doanh thu thành công"
}
```

#### 3. Thống kê giao dịch theo loại

```
GET /transactions/admin/stats-by-type
```

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "deposit",
      "count": 150,
      "totalAmount": 45000000,
      "avgAmount": 300000
    },
    {
      "_id": "other",
      "count": 20,
      "totalAmount": 3000000,
      "avgAmount": 150000
    }
  ],
  "message": "Lấy thống kê giao dịch theo loại thành công"
}
```

#### 4. Giao dịch gần đây

```
GET /transactions/admin/recent
```

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Query Parameters:**

- `limit`: Số lượng giao dịch (default: 10)

**Example:**

```
GET /transactions/admin/recent?limit=5
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "683a9dfabdff0c27535cd50d",
      "bankTransactionId": 10854187,
      "amount": 10000,
      "description": "020097042205311303462025SY5B655801.86118.130347.NAPTIEN394",
      "userId": {
        "_id": "6839faed4386e67d11b62feb",
        "name": "Nguyễn Văn A",
        "email": "user@example.com"
      },
      "userCode": "394",
      "processed": true,
      "createdAt": "2025-05-31T06:13:14.623Z"
    }
  ],
  "message": "Lấy giao dịch gần đây thành công"
}
```

#### 5. Tổng quan Dashboard

```
GET /transactions/admin/dashboard-summary
```

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalRevenue": 45000000,
    "totalTransactions": 150,
    "avgTransactionAmount": 300000,
    "typeStats": [
      {
        "_id": "deposit",
        "count": 120,
        "totalAmount": 36000000,
        "avgAmount": 300000
      },
      {
        "_id": "other",
        "count": 30,
        "totalAmount": 9000000,
        "avgAmount": 300000
      }
    ],
    "recentTransactions": [
      {
        "_id": "683a9dfabdff0c27535cd50d",
        "amount": 10000,
        "userId": {
          "name": "Nguyễn Văn A",
          "email": "user@example.com"
        },
        "userCode": "394",
        "createdAt": "2025-05-31T06:13:14.623Z"
      }
    ]
  },
  "message": "Lấy tổng quan dashboard thành công"
}
```

### Frontend Integration Examples

#### Dashboard React Component

```jsx
import React, { useState, useEffect } from 'react';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [revenueStats, setRevenueStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchRevenueStats();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/transactions/admin/dashboard-summary', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      const result = await response.json();
      setDashboardData(result.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchRevenueStats = async () => {
    try {
      const response = await fetch(
        '/transactions/admin/revenue-stats?groupBy=day',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
          },
        },
      );
      const result = await response.json();
      setRevenueStats(result.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching revenue stats:', error);
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="admin-dashboard">
      <div className="dashboard-cards">
        <div className="card">
          <h3>Tổng Doanh Thu</h3>
          <p className="revenue">
            {dashboardData?.totalRevenue?.toLocaleString()} VNĐ
          </p>
        </div>

        <div className="card">
          <h3>Tổng Giao Dịch</h3>
          <p className="transactions">{dashboardData?.totalTransactions}</p>
        </div>

        <div className="card">
          <h3>Trung Bình / Giao Dịch</h3>
          <p className="avg">
            {dashboardData?.avgTransactionAmount?.toLocaleString()} VNĐ
          </p>
        </div>
      </div>

      <div className="recent-transactions">
        <h3>Giao Dịch Gần Đây</h3>
        <table>
          <thead>
            <tr>
              <th>Khách Hàng</th>
              <th>Số Tiền</th>
              <th>Loại</th>
              <th>Ngày</th>
            </tr>
          </thead>
          <tbody>
            {dashboardData?.recentTransactions?.map((transaction) => (
              <tr key={transaction._id}>
                <td>{transaction.userId.name}</td>
                <td>{transaction.amount.toLocaleString()} VNĐ</td>
                <td>{transaction.type}</td>
                <td>{new Date(transaction.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="revenue-chart">
        <h3>Biểu Đồ Doanh Thu</h3>
        {/* Integrate với Chart.js hoặc Recharts */}
        {revenueStats?.revenueData?.map((data) => (
          <div key={data._id}>
            {data._id}: {data.totalRevenue.toLocaleString()} VNĐ
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
```

#### Chart.js Integration

```jsx
import { Line } from 'react-chartjs-2';

const RevenueChart = ({ revenueData }) => {
  const chartData = {
    labels: revenueData.map((item) => item._id),
    datasets: [
      {
        label: 'Doanh Thu (VNĐ)',
        data: revenueData.map((item) => item.totalRevenue),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      },
      {
        label: 'Số Giao Dịch',
        data: revenueData.map((item) => item.totalTransactions),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
};
```

### Security Notes

1. **Authentication Required**: Tất cả admin endpoints yêu cầu JWT token hợp lệ
2. **Role-based Access**: Chỉ users có role `admin` hoặc `superadmin` mới có thể truy cập
3. **Rate Limiting**: Nên implement rate limiting cho các endpoints này
4. **Data Validation**: Tất cả query parameters được validate

### Performance Considerations

1. **Indexing**: Đảm bảo có indexes trên:

   - `userId`
   - `createdAt`
   - `status`
   - `type`

2. **Pagination**: Luôn sử dụng pagination cho danh sách lớn
3. **Caching**: Consider caching cho dashboard summary data
4. **Aggregation Pipeline**: Optimize MongoDB aggregation queries

### Next Steps

1. **Real-time Updates**: Implement WebSocket để cập nhật real-time
2. **Export Functions**: Thêm chức năng xuất Excel/PDF
3. **Advanced Filters**: Thêm filter theo khoảng số tiền, user groups
4. **Notifications**: Email/SMS alerts cho các giao dịch lớn
5. **Audit Trail**: Log tất cả actions của admin

---

## Reviews Management API

### API Endpoints cho Reviews System

#### 1. Tạo review (Guest hoặc User)

```
POST /reviews
```

**Headers:**

```
Content-Type: application/json
Authorization: Bearer <token> // Optional cho registered users
```

**Request Body:**

```json
{
  "productId": "64f7a3b2c9d8e1234567890a",
  "userId": "64f7a3b2c9d8e1234567890b", // Optional - chỉ có khi user đã đăng nhập
  "customerName": "Nguyễn Văn A",
  "customerEmail": "customer@example.com", // Optional
  "customerPhone": "+84901234567", // Optional
  "rating": 5,
  "comment": "Sản phẩm rất tốt, tôi rất hài lòng!",
  "images": ["image1.jpg", "image2.jpg"], // Optional
  "orderId": "64f7a3b2c9d8e1234567890c", // Optional
  "orderNumber": "ORD-2024-001234", // Optional - cho guest verification
  "isGuestReview": true // Optional - tự động detect nếu không có userId
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "64f7a3b2c9d8e1234567890d",
    "productId": "64f7a3b2c9d8e1234567890a",
    "customerName": "Nguyễn Văn A",
    "customerEmail": "customer@example.com",
    "rating": 5,
    "comment": "Sản phẩm rất tốt, tôi rất hài lòng!",
    "status": "pending",
    "isGuestReview": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Đánh giá đã được gửi và đang chờ duyệt"
}
```

#### 2. Xác thực guest có thể review

```
POST /reviews/verify-guest
```

**Request Body:**

```json
{
  "orderNumber": "ORD-2024-001234",
  "email": "customer@example.com", // Optional
  "productId": "64f7a3b2c9d8e1234567890a",
  "customerName": "Nguyễn Văn A", // Optional
  "customerPhone": "+84901234567" // Optional
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "isValid": true,
    "canReview": true,
    "message": "Đơn hàng hợp lệ, bạn có thể đánh giá sản phẩm"
  }
}
```

#### 3. Lấy reviews của sản phẩm

```
GET /reviews/product/:productId
```

**Query Parameters:**

- `page`: Số trang (default: 1)
- `limit`: Số lượng items mỗi trang (default: 5)
- `rating`: Filter theo rating (1-5)

**Example:**

```
GET /reviews/product/64f7a3b2c9d8e1234567890a?page=1&limit=5&rating=5
```

**Response:**

```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "_id": "64f7a3b2c9d8e1234567890d",
        "customerName": "Nguyễn Văn A",
        "rating": 5,
        "comment": "Sản phẩm rất tốt!",
        "images": ["image1.jpg"],
        "isVerifiedPurchase": true,
        "adminReply": "Cảm ơn bạn đã đánh giá!",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "ratingStats": {
      "totalReviews": 150,
      "averageRating": 4.3,
      "ratingDistribution": {
        "5": 75,
        "4": 45,
        "3": 20,
        "2": 8,
        "1": 2
      }
    },
    "pagination": {
      "current": 1,
      "total": 30,
      "count": 150
    }
  }
}
```

#### 4. Lấy thống kê rating của sản phẩm

```
GET /reviews/product/:productId/stats
```

**Response:**

```json
{
  "success": true,
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

#### 5. Tìm reviews theo email khách hàng

```
GET /reviews/customer/:email
```

**Example:**

```
GET /reviews/customer/customer@example.com
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "64f7a3b2c9d8e1234567890d",
      "productId": {
        "_id": "64f7a3b2c9d8e1234567890a",
        "name": "iPhone 15 Pro",
        "image": "iphone15.jpg"
      },
      "rating": 5,
      "comment": "Sản phẩm tuyệt vời!",
      "status": "approved",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

#### 6. Tìm reviews theo tên khách hàng

```
POST /reviews/customer/search
```

**Request Body:**

```json
{
  "customerName": "Nguyễn Văn A",
  "customerPhone": "+84901234567" // Optional
}
```

---

### Admin Reviews Management

#### 1. Lấy tất cả reviews (Admin)

```
GET /reviews/admin
```

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Query Parameters:**

- `page`: Số trang (default: 1)
- `limit`: Số lượng items mỗi trang (default: 10)
- `status`: Filter theo trạng thái (`pending`, `approved`, `rejected`)
- `productId`: Filter theo sản phẩm

**Response:**

```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "_id": "64f7a3b2c9d8e1234567890d",
        "productId": {
          "_id": "64f7a3b2c9d8e1234567890a",
          "name": "iPhone 15 Pro",
          "image": "iphone15.jpg"
        },
        "userId": {
          "_id": "64f7a3b2c9d8e1234567890b",
          "name": "Nguyễn Văn A",
          "email": "user@example.com"
        },
        "customerName": "Nguyễn Văn A",
        "customerEmail": "customer@example.com",
        "rating": 5,
        "comment": "Sản phẩm tuyệt vời!",
        "status": "pending",
        "isGuestReview": false,
        "isVerifiedPurchase": true,
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "current": 1,
      "total": 10,
      "count": 95
    }
  }
}
```

#### 2. Lấy reviews chờ duyệt (Admin)

```
GET /reviews/admin/pending
```

**Headers:**

```
Authorization: Bearer <admin_token>
```

#### 3. Duyệt review (Admin)

```
PUT /reviews/:id/approve
```

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "64f7a3b2c9d8e1234567890d",
    "status": "approved",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  },
  "message": "Đã duyệt đánh giá thành công"
}
```

#### 4. Từ chối review (Admin)

```
PUT /reviews/:id/reject
```

**Headers:**

```
Authorization: Bearer <admin_token>
```

#### 5. Phản hồi review (Admin)

```
PUT /reviews/:id/reply
```

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Request Body:**

```json
{
  "reply": "Cảm ơn bạn đã đánh giá sản phẩm. Chúng tôi rất vui khi bạn hài lòng!"
}
```

#### 6. Xóa review (Admin)

```
DELETE /reviews/:id
```

**Headers:**

```
Authorization: Bearer <admin_token>
```

---

### Frontend Implementation Examples

#### Guest Review Form

```jsx
import React, { useState } from 'react';

const GuestReviewForm = ({ productId }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    rating: 5,
    comment: '',
    orderNumber: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          productId,
          isGuestReview: true,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Đánh giá đã được gửi và đang chờ duyệt!');
        setFormData({
          customerName: '',
          customerEmail: '',
          customerPhone: '',
          rating: 5,
          comment: '',
          orderNumber: '',
        });
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Có lỗi xảy ra khi gửi đánh giá');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="guest-review-form">
      <h3>Đánh giá sản phẩm</h3>

      <div className="form-group">
        <label>Tên của bạn *</label>
        <input
          type="text"
          value={formData.customerName}
          onChange={(e) =>
            setFormData({ ...formData, customerName: e.target.value })
          }
          required
        />
      </div>

      <div className="form-group">
        <label>Email (tùy chọn)</label>
        <input
          type="email"
          value={formData.customerEmail}
          onChange={(e) =>
            setFormData({ ...formData, customerEmail: e.target.value })
          }
        />
      </div>

      <div className="form-group">
        <label>Số điện thoại (tùy chọn)</label>
        <input
          type="tel"
          value={formData.customerPhone}
          onChange={(e) =>
            setFormData({ ...formData, customerPhone: e.target.value })
          }
        />
      </div>

      <div className="form-group">
        <label>Số đơn hàng (để xác thực mua hàng)</label>
        <input
          type="text"
          value={formData.orderNumber}
          onChange={(e) =>
            setFormData({ ...formData, orderNumber: e.target.value })
          }
          placeholder="ORD-2024-001234"
        />
      </div>

      <div className="form-group">
        <label>Đánh giá *</label>
        <div className="rating-stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`star ${star <= formData.rating ? 'active' : ''}`}
              onClick={() => setFormData({ ...formData, rating: star })}
            >
              ⭐
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Nhận xét *</label>
        <textarea
          value={formData.comment}
          onChange={(e) =>
            setFormData({ ...formData, comment: e.target.value })
          }
          required
          rows={4}
          placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
        />
      </div>

      <button type="submit" disabled={loading} className="submit-btn">
        {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
      </button>
    </form>
  );
};

export default GuestReviewForm;
```

#### Product Reviews Display

```jsx
import React, { useState, useEffect } from 'react';

const ProductReviews = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRating, setSelectedRating] = useState('');

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [productId, currentPage, selectedRating]);

  const fetchReviews = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '5',
        ...(selectedRating && { rating: selectedRating }),
      });

      const response = await fetch(
        `/reviews/product/${productId}?${queryParams}`,
      );
      const result = await response.json();

      if (result.success) {
        setReviews(result.data.reviews);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`/reviews/product/${productId}/stats`);
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span key={index} className={`star ${index < rating ? 'filled' : ''}`}>
        ⭐
      </span>
    ));
  };

  if (loading) return <div>Đang tải đánh giá...</div>;

  return (
    <div className="product-reviews">
      <div className="reviews-header">
        <h3>Đánh giá sản phẩm</h3>

        {stats && (
          <div className="rating-summary">
            <div className="overall-rating">
              <span className="rating-score">{stats.averageRating}</span>
              <div className="rating-stars">
                {renderStars(Math.round(stats.averageRating))}
              </div>
              <span className="total-reviews">
                ({stats.totalReviews} đánh giá)
              </span>
            </div>

            <div className="rating-distribution">
              {Object.entries(stats.ratingDistribution)
                .reverse()
                .map(([rating, count]) => (
                  <div key={rating} className="rating-bar">
                    <span>{rating} sao</span>
                    <div className="bar">
                      <div
                        className="fill"
                        style={{
                          width: `${(count / stats.totalReviews) * 100}%`,
                        }}
                      />
                    </div>
                    <span>{count}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      <div className="reviews-filters">
        <select
          value={selectedRating}
          onChange={(e) => setSelectedRating(e.target.value)}
        >
          <option value="">Tất cả đánh giá</option>
          <option value="5">5 sao</option>
          <option value="4">4 sao</option>
          <option value="3">3 sao</option>
          <option value="2">2 sao</option>
          <option value="1">1 sao</option>
        </select>
      </div>

      <div className="reviews-list">
        {reviews.map((review) => (
          <div key={review._id} className="review-item">
            <div className="review-header">
              <div className="reviewer-info">
                <strong>{review.customerName}</strong>
                {review.isVerifiedPurchase && (
                  <span className="verified-badge">✓ Đã mua hàng</span>
                )}
              </div>
              <div className="review-meta">
                <div className="rating">{renderStars(review.rating)}</div>
                <span className="date">
                  {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>

            <div className="review-content">
              <p>{review.comment}</p>
              {review.images && review.images.length > 0 && (
                <div className="review-images">
                  {review.images.map((image, index) => (
                    <img key={index} src={image} alt={`Review ${index + 1}`} />
                  ))}
                </div>
              )}
            </div>

            {review.adminReply && (
              <div className="admin-reply">
                <strong>Phản hồi từ shop:</strong>
                <p>{review.adminReply}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="reviews-pagination">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          Trang trước
        </button>
        <span>Trang {currentPage}</span>
        <button
          onClick={() => setCurrentPage((prev) => prev + 1)}
          disabled={reviews.length < 5}
        >
          Trang sau
        </button>
      </div>
    </div>
  );
};

export default ProductReviews;
```

#### Admin Reviews Management

```jsx
import React, { useState, useEffect } from 'react';

const AdminReviewsManager = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');

  useEffect(() => {
    fetchReviews();
  }, [statusFilter]);

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const endpoint =
        statusFilter === 'pending'
          ? '/reviews/admin/pending'
          : `/reviews/admin?status=${statusFilter}`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (result.success) {
        setReviews(result.data.reviews);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/reviews/${reviewId}/approve`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchReviews(); // Refresh list
        alert('Đã duyệt đánh giá thành công!');
      }
    } catch (error) {
      console.error('Error approving review:', error);
    }
  };

  const handleReject = async (reviewId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/reviews/${reviewId}/reject`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchReviews(); // Refresh list
        alert('Đã từ chối đánh giá!');
      }
    } catch (error) {
      console.error('Error rejecting review:', error);
    }
  };

  const handleReply = async (reviewId, reply) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/reviews/${reviewId}/reply`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reply }),
      });

      if (response.ok) {
        fetchReviews(); // Refresh list
        alert('Đã phản hồi đánh giá thành công!');
      }
    } catch (error) {
      console.error('Error replying to review:', error);
    }
  };

  return (
    <div className="admin-reviews-manager">
      <div className="header">
        <h2>Quản lý đánh giá</h2>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="pending">Chờ duyệt</option>
          <option value="approved">Đã duyệt</option>
          <option value="rejected">Đã từ chối</option>
        </select>
      </div>

      {loading ? (
        <div>Đang tải...</div>
      ) : (
        <div className="reviews-list">
          {reviews.map((review) => (
            <div key={review._id} className="review-card">
              <div className="review-info">
                <h4>{review.productId.name}</h4>
                <p>
                  <strong>Khách hàng:</strong> {review.customerName}
                </p>
                <p>
                  <strong>Email:</strong> {review.customerEmail}
                </p>
                <p>
                  <strong>Rating:</strong> {review.rating}/5 ⭐
                </p>
                <p>
                  <strong>Nội dung:</strong> {review.comment}
                </p>
                <p>
                  <strong>Trạng thái:</strong>
                  <span className={`status ${review.status}`}>
                    {review.status === 'pending'
                      ? 'Chờ duyệt'
                      : review.status === 'approved'
                        ? 'Đã duyệt'
                        : 'Đã từ chối'}
                  </span>
                </p>
                {review.isGuestReview && (
                  <span className="badge">Guest Review</span>
                )}
                {review.isVerifiedPurchase && (
                  <span className="badge verified">Verified Purchase</span>
                )}
              </div>

              {review.status === 'pending' && (
                <div className="review-actions">
                  <button
                    onClick={() => handleApprove(review._id)}
                    className="approve-btn"
                  >
                    Duyệt
                  </button>
                  <button
                    onClick={() => handleReject(review._id)}
                    className="reject-btn"
                  >
                    Từ chối
                  </button>
                </div>
              )}

              {review.status === 'approved' && !review.adminReply && (
                <div className="reply-section">
                  <textarea
                    placeholder="Nhập phản hồi..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        handleReply(review._id, e.target.value.trim());
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
              )}

              {review.adminReply && (
                <div className="admin-reply">
                  <strong>Phản hồi của bạn:</strong>
                  <p>{review.adminReply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReviewsManager;
```

### Security & Best Practices

1. **Guest Review Validation**: Luôn validate order number với database
2. **Rate Limiting**: Giới hạn số lượng review mỗi IP/email
3. **Content Moderation**: Filter spam và nội dung không phù hợp
4. **Image Upload**: Validate và resize images trước khi lưu
5. **Email Verification**: Gửi email xác nhận cho guest reviews

### Database Indexes

```javascript
// Recommended indexes for performance
db.reviews.createIndex({ productId: 1, status: 1 });
db.reviews.createIndex({ customerEmail: 1 });
db.reviews.createIndex({ createdAt: -1 });
db.reviews.createIndex({ userId: 1 });
db.reviews.createIndex({ status: 1 });
```
