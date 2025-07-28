
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts';
import type { Expense, Product, Order } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { eachMonthOfInterval, subMonths, format, startOfMonth } from 'date-fns';

const COLORS = ['#FF7F50', '#FFDB58', '#8884d8', '#82ca9d', '#ffc658'];

export default function ReportsPage() {
  const [isClient, setIsClient] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const { user, managerId } = useAuth();

  useEffect(() => {
    setIsClient(true);
    if (!user || !managerId) return;

    const unsubExpenses = onSnapshot(query(collection(db, 'expenses'), where('managerId', '==', managerId)), (snapshot) => {
        const expensesData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: (data.date as Timestamp).toDate(),
            } as Expense;
        });
        setExpenses(expensesData);
    });

    const unsubProducts = onSnapshot(query(collection(db, "products"), where('managerId', '==', managerId)), (snapshot) => {
        const productsData = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as Product));
        setProducts(productsData);
    });
    
    const sixMonthsAgo = subMonths(new Date(), 5);
    const startOfPeriod = startOfMonth(sixMonthsAgo);
    
    const unsubOrders = onSnapshot(
      query(
        collection(db, "orders"), 
        where('managerId', '==', managerId), 
        where("createdAt", ">=", Timestamp.fromDate(startOfPeriod))
      ), 
      (snapshot) => {
          const ordersData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id, 
              ...data,
              createdAt: (data.createdAt as Timestamp).toDate()
            } as Order
          });
          setOrders(ordersData);
      });

    return () => {
        unsubExpenses();
        unsubProducts();
        unsubOrders();
    };
  }, [user, managerId]);

  const salesData = eachMonthOfInterval({
    start: subMonths(new Date(), 5),
    end: new Date(),
  }).map(month => {
    const monthStr = format(month, 'MMM');
    const total = orders
      .filter(order => format(order.createdAt, 'MMM') === monthStr)
      .reduce((sum, order) => sum + order.totalPrice, 0);
    return { name: monthStr, total };
  });

  const expenseData = expenses
  .reduce((acc, expense) => {
    const existing = acc.find((e) => e.name === expense.category);
    if (existing) {
      existing.value += expense.amount;
    } else {
      acc.push({ name: expense.category, value: expense.amount });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  const inventoryData = products.filter(p => p.isStockManaged).map(p => ({
      name: p.name,
      stock: p.stockQty,
  }));


  const handleDownload = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
        return;
    }
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
        URL.revokeObjectURL(link.href);
    }
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const ChartSkeleton = () => <Skeleton className="w-full h-[350px]" />;


  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Download your business performance reports.</p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Monthly Sales</CardTitle>
            <CardDescription>A summary of sales for the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {isClient ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `NPR ${value.toLocaleString()}`} />
                    <Tooltip formatter={(value: number) => `NPR ${value.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="total" fill="hsl(var(--primary))" name="Sales (in NPR)" />
                  </BarChart>
                </ResponsiveContainer>
             ) : (
              <ChartSkeleton />
            )}
          </CardContent>
           <CardFooter>
            <Button onClick={() => handleDownload(salesData, 'monthly-sales-report')}>
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
            <CardDescription>A breakdown of your business expenses.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] flex items-center justify-center">
            {isClient ? (
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie data={expenseData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                      {expenseData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                   </Pie>
                   <Tooltip formatter={(value: number) => `NPR ${value.toLocaleString()}`} />
                   <Legend />
                 </PieChart>
              </ResponsiveContainer>
            ) : (
                <ChartSkeleton />
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={() => handleDownload(expenseData, 'expenses-by-category-report')}>
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Inventory Stock Levels</CardTitle>
            <CardDescription>Current stock levels for all products.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
             {isClient ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inventoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="stock" fill="hsl(var(--primary))" name="Stock Quantity" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
                <ChartSkeleton />
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={() => handleDownload(inventoryData, 'inventory-stock-levels-report')}>
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
