
import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

export type User = {
  uid: string;
  name?: string;
  email: string;
  role: 'admin' | 'employee' | 'cook';
  avatar?: string;
  lastSeen?: string;
};

export const userSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  role: z.enum(['admin', 'employee', 'cook'], { required_error: 'Role is required.' }),
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
  isStockManaged: boolean;
};

export type Order = {
  id: string;
  tableNumber?: number;
  tokenNumber: string;
  customerName?: string;
  products: { productId: string; name: string; qty: number; price: number }[];
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'paid';
  paymentMethod?: 'cash' | 'online' | 'pending';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  subtotal: number;
  discount?: number;
  tip?: number;
  totalPrice: number;
  notes?: string;
  createdAt: Date | Timestamp;
  orderTakenBy?: string;
  cashierName?: string;
};

export type Expense = {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: Date | Timestamp;
};

export type InventoryTransaction = {
  id: string;
  productId: string;
  productName: string;
  qtyChange: number;
  reason: 'stock-in' | 'usage' | 'spoilage';
  date: Date | Timestamp;
};
