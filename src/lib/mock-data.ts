import type { Product, Order, Expense, InventoryTransaction, User } from './types';

export const mockUser: User = {
  uid: '12345',
  name: 'Alex Doe',
  email: 'alex.doe@culinaryflow.com',
  role: 'admin',
  avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
};

export const mockProducts: Product[] = [
  { id: 'p1', name: 'Margherita Pizza', price: 12.99, category: 'Pizza', stockQty: 25, available: true, popularityScore: 8, spoilageRisk: 'medium' },
  { id: 'p2', name: 'Spaghetti Carbonara', price: 15.50, category: 'Pasta', stockQty: 30, available: true, popularityScore: 9, spoilageRisk: 'medium' },
  { id: 'p3', name: 'Caesar Salad', price: 9.75, category: 'Salads', stockQty: 15, available: true, popularityScore: 7, spoilageRisk: 'high' },
  { id: 'p4', name: 'Tiramisu', price: 7.00, category: 'Desserts', stockQty: 20, available: true, popularityScore: 9, spoilageRisk: 'high' },
  { id: 'p5', name: 'Bruschetta', price: 8.50, category: 'Appetizers', stockQty: 40, available: true, popularityScore: 6, spoilageRisk: 'medium' },
  { id: 'p6', name: 'Ribeye Steak', price: 28.00, category: 'Main Course', stockQty: 10, available: true, popularityScore: 8, spoilageRisk: 'low' },
  { id: 'p7', name: 'Mineral Water', price: 3.00, category: 'Beverages', stockQty: 100, available: false, popularityScore: 5, spoilageRisk: 'low' },
];

export const mockOrders: Order[] = [
  { id: 'o1', tableNumber: 5, tokenNumber: 'A001', products: [{ productId: 'p1', name: 'Margherita Pizza', qty: 2 }, { productId: 'p3', name: 'Caesar Salad', qty: 1 }], status: 'preparing', totalPrice: 35.73, createdAt: new Date(Date.now() - 3600000 * 1) },
  { id: 'o2', tableNumber: 2, tokenNumber: 'A002', products: [{ productId: 'p2', name: 'Spaghetti Carbonara', qty: 1 }], status: 'pending', totalPrice: 15.50, createdAt: new Date(Date.now() - 3600000 * 0.5) },
  { id: 'o3', tableNumber: 8, tokenNumber: 'A003', products: [{ productId: 'p6', name: 'Ribeye Steak', qty: 1 }, { productId: 'p4', name: 'Tiramisu', qty: 1 }], status: 'ready', totalPrice: 35.00, createdAt: new Date(Date.now() - 3600000 * 2) },
  { id: 'o4', tableNumber: 3, tokenNumber: 'A004', products: [{ productId: 'p1', name: 'Margherita Pizza', qty: 1 }], status: 'delivered', totalPrice: 12.99, createdAt: new Date(Date.now() - 3600000 * 3) },
  { id: 'o5', tableNumber: 1, tokenNumber: 'A005', products: [{ productId: 'p5', name: 'Bruschetta', qty: 2 }], status: 'paid', totalPrice: 17.00, createdAt: new Date(Date.now() - 3600000 * 4) },
];

export const mockExpenses: Expense[] = [
  { id: 'e1', category: 'Groceries', amount: 350.75, description: 'Weekly vegetable supply', date: new Date('2024-05-20') },
  { id: 'e2', category: 'Utilities', amount: 150.00, description: 'Electricity bill', date: new Date('2024-05-18') },
  { id: 'e3', category: 'Maintenance', amount: 75.50, description: 'Oven repair', date: new Date('2024-05-15') },
  { id: 'e4', category: 'Marketing', amount: 200.00, description: 'Social media campaign', date: new Date('2024-05-10') },
  { id: 'e5', category: 'Groceries', amount: 450.25, description: 'Meat and poultry supply', date: new Date('2024-05-12') },
];

export const mockInventoryTransactions: InventoryTransaction[] = [
  { id: 't1', productId: 'p1', productName: 'Pizza Dough', qtyChange: 50, reason: 'stock-in', date: new Date('2024-05-20T09:00:00Z') },
  { id: 't2', productId: 'p2', productName: 'Spaghetti', qtyChange: -10, reason: 'usage', date: new Date('2024-05-20T19:00:00Z') },
  { id: 't3', productId: 'p3', productName: 'Lettuce', qtyChange: -5, reason: 'spoilage', date: new Date('2024-05-19T22:00:00Z') },
  { id: 't4', productId: 'p6', productName: 'Ribeye Steaks', qtyChange: 20, reason: 'stock-in', date: new Date('2024-05-18T10:00:00Z') },
  { id: 't5', productId: 'p1', productName: 'Pizza Dough', qtyChange: -25, reason: 'usage', date: new Date('2024-05-21T20:00:00Z') },
];
