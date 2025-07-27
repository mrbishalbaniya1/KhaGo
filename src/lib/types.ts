
import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

export const userRoles = ['superadmin', 'admin', 'manager', 'waiter', 'cook', 'employee', 'cashier', 'customer'] as const;

export type UserRole = (typeof userRoles)[number];

export type User = {
  uid: string;
  name?: string;
  email: string;
  role: UserRole;
  status: 'pending' | 'approved';
  avatar?: string;
  lastSeen?: string;
};

export const userSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  role: z.enum(userRoles, { required_error: 'Role is required.' }),
  status: z.enum(['pending', 'approved'], { required_error: 'Status is required.' }),
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
  paymentMethod: 'cash' | 'online' | 'pending';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  subtotal: number;
  discount: number;
  tip: number;
  totalPrice: number;
  notes?: string;
  createdAt: Date;
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
