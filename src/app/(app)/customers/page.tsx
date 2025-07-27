
'use client';

import { useState, useEffect } from 'react';
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
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { Skeleton } from '@/components/ui/skeleton';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<User[]>([]);
  const { userRole } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const q = query(collection(db, 'users'), where('role', '==', 'customer'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customersData: User[] = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
      setCustomers(customersData);
    });

    return () => unsubscribe();
  }, []);

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
        <CardHeader>
            <CardTitle>Customers</CardTitle>
            <CardDescription>A list of all your customers.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Role</TableHead>
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
                            {customer.email}
                            </div>
                        </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline" className="capitalize">
                        {customer.role}
                        </Badge>
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

