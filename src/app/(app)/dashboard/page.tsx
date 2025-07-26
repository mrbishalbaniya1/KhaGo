
'use client';

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Clock, MinusCircle, Package, AlertTriangle, ArrowUpRight, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import { mockOrders, mockExpenses, mockProducts } from "@/lib/mock-data";
import { Skeleton } from "@/components/ui/skeleton";
import type { Order, Product } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";


const statusStyles: { [key: string]: string } = {
  pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  preparing: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  ready: 'bg-green-500/10 text-green-500 border-green-500/20',
  delivered: 'bg-primary/10 text-primary border-primary/20',
  paid: 'bg-gray-500/10 text-muted-foreground border-gray-500/20',
};


export default function DashboardPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const totalRevenue = mockOrders.reduce((acc, order) => acc + order.totalPrice, 0);
  const totalOrders = mockOrders.length;
  const totalExpenses = mockExpenses.reduce((acc, expense) => acc + expense.amount, 0);
  const lowStockItems = mockProducts.filter(p => p.stockQty < 30).length;

  const recentOrders = mockOrders.slice(0, 5);
  const inventoryHighlights = mockProducts.filter(p => p.stockQty < 40).slice(0, 5);

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

  return (
    <div className="flex flex-col gap-6">
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isClient ? <StatCard title="Total Revenue" value={totalRevenue.toFixed(2)} icon={DollarSign} currency="NPR" description="+20.1% from last month" /> : <StatCardSkeleton />}
        {isClient ? <StatCard title="Total Orders" value={totalOrders} icon={ShoppingCart} description="+19% from last month" /> : <StatCardSkeleton />}
        {isClient ? <StatCard title="Total Expenses" value={totalExpenses.toFixed(2)} icon={MinusCircle} currency="NPR" description="+2% from last month" /> : <StatCardSkeleton />}
        {isClient ? <StatCard title="Low Stock Items" value={lowStockItems} icon={AlertTriangle} description="Items needing attention" /> : <StatCardSkeleton />}
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
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
  );
}
