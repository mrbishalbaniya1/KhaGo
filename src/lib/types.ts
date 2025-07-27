
import { z } from 'zod';

export type User = {
  uid: string;
  name?: string;
  email: string;
  role: 'admin' | 'employee';
  avatar?: string;
  lastSeen?: string;
};

export const userSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  role: z.enum(['admin', 'employee'], { required_error: 'Role is required.' }),
});

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
  tableNumber?: number;
  tokenNumber: string;
  customerName?: string;
  products: { productId: string; name: string; qty: number; price: number }[];
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'paid';
  subtotal: number;
  discount?: number;
  tip?: number;
  totalPrice: number;
  notes?: string;
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
