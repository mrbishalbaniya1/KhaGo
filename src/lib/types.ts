export type User = {
  uid: string;
  name?: string;
  email: string;
  role: 'admin' | 'employee';
  avatar?: string;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  stockQty: number;
  available: boolean;
  popularityScore: number;
  spoilageRisk: 'high' | 'medium' | 'low';
};

export type Order = {
  id: string;
  tableNumber: number;
  tokenNumber: string;
  products: { productId: string; name: string; qty: number }[];
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'paid';
  totalPrice: number;
  createdAt: Date;
};

export type Expense = {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: Date;
};

export type InventoryTransaction = {
  id: string;
  productId: string;
  productName: string;
  qtyChange: number;
  reason: 'stock-in' | 'usage' | 'spoilage';
  date: Date;
};
