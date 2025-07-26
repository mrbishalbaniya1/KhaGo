import type { Product, Order, Expense, InventoryTransaction, User } from './types';

export const mockUser: User = {
  uid: '12345',
  name: 'Sita Sharma',
  email: 'sita.sharma@culinaryflow.np',
  role: 'admin',
  avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
};

export const mockProducts: Product[] = [
  { id: 'p1', name: 'Chicken Momo', price: 250, category: 'Momo', stockQty: 50, available: true, popularityScore: 10, spoilageRisk: 'high' },
  { id: 'p2', name: 'Veg Chowmein', price: 180, category: 'Noodles', stockQty: 40, available: true, popularityScore: 8, spoilageRisk: 'medium' },
  { id: 'p3', name: 'Vegetable Thukpa', price: 200, category: 'Soups', stockQty: 30, available: true, popularityScore: 7, spoilageRisk: 'high' },
  { id: 'p4', name: 'Juju Dhau', price: 150, category: 'Desserts', stockQty: 25, available: true, popularityScore: 9, spoilageRisk: 'high' },
  { id: 'p5', name: 'Aloo Sandheko', price: 120, category: 'Appetizers', stockQty: 35, available: true, popularityScore: 6, spoilageRisk: 'medium' },
  { id: 'p6', name: 'Nepali Thali Set', price: 550, category: 'Main Course', stockQty: 20, available: true, popularityScore: 8, spoilageRisk: 'low' },
  { id: 'p7', name: 'Masala Tea', price: 80, category: 'Beverages', stockQty: 100, available: false, popularityScore: 9, spoilageRisk: 'low' },
];

export const mockOrders: Order[] = [
  { id: 'o1', tableNumber: 5, tokenNumber: 'A001', products: [{ productId: 'p1', name: 'Chicken Momo', qty: 2 }, { productId: 'p3', name: 'Vegetable Thukpa', qty: 1 }], status: 'preparing', totalPrice: 700.00, createdAt: new Date(Date.now() - 3600000 * 1) },
  { id: 'o2', tableNumber: 2, tokenNumber: 'A002', products: [{ productId: 'p2', name: 'Veg Chowmein', qty: 1 }], status: 'pending', totalPrice: 180.00, createdAt: new Date(Date.now() - 3600000 * 0.5) },
  { id: 'o3', tableNumber: 8, tokenNumber: 'A003', products: [{ productId: 'p6', name: 'Nepali Thali Set', qty: 1 }, { productId: 'p4', name: 'Juju Dhau', qty: 1 }], status: 'ready', totalPrice: 700.00, createdAt: new Date(Date.now() - 3600000 * 2) },
  { id: 'o4', tableNumber: 3, tokenNumber: 'A004', products: [{ productId: 'p1', name: 'Chicken Momo', qty: 1 }], status: 'delivered', totalPrice: 250.00, createdAt: new Date(Date.now() - 3600000 * 3) },
  { id: 'o5', tableNumber: 1, tokenNumber: 'A005', products: [{ productId: 'p5', name: 'Aloo Sandheko', qty: 2 }], status: 'paid', totalPrice: 240.00, createdAt: new Date(Date.now() - 3600000 * 4) },
];

export const mockExpenses: Expense[] = [
  { id: 'e1', category: 'Groceries', amount: 15000, description: 'Weekly vegetable supply', date: new Date('2024-05-20') },
  { id: 'e2', category: 'Utilities', amount: 8000, description: 'Electricity bill', date: new Date('2024-05-18') },
  { id: 'e3', category: 'Maintenance', amount: 3500, description: 'Gas stove repair', date: new Date('2024-05-15') },
  { id: 'e4', category: 'Staff Salary', amount: 50000, description: 'Monthly staff salary', date: new Date('2024-05-10') },
  { id: 'e5', category: 'Groceries', amount: 20000, description: 'Meat and poultry supply', date: new Date('2024-05-12') },
];

export const mockInventoryTransactions: InventoryTransaction[] = [
  { id: 't1', productId: 'p1', productName: 'Chicken', qtyChange: 20, reason: 'stock-in', date: new Date('2024-05-20T09:00:00Z') },
  { id: 't2', productId: 'p2', productName: 'Noodles', qtyChange: -10, reason: 'usage', date: new Date('2024-05-20T19:00:00Z') },
  { id: 't3', productId: 'p3', productName: 'Cabbage', qtyChange: -5, reason: 'spoilage', date: new Date('2024-05-19T22:00:00Z') },
  { id: 't4', productId: 'p6', productName: 'Rice', qtyChange: 50, reason: 'stock-in', date: new Date('2024-05-18T10:00:00Z') },
  { id: 't5', productId: 'p1', productName: 'Chicken', qtyChange: -10, reason: 'usage', date: new Date('2024-05-21T20:00:00Z') },
];
