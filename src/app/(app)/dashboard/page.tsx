
'use client';

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ArrowUpRight, DollarSign, ShoppingCart, MinusCircle, UserCheck, Users, ShieldQuestion, TrendingUp } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import type { Order, Product, Expense, User } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, limit, where } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const statusStyles: { [key: string]: string } = {
  pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  preparing: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  ready: 'bg-green-500/10 text-green-500 border-green-500/20',
  delivered: 'bg-primary/10 text-primary border-primary/20',
  paid: 'bg-gray-500/10 text-muted-foreground border-gray-500/20',
};

const StatCard = ({ title, value, icon: Icon, description, currency }: { title: string, value: string | number, icon: React.ElementType, description?: string, currency?: string }) => (
 <Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">{title}</CardTitle>
    <Icon className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">
        {currency && <span className="text-sm font-bold text-muted-foreground mr-1">{currency}</span>}
        {value}
    </div>
    {description && <p className="text-xs text-muted-foreground">{description}</p>}
  </CardContent>
</Card>
)

const StatCardSkeleton = () => (
<Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <Skeleton className="h-4 w-2/3" />
    <Skeleton className="h-4 w-4" />
  </CardHeader>
  <CardContent>
    <Skeleton className="h-7 w-1/2 mb-2" />
    <Skeleton className="h-3 w-full" />
  </CardContent>
</Card>
)

const RecentOrdersSkeleton = () => (
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Order</TableHead>
      <TableHead>Table</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Total</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {[...Array(5)].map((_, i) => (
      <TableRow key={i}>
        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
);


function ManagerDashboard() {
  const [isClient, setIsClient] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const { user, managerId } = useAuth();

  useEffect(() => {
    setIsClient(true);
    if (!user || !managerId) return;

    const ordersQuery = query(collection(db, "orders"), where("managerId", "==", managerId), orderBy("createdAt", "desc"), limit(5));
    const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({id: doc.id, ...doc.data(), createdAt: (doc.data().createdAt as Timestamp).toDate()} as Order));
        setOrders(ordersData);
    });

    const productsQuery = query(collection(db, "products"), where("managerId", "==", managerId));
    const unsubProducts = onSnapshot(productsQuery, (snapshot) => {
        const productsData = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as Product));
        setProducts(productsData);
    });

    const expensesQuery = query(collection(db, "expenses"), where("managerId", "==", managerId));
    const unsubExpenses = onSnapshot(expensesQuery, (snapshot) => {
        const expensesData = snapshot.docs.map(doc => ({id: doc.id, ...doc.data(), date: (doc.data().date as Timestamp).toDate()} as Expense));
        setExpenses(expensesData);
    });

    return () => {
        unsubOrders();
        unsubProducts();
        unsubExpenses();
    }
  }, [user, managerId]);
  
  const totalRevenue = orders.reduce((acc, order) => acc + order.totalPrice, 0);
  const totalOrders = orders.length;
  const totalExpenses = expenses.reduce((acc, expense) => acc + expense.amount, 0);
  const totalProfit = totalRevenue - totalExpenses;
  const recentOrders = orders.slice(0, 5);
  const inventoryHighlights = products.filter(p => p.isStockManaged && p.stockQty < 40).slice(0, 5);

  return (
     <div className="flex flex-col gap-4">
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isClient ? <StatCard title="Total Revenue" value={totalRevenue.toFixed(2)} icon={DollarSign} currency="NPR" description="+20.1% from last month" /> : <StatCardSkeleton />}
        {isClient ? <StatCard title="Total Orders" value={totalOrders} icon={ShoppingCart} description="+19% from last month" /> : <StatCardSkeleton />}
        {isClient ? <StatCard title="Total Expenses" value={totalExpenses.toFixed(2)} icon={MinusCircle} currency="NPR" description="+2% from last month" /> : <StatCardSkeleton />}
        {isClient ? <StatCard title="Total Profit" value={totalProfit.toFixed(2)} icon={TrendingUp} currency="NPR" description="Revenue minus expenses" /> : <StatCardSkeleton />}
      </div>
      
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>A summary of the last 5 customer orders.</CardDescription>
            </div>
             <Button asChild size="sm" variant="outline">
                <Link href="/orders">View All <ArrowUpRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {!isClient ? <RecentOrdersSkeleton /> : (
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Table</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentOrders.map((order) => (
                        <TableRow key={order.id}>
                            <TableCell className="font-medium">#{order.tokenNumber}</TableCell>
                            <TableCell>{order.tableNumber}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={`capitalize font-semibold border ${statusStyles[order.status]}`}>
                                    {order.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">NPR {order.totalPrice.toFixed(2)}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
          </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Inventory Highlights</CardTitle>
                    <CardDescription>Items with low stock levels.</CardDescription>
                </div>
                 <Button asChild size="sm" variant="outline">
                    <Link href="/inventory">View All <ArrowUpRight className="ml-2 h-4 w-4" /></Link>
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-right">Stock</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {inventoryHighlights.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell className="text-right font-medium text-destructive">{product.stockQty}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>

    </div>
  )
}

function SuperAdminDashboard() {
  const [isClient, setIsClient] = useState(false);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [totalManagers, setTotalManagers] = useState(0);

  useEffect(() => {
    setIsClient(true);

    const pendingQuery = query(collection(db, 'users'), where('status', '==', 'pending'), where('role', '==', 'manager'));
    const unsubPending = onSnapshot(pendingQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
      setPendingUsers(usersData);
    });

    const managersQuery = query(collection(db, 'users'), where('role', '==', 'manager'));
    const unsubManagers = onSnapshot(managersQuery, (snapshot) => {
      setTotalManagers(snapshot.size);
    });

    return () => {
      unsubPending();
      unsubManagers();
    }
  }, []);

  const recentPendingUsers = pendingUsers.slice(0, 5);

  return (
     <div className="flex flex-col gap-4">
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isClient ? <StatCard title="Pending Approvals" value={pendingUsers.length} icon={ShieldQuestion} description="Managers waiting for access" /> : <StatCardSkeleton />}
        {isClient ? <StatCard title="Total Managers" value={totalManagers} icon={Users} description="Approved managers in the system" /> : <StatCardSkeleton />}
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Recent Pending Approvals</CardTitle>
                <CardDescription>New managers awaiting for approval.</CardDescription>
            </div>
            <Button asChild size="sm" variant="outline">
                <Link href="/admin">View All <ArrowUpRight className="ml-2 h-4 w-4" /></Link>
            </Button>
        </CardHeader>
        <CardContent>
            {!isClient ? <RecentOrdersSkeleton /> : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Business Name</TableHead>
                            <TableHead>Role</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentPendingUsers.map((user) => (
                             <TableRow key={user.uid}>
                                <TableCell>
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={user.avatar} alt={user.name || 'User'} />
                                            <AvatarFallback>{user.name?.[0].toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium">{user.name}</div>
                                            <div className="text-sm text-muted-foreground">{user.email}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>{user.businessName || 'N/A'}</TableCell>
                                <TableCell className="capitalize">{user.role}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>
    </div>
  )
}


export default function DashboardPage() {
  const { userRole } = useAuth();
  
  if (userRole === 'superadmin') {
      return <SuperAdminDashboard />;
  }

  return <ManagerDashboard />;
}
