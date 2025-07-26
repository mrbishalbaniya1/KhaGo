
'use client';

import { useState, useEffect } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { DollarSign, ClipboardList, Clock, MinusCircle } from 'lucide-react';
import { mockOrders, mockExpenses } from "@/lib/mock-data";
import { Skeleton } from "@/components/ui/skeleton";

const initialChartData = [
  { date: "Mon", sales: 0 },
  { date: "Tue", sales: 0 },
  { date: "Wed", sales: 0 },
  { date: "Thu", sales: 0 },
  { date: "Fri", sales: 0 },
  { date: "Sat", sales: 0 },
  { date: "Sun", sales: 0 },
]

const chartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(var(--primary))",
  },
}

export default function DashboardPage() {
  const [chartData, setChartData] = useState(initialChartData);
  const [todaysOrders, setTodaysOrders] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setChartData([
      { date: "Mon", sales: Math.floor(Math.random() * 2000) + 1000 },
      { date: "Tue", sales: Math.floor(Math.random() * 2000) + 1000 },
      { date: "Wed", sales: Math.floor(Math.random() * 2000) + 1000 },
      { date: "Thu", sales: Math.floor(Math.random() * 2000) + 1000 },
      { date: "Fri", sales: Math.floor(Math.random() * 2000) + 2000 },
      { date: "Sat", sales: Math.floor(Math.random() * 2000) + 3000 },
      { date: "Sun", sales: Math.floor(Math.random() * 2000) + 2500 },
    ]);
    const today = new Date().toDateString();
    setTodaysOrders(mockOrders.filter(order => new Date(order.createdAt).toDateString() === today).length);
  }, []);

  const totalRevenue = mockOrders.reduce((acc, order) => acc + order.totalPrice, 0);
  const pendingOrders = mockOrders.filter(order => order.status === 'pending' || order.status === 'preparing').length;
  const totalExpenses = mockExpenses.reduce((acc, expense) => acc + expense.amount, 0);
  
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isClient ? (
              <>
                <div className="text-2xl font-bold">+{todaysOrders}</div>
                <p className="text-xs text-muted-foreground">
                  +180.1% from last month
                </p>
              </>
            ) : (
              <div className="space-y-2">
                <Skeleton className="h-7 w-12" />
                <Skeleton className="h-3 w-32" />
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground">+19% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <MinusCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">+2% from last month</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Weekly Sales Overview</CardTitle>
          <CardDescription>
            A look at sales performance over the last 7 days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
               <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tickFormatter={(value) => `$${value}`}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar
                dataKey="sales"
                fill="var(--color-sales)"
                radius={8}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
