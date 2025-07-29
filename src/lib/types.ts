
import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

export const userRoles = ['superadmin', 'admin', 'manager', 'waiter', 'cook', 'employee', 'cashier', 'customer'] as const;

export type UserRole = (typeof userRoles)[number];

export type User = {
  uid: string;
  name?: string;
  email: string;
  role: UserRole;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  avatar?: string;
  lastSeen?: string;
  username?: string;
  businessName?: string;
  mobileNumber?: string;
  address?: string;
  managerId?: string; // To link employees to a manager
};

export const userSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  role: z.enum(userRoles, { required_error: 'Role is required.' }),
  status: z.enum(['pending', 'approved', 'rejected', 'suspended'], { required_error: 'Status is required.' }),
  username: z.string().optional(),
  businessName: z.string().optional(),
  mobileNumber: z.string().optional(),
  address: z.string().optional(),
  managerId: z.string().optional(),
});

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  isStockManaged: boolean;
  stockQty: number;
  available: boolean;
  managerId: string;
  popularityScore: number;
  spoilageRisk: 'low' | 'medium' | 'high';
};

export type OrderProduct = {
    productId: string;
    name: string;
    qty: number;
    price: number;
}

export type Order = {
    id: string;
    tokenNumber: string;
    tableNumber?: number;
    customerName?: string;
    products: OrderProduct[];
    subtotal: number;
    discount: number;
    tip: number;
    totalPrice: number;
    status: 'pending' | 'preparing' | 'ready' | 'delivered';
    notes?: string;
    createdAt: Date | Timestamp;
    managerId: string;
    paymentMethod: 'cash' | 'online' | 'pending';
    paymentStatus: 'pending' | 'paid' | 'refunded';
    orderTakenBy?: string;
    cashierName?: string;
};

export type Expense = {
    id: string;
    category: string;
    amount: number;
    description?: string;
    date: Date | Timestamp;
    managerId: string;
};

export type InventoryTransaction = {
    id: string;
    productId: string;
    productName: string;
    qtyChange: number;
    reason: 'stock-in' | 'usage' | 'spoilage';
    date: Date | Timestamp;
    managerId: string;
};
