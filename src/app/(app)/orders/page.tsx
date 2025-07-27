
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import { mockOrders as initialOrders, mockProducts } from '@/lib/mock-data';
import type { Order, Product } from '@/lib/types';
import { format } from 'date-fns';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { TablePagination } from '@/components/ui/table-pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const statusStyles: { [key: string]: string } = {
  pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  preparing: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  ready: 'bg-green-500/10 text-green-500 border-green-500/20',
  delivered: 'bg-primary/10 text-primary border-primary/20',
  paid: 'bg-gray-500/10 text-muted-foreground border-gray-500/20',
};

const ITEMS_PER_PAGE = 10;
const orderStatuses: Order['status'][] = ['pending', 'preparing', 'ready', 'delivered', 'paid'];

const orderSchema = z.object({
  tableNumber: z.coerce.number().optional(),
  customerName: z.string().optional(),
  products: z.array(z.object({
    productId: z.string().min(1, 'Product is required.'),
    qty: z.coerce.number().min(1, 'Quantity must be at least 1.'),
  })).min(1, 'At least one product is required.'),
});

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  const [isUpdateStatusDialogOpen, setIsUpdateStatusDialogOpen] = useState(false);
  const [isAddOrderDialogOpen, setIsAddOrderDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<Order['status']>('pending');

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const addOrderForm = useForm<z.infer<typeof orderSchema>>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      tableNumber: undefined,
      customerName: '',
      products: [{ productId: '', qty: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: addOrderForm.control,
    name: "products",
  });
  
  const onAddOrderSubmit = (values: z.infer<typeof orderSchema>) => {
    const newOrderProducts = values.products.map(p => {
        const productDetails = mockProducts.find(mp => mp.id === p.productId);
        return {
            productId: p.productId,
            name: productDetails?.name || 'Unknown Product',
            qty: p.qty,
            price: productDetails?.price || 0,
        };
    });

    const totalPrice = newOrderProducts.reduce((acc, p) => acc + (p.price * p.qty), 0);

    const newOrder: Order = {
        id: `o${orders.length + 1}`,
        tokenNumber: `A${(Math.floor(Math.random() * 900) + 100)}`,
        tableNumber: values.tableNumber,
        customerName: values.customerName,
        products: newOrderProducts.map(({price, ...rest}) => rest),
        totalPrice: totalPrice,
        status: 'pending',
        createdAt: new Date(),
    };

    setOrders([newOrder, ...orders]);
    toast({
        title: "Order Created",
        description: `New order for table ${values.tableNumber} has been successfully placed.`,
    });
    addOrderForm.reset();
    setIsAddOrderDialogOpen(false);
  };


  const handleUpdateStatusClick = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setIsUpdateStatusDialogOpen(true);
  };

  const handleUpdateStatus = () => {
    if (!selectedOrder) return;
    setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status: newStatus } : o));
    toast({
      title: 'Status Updated',
      description: `Order #${selectedOrder.tokenNumber} is now ${newStatus}.`,
    });
    setIsUpdateStatusDialogOpen(false);
    setSelectedOrder(null);
  }

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          order.tokenNumber.toLowerCase().includes(searchLower) ||
          (order.tableNumber && order.tableNumber.toString().includes(searchLower)) ||
          (order.customerName && order.customerName.toLowerCase().includes(searchLower))
        );
      })
      .filter((order) => {
        if (statusFilter === 'all') return true;
        return order.status === statusFilter;
      });
  }, [orders, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const TableSkeleton = () => (
    [...Array(ITEMS_PER_PAGE)].map((_, i) => (
      <TableRow key={i}>
        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
      </TableRow>
    ))
  );

  return (
    <>
      <Card>
        <CardHeader>
          <TableToolbar
              title="Orders"
              description="View and manage customer orders."
              searchTerm={searchTerm}
              onSearchTermChange={(term) => {
                  setSearchTerm(term);
                  setCurrentPage(1);
              }}
              searchPlaceholder="Search by order, table, or customer..."
              showDateFilter={false}
          >
              <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {orderStatuses.map(status => (
                        <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
          </TableToolbar>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isClient ? (
                paginatedOrders.length > 0 ? (
                    paginatedOrders.map((order) => (
                        <TableRow key={order.id}>
                            <TableCell className="font-medium">#{order.tokenNumber}</TableCell>
                            <TableCell>{order.tableNumber || '-'}</TableCell>
                            <TableCell>{order.customerName || '-'}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={`capitalize font-semibold border ${statusStyles[order.status]}`}>
                                    {order.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {order.products.map(p => `${p.name} (x${p.qty})`).join(', ')}
                            </TableCell>
                            <TableCell>{format(order.createdAt, 'MMM d, yyyy p')}</TableCell>
                            <TableCell className="text-right font-medium">NPR {order.totalPrice.toFixed(2)}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Toggle menu</span>
                                    </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => handleUpdateStatusClick(order)}>Update Status</DropdownMenuItem>
                                    <DropdownMenuItem>Print Receipt</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={8} className="text-center">
                            No orders found.
                        </TableCell>
                    </TableRow>
                )
              ) : <TableSkeleton />}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredOrders.length}
              itemsPerPage={ITEMS_PER_PAGE}
              itemName="orders"
            />
          </CardFooter>
      </Card>
      
      <Dialog open={isAddOrderDialogOpen} onOpenChange={setIsAddOrderDialogOpen}>
        <DialogTrigger asChild>
          <Button
            size="icon"
            className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-lg"
          >
            <PlusCircle className="h-8 w-8" />
            <span className="sr-only">Create Order</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Order</DialogTitle>
            <DialogDescription>
              Select products and table number to create a new order.
            </DialogDescription>
          </DialogHeader>
           <Form {...addOrderForm}>
                <form onSubmit={addOrderForm.handleSubmit(onAddOrderSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                          control={addOrderForm.control}
                          name="tableNumber"
                          render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Table Number (Optional)</FormLabel>
                                  <FormControl>
                                      <Input type="number" placeholder="e.g., 5" {...field} />
                                  </FormControl>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                       <FormField
                          control={addOrderForm.control}
                          name="customerName"
                          render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Customer Name (Optional)</FormLabel>
                                  <FormControl>
                                      <Input placeholder="e.g., Jane Doe" {...field} />
                                  </FormControl>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                    </div>
                    <div>
                        <Label>Products</Label>
                        <div className="space-y-4 mt-2">
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-2">
                                <FormField
                                    control={addOrderForm.control}
                                    name={`products.${index}.productId`}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a product" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {mockProducts.filter(p => p.available).map((product: Product) => (
                                                        <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                             <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={addOrderForm.control}
                                    name={`products.${index}.qty`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input type="number" placeholder="Qty" className="w-20" {...field} min={1}/>
                                            </FormControl>
                                             <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} disabled={fields.length <=1}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => append({ productId: '', qty: 1 })}
                        >
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Product
                        </Button>
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" onClick={() => addOrderForm.reset()}>Cancel</Button>
                        </DialogClose>
                        <Button type="submit">Create Order</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>


      <Dialog open={isUpdateStatusDialogOpen} onOpenChange={setIsUpdateStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Update the status for order #{selectedOrder?.tokenNumber}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="status">New Status</Label>
            <Select value={newStatus} onValueChange={(value: Order['status']) => setNewStatus(value)}>
                <SelectTrigger id="status" className="w-full mt-2">
                    <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                    {orderStatuses.map(status => (
                      <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleUpdateStatus}>Update Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
