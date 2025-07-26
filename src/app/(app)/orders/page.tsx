
'use client';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Clock, Hash } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { mockOrders } from '@/lib/mock-data';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';

const statusStyles: { [key: string]: string } = {
  pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  preparing: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  ready: 'bg-green-500/10 text-green-500 border-green-500/20',
  delivered: 'bg-primary/10 text-primary border-primary/20',
  paid: 'bg-gray-500/10 text-muted-foreground border-gray-500/20',
};

export default function OrdersPage() {
  return (
    <div className="flex flex-col gap-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">View and manage customer orders.</p>
        </div>
        {/* TODO: Add filtering controls */}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {mockOrders.map((order) => (
          <Card key={order.id} className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Order #{order.tokenNumber}</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button aria-haspopup="true" size="icon" variant="ghost">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem>Update Status</DropdownMenuItem>
                  <DropdownMenuItem>Print Receipt</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Table {order.tableNumber}</span>
                    </div>
                     <Badge variant="outline" className={`capitalize font-semibold border ${statusStyles[order.status]}`}>
                        {order.status}
                    </Badge>
                </div>
                <Separator />
                <div className="space-y-2">
                    {order.products.map(p => (
                        <div key={p.productId} className="flex justify-between items-center text-sm">
                            <p>{p.name}</p>
                            <p className="text-muted-foreground">x{p.qty}</p>
                        </div>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 pt-4 border-t">
                <div className="flex justify-between w-full items-center">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{format(order.createdAt, 'p')}</span>
                    </div>
                     <div className="flex items-center gap-1 font-bold text-lg text-foreground">
                        <span className="text-sm font-semibold">NPR</span>
                        <span>{order.totalPrice.toFixed(2)}</span>
                    </div>
                </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
