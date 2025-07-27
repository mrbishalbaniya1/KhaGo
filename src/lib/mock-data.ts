
import type { Product, Order, Expense, InventoryTransaction, User } from './types';

export const mockUser: User = {
  uid: 'user-1',
  name: 'Sita Sharma',
  email: 'sita.sharma@culinaryflow.np',
  role: 'admin',
  avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
  lastSeen: 'Online',
};

export const mockUsers: User[] = [
  mockUser,
  {
    uid: 'user-2',
    name: 'Ram Karki',
    email: 'ram.karki@culinaryflow.np',
    role: 'employee',
    avatar: 'https://i.pravatar.cc/150?u=a04258114e29026702d',
    lastSeen: '2 hours ago',
  },
  {
    uid: 'user-3',
    name: 'Gita Thapa',
    email: 'gita.thapa@culinaryflow.np',
    role: 'employee',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026707d',
    lastSeen: '15 minutes ago',
  },
  {
    uid: 'user-4',
    name: 'Bikash Rai',
    email: 'bikash.rai@culinaryflow.np',
    role: 'cook',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026708d',
    lastSeen: 'Online',
  },
];


export const mockProducts: Product[] = [
  { id: 'p1', name: 'Chicken Momo', price: 250, category: 'Momo', stockQty: 0, available: true, popularityScore: 10, spoilageRisk: 'high', isStockManaged: false },
  { id: 'p2', name: 'Veg Chowmein', price: 180, category: 'Noodles', stockQty: 0, available: true, popularityScore: 8, spoilageRisk: 'medium', isStockManaged: false },
  { id: 'p3', name: 'Vegetable Thukpa', price: 200, category: 'Soups', stockQty: 0, available: true, popularityScore: 7, spoilageRisk: 'high', isStockManaged: false },
  { id: 'p4', name: 'Juju Dhau', price: 150, category: 'Desserts', stockQty: 25, available: true, popularityScore: 9, spoilageRisk: 'high', isStockManaged: true },
  { id: 'p5', name: 'Aloo Sandheko', price: 120, category: 'Appetizers', stockQty: 0, available: true, popularityScore: 6, spoilageRisk: 'medium', isStockManaged: false },
  { id: 'p6', name: 'Nepali Thali Set', price: 550, category: 'Main Course', stockQty: 0, available: true, popularityScore: 8, spoilageRisk: 'low', isStockManaged: false },
  { id: 'p7', name: 'Masala Tea', price: 80, category: 'Beverages', stockQty: 100, available: false, popularityScore: 9, spoilageRisk: 'low', isStockManaged: true },
];

export const mockOrders: Order[] = [
  { id: 'o1', tableNumber: 5, tokenNumber: 'A001', customerName: 'John Doe', products: [{ productId: 'p1', name: 'Chicken Momo', qty: 2, price: 250 }, { productId: 'p3', name: 'Vegetable Thukpa', qty: 1, price: 200 }], status: 'preparing', paymentMethod: 'pending', paymentStatus: 'pending', subtotal: 700.00, discount: 50, tip: 70, totalPrice: 720.00, createdAt: new Date(Date.now() - 3600000 * 1), notes: "Extra spicy on the momos", orderTakenBy: "Ram Karki", cashierName: "Sita Sharma" },
  { id: 'o2', tableNumber: 2, tokenNumber: 'A002', products: [{ productId: 'p2', name: 'Veg Chowmein', qty: 1, price: 180 }], status: 'pending', paymentMethod: 'pending', paymentStatus: 'pending', subtotal: 180.00, totalPrice: 180.00, createdAt: new Date(Date.now() - 3600000 * 0.5), orderTakenBy: "Gita Thapa" },
  { id: 'o3', tableNumber: 8, tokenNumber: 'A003', customerName: 'Jane Smith', products: [{ productId: 'p6', name: 'Nepali Thali Set', qty: 1, price: 550 }, { productId: 'p4', name: 'Juju Dhau', qty: 1, price: 150 }], status: 'ready', paymentMethod: 'online', paymentStatus: 'paid', subtotal: 700.00, totalPrice: 700.00, createdAt: new Date(Date.now() - 3600000 * 2), orderTakenBy: "Ram Karki", cashierName: "Sita Sharma" },
  { id: 'o4', tableNumber: 3, tokenNumber: 'A004', products: [{ productId: 'p1', name: 'Chicken Momo', qty: 1, price: 250 }], status: 'delivered', paymentMethod: 'cash', paymentStatus: 'paid', subtotal: 250.00, totalPrice: 250.00, createdAt: new Date(Date.now() - 3600000 * 3), orderTakenBy: "Gita Thapa", cashierName: "Gita Thapa" },
  { id: 'o5', tableNumber: 1, tokenNumber: 'A005', customerName: 'Alex Johnson', products: [{ productId: 'p5', name: 'Aloo Sandheko', qty: 2, price: 120 }], status: 'paid', paymentMethod: 'cash', paymentStatus: 'paid', subtotal: 240.00, tip: 20, totalPrice: 260.00, createdAt: new Date(Date.now() - 3600000 * 4), orderTakenBy: "Ram Karki", cashierName: "Gita Thapa" },
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
