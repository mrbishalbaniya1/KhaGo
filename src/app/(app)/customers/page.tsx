
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { User } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, addDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const customerSchema = z.object({
  name: z.string().min(1, 'Full name is required.'),
  email: z.string().email('Invalid email address.').optional().or(z.literal('')),
  mobileNumber: z.string().min(1, 'Mobile number is required.'),
  address: z.string().optional(),
});


export default function CustomersPage() {
  const [customers, setCustomers] = useState<User[]>([]);
  const { user, userRole, userData } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      email: '',
      mobileNumber: '',
      address: '',
    },
  });

  useEffect(() => {
    setIsClient(true);
    if (!user || !userData) return;

    const managerId = userRole === 'manager' ? user.uid : userData.managerId;
    if (!managerId) return;
    
    const q = query(
        collection(db, 'users'), 
        where('role', '==', 'customer'), 
        where('managerId', '==', managerId)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customersData: User[] = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
      setCustomers(customersData);
    });

    return () => unsubscribe();
  }, [user, userData, userRole]);

  const onAddCustomerSubmit = async (values: z.infer<typeof customerSchema>) => {
    if (!user || !userData) return;
    const managerId = userRole === 'manager' ? user.uid : userData.managerId;
    if (!managerId) return;

    try {
      await addDoc(collection(db, 'users'), {
        ...values,
        managerId: managerId,
        role: 'customer',
        status: 'approved',
        avatar: `https://i.pravatar.cc/150?u=${Date.now()}`,
      });
      toast({
        title: 'Customer Added',
        description: `${values.name} has been added to your customer list.`,
      });
      form.reset();
      setIsAddCustomerOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add customer.', variant: 'destructive' });
    }
  };

  if (userRole === 'superadmin') {
      return (
          <div className="flex h-full w-full items-center justify-center">
              <p>This page is for managers to view their customers.</p>
          </div>
      );
  }

  const TableSkeleton = () => (
    [...Array(10)].map((_, i) => (
      <TableRow key={i}>
        <TableCell>
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                </div>
            </div>
        </TableCell>
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      </TableRow>
    ))
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Customers</CardTitle>
                <CardDescription>A list of all your customers.</CardDescription>
            </div>
            <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
                <DialogTrigger asChild>
                    <Button size="sm">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Customer
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Customer</DialogTitle>
                        <DialogDescription>
                            Fill in the details to add a new customer.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onAddCustomerSubmit)} className="space-y-4">
                             <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                    <Input placeholder="e.g., Jane Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="mobileNumber"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mobile Number</FormLabel>
                                    <FormControl>
                                    <Input placeholder="e.g., 98xxxxxxxx" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email (Optional)</FormLabel>
                                    <FormControl>
                                    <Input type="email" placeholder="e.g., jane@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address (Optional)</FormLabel>
                                    <FormControl>
                                    <Input placeholder="e.g., Kathmandu, Nepal" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button type="submit">Add Customer</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isClient ? (
                customers.map((customer) => (
                    <TableRow key={customer.uid}>
                    <TableCell>
                        <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                            <AvatarImage
                            src={customer.avatar}
                            alt={customer.name || 'User'}
                            />
                            <AvatarFallback>
                            {customer.name?.[0].toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-medium">
                            {customer.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                            {customer.address || 'No address'}
                            </div>
                        </div>
                        </div>
                    </TableCell>
                    <TableCell>
                       <div>{customer.mobileNumber}</div>
                       <div className="text-sm text-muted-foreground">{customer.email}</div>
                    </TableCell>
                    <TableCell>
                        <Badge variant={customer.status === 'approved' ? 'default' : 'secondary'} className={`capitalize ${customer.status === 'approved' ? 'bg-green-500' : ''}`}>
                            {customer.status}
                        </Badge>
                    </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableSkeleton />
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}


