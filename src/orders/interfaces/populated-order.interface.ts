export interface PopulatedProduct {
  _id: string;
  name: string;
  image: string;
  price: number;
  description?: string;
  category?: string;
}

export interface PopulatedOrderItem {
  productId: PopulatedProduct;
  quantity: number;
  price: number;
  note?: string;
}

export interface PopulatedOrder {
  _id: string;
  orderNumber: string;
  status: string;
  items: PopulatedOrderItem[];
  shipping: any;
  pricing: any;
  payment: any;
  delivery: any;
  createdAt: Date;
  updatedAt: Date;
}
