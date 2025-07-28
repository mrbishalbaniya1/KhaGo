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
  status: z.enum(['pending', 'approved'], { required_error: 'Status is required.' }),
  username: z.string().optional(),
  businessName: z.string().optional(),
  mobileNumber: z.string().optional(),
  address: z.string().optional(),
  managerId: z.string().optional(),
});
