
import type { Product, Order, Expense, InventoryTransaction, User } from './types';

export const mockUser: User = {
  uid: 'user-1',
  name: 'Sita Sharma',
  email: 'sita.sharma@khago.np',
  role: 'admin',
  avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
  lastSeen: 'Online',
};

export const mockUsers: User[] = [
  mockUser,
];


export const mockProducts: Product[] = [];

export const mockOrders: Order[] = [];

export const mockExpenses: Expense[] = [];

export const mockInventoryTransactions: InventoryTransaction[] = [];
