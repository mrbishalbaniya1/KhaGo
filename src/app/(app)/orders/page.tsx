

'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
import { MoreHorizontal, PlusCircle, Trash2, Printer, Pencil, Eye, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { PrintReceipt } from '@/components/print-receipt';

const statusStyles: { [key: string]: string } = {
  pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  preparing: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  ready: 'bg-green-500/10 text-green-500 border-green-500/20',
  delivered: 'bg-primary/10 text-primary border-primary/20',
  paid: 'bg-gray-500/10 text-muted-foreground border-gray-500/20',
};

const paymentStatusStyles: { [key: string]: string } = {
  pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  paid: 'bg-green-500/10 text-green-500 border-green-500/20',
  refunded: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const ITEMS_PER_PAGE = 10;
const orderStatuses: Order['status'][] = ['pending', 'preparing', 'ready', 'delivered'];
const paymentMethods: Exclude<Order['paymentMethod'], undefined>[] = ['cash', 'online', 'pending'];
const paymentStatuses: Order['paymentStatus'][] = ['pending', 'paid', 'refunded'];

const orderProductSchema = z.object({
    name: z.string().min(1, 'Product name is required.'),
    qty: z.coerce.number().min(1, 'Quantity must be at least 1.'),
    price: z.coerce.number().nonnegative('Price must be a positive number.'),
    productId: z.string().optional(),
});


const orderSchema = z.object({
  tableNumber: z.union([z.coerce.number().int().positive(), z.literal("")]).optional(),
  customerName: z.string().optional(),
  products: z.array(orderProductSchema).min(1, 'At least one product is required.'),
  notes: z.string().optional(),
  discount: z.union([z.coerce.number().nonnegative(), z.literal("")]).optional(),
  tip: z.union([z.coerce.number().nonnegative(), z.literal("")]).optional(),
  paymentMethod: z.enum(paymentMethods),
  paymentStatus: z.enum(paymentStatuses),
}).superRefine((data, ctx) => {
    if (!data.tableNumber && !data.customerName) {
        const errorMessage = "Either Table Number or Customer Name is required.";
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['tableNumber'],
            message: errorMessage,
        });
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['customerName'],
            message: errorMessage,
        });
    }
});


const quickMenuItems = mockProducts.filter(p => p.popularityScore >= 8);

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  const [isUpdateStatusDialogOpen, setIsUpdateStatusDialogOpen] = useState(false);
  const [isAddOrderDialogOpen, setIsAddOrderDialogOpen] = useState(false);
  const [isEditOrderDialogOpen, setIsEditOrderDialogOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isViewOrderDialogOpen, setIsViewOrderDialogOpen] = useState(false);
  const [isUpdatePaymentDialogOpen, setIsUpdatePaymentDialogOpen] = useState(false);
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<Order['status']>('pending');
  const [paymentDetails, setPaymentDetails] = useState<{method: Order['paymentMethod'], status: Order['paymentStatus']}>({method: 'pending', status: 'pending'});
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = document.getElementById('print-receipt');
    if (printContent) {
      const parent = printContent.parentElement;
      if (parent) {
        parent.classList.add('printable');
        window.print();
        parent.classList.remove('printable');
      }
    }
  };

  const handleDownload = () => {
    if (receiptRef.current) {
        html2canvas(receiptRef.current).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF();
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`receipt-${selectedOrder?.tokenNumber}.pdf`);
        });
    }
  };


  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const baseOrderForm = useForm<z.infer<typeof orderSchema>>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      tableNumber: '',
      customerName: '',
      products: [],
      notes: '',
      discount: '',
      tip: '',
      paymentMethod: 'pending',
      paymentStatus: 'pending',
    },
  });

  const addOrderForm = useForm<z.infer<typeof orderSchema>>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      tableNumber: '',
      customerName: '',
      products: [],
      notes: '',
      discount: '',
      tip: '',
      paymentMethod: 'pending',
      paymentStatus: 'pending',
    },
  });
  
  const { fields, append, remove, update } = useFieldArray({
    control: addOrderForm.control,
    name: "products",
  });
  
  const { fields: editFields, append: editAppend, remove: editRemove, update: editUpdate } = useFieldArray({
    control: baseOrderForm.control,
    name: "products",
  });

  const onAddOrderSubmit = (values: z.infer<typeof orderSchema>) => {
    const newOrderProducts = values.products.map(p => {
        const productDetails = mockProducts.find(mp => mp.name === p.name);
        return {
            productId: productDetails?.id || `custom-${Date.now()}`,
            name: p.name,
            qty: p.qty,
            price: p.price,
        };
    });

    const subtotal = newOrderProducts.reduce((acc, p) => acc + (p.price * p.qty), 0);
    const discount = Number(values.discount || 0);
    const tip = Number(values.tip || 0);
    const totalPrice = subtotal - discount + tip;
    
    let paymentStatus = values.paymentStatus;
    if (values.paymentMethod === 'cash' || values.paymentMethod === 'online') {
        paymentStatus = 'paid';
    }


    const newOrder: Order = {
        id: `o${orders.length + 1}`,
        tokenNumber: `A${(Math.floor(Math.random() * 900) + 100)}`,
        tableNumber: values.tableNumber ? Number(values.tableNumber) : undefined,
        customerName: values.customerName,
        products: newOrderProducts,
        subtotal: subtotal,
        discount: discount,
        tip: tip,
        totalPrice: totalPrice,
        notes: values.notes,
        status: 'pending',
        createdAt: new Date(),
        paymentMethod: values.paymentMethod,
        paymentStatus: paymentStatus,
    };

    setOrders([newOrder, ...orders]);
    
    // Deduct stock for managed products
    setProducts(currentProducts => {
      const newProducts = [...currentProducts];
      newOrder.products.forEach(orderProduct => {
        const productIndex = newProducts.findIndex(p => p.id === orderProduct.productId);
        if (productIndex !== -1) {
          const product = newProducts[productIndex];
          if (product.isStockManaged) {
            newProducts[productIndex] = { ...product, stockQty: product.stockQty - orderProduct.qty };
          }
        }
      });
      return newProducts;
    });

    toast({
        title: "Order Created",
        description: `New order for table ${values.tableNumber || (values.customerName || 'takeaway')} has been placed.`,
    });
    addOrderForm.reset({
      tableNumber: '',
      customerName: '',
      products: [{ name: '', qty: 1, price: 0, productId: '' }],
      notes: '',
      discount: '',
      tip: '',
      paymentMethod: 'pending',
      paymentStatus: 'pending',
    });
    setIsAddOrderDialogOpen(false);
  };

  const onEditOrderSubmit = (values: z.infer<typeof orderSchema>) => {
    if (!selectedOrder) return;
    
    const updatedProducts = values.products.map(p => {
        const productDetails = mockProducts.find(mp => mp.name === p.name);
        return {
            productId: p.productId || productDetails?.id || selectedOrder.products.find(op => op.name === p.name)?.productId || `custom-${Date.now()}`,
            name: p.name,
            qty: p.qty,
            price: p.price,
        };
    });

    const subtotal = updatedProducts.reduce((acc, p) => acc + (p.price * p.qty), 0);
    const discount = Number(values.discount || 0);
    const tip = Number(values.tip || 0);
    const totalPrice = subtotal - discount + tip;

     let paymentStatus = values.paymentStatus;
    if (values.paymentMethod === 'cash' || values.paymentMethod === 'online') {
        paymentStatus = 'paid';
    }
    
    setOrders(orders.map(o => o.id === selectedOrder.id ? { 
        ...o, 
        ...values,
        tableNumber: values.tableNumber ? Number(values.tableNumber) : undefined,
        customerName: values.customerName || '',
        notes: values.notes || '',
        discount: Number(values.discount || 0),
        tip: Number(values.tip || 0),
        products: updatedProducts,
        paymentMethod: values.paymentMethod,
        paymentStatus: paymentStatus,
        subtotal,
        totalPrice,
     } : o));
    
    toast({
        title: "Order Updated",
        description: `Order #${selectedOrder.tokenNumber} has been updated.`,
    });
    setIsEditOrderDialogOpen(false);
    setSelectedOrder(null);
  }
  
  const addProductToOrder = useCallback((product: Product, form: typeof addOrderForm | typeof baseOrderForm, fieldOps: {append: any, update: any, fields: any[]}) => {
    const { append, update, fields } = fieldOps;
    
    const watchedProducts = form.getValues('products') || [];

    const existingProductIndex = watchedProducts.findIndex(
      (field) => field.productId === product.id
    );

    if (existingProductIndex !== -1) {
      const existingProduct = watchedProducts[existingProductIndex];
      update(existingProductIndex, {
        ...existingProduct,
        qty: (existingProduct.qty || 0) + 1,
      });
    } else {
       if (watchedProducts.length === 1 && watchedProducts[0].name === '') {
        update(0, { name: product.name, qty: 1, price: product.price, productId: product.id });
      } else {
        append({ name: product.name, qty: 1, price: product.price, productId: product.id });
      }
    }
  }, []);


  const handleUpdateStatusClick = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setIsUpdateStatusDialogOpen(true);
  };
  
  const handleUpdatePaymentClick = (order: Order) => {
    setSelectedOrder(order);
    setPaymentDetails({method: order.paymentMethod, status: order.paymentStatus});
    setIsUpdatePaymentDialogOpen(true);
  }
  
  const handleViewClick = (order: Order) => {
    setSelectedOrder(order);
    setIsViewOrderDialogOpen(true);
  }

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

  const handleUpdatePayment = () => {
    if (!selectedOrder) return;
     let status = paymentDetails.status;
    if (paymentDetails.method === 'cash' || paymentDetails.method === 'online') {
      status = 'paid';
    }
    setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, paymentMethod: paymentDetails.method, paymentStatus: status } : o));
    toast({
      title: 'Payment Updated',
      description: `Payment details for order #${selectedOrder.tokenNumber} have been updated.`,
    });
    setIsUpdatePaymentDialogOpen(false);
    setSelectedOrder(null);
  }
  
  const handleEditClick = (order: Order) => {
    setSelectedOrder(order);
    baseOrderForm.reset({
        ...order,
        tableNumber: order.tableNumber || '',
        customerName: order.customerName || '',
        notes: order.notes || '',
        discount: order.discount || '',
        tip: order.tip || '',
        products: order.products.map(p => ({ name: p.name, qty: p.qty, price: p.price, productId: p.productId })),
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
    });
    setIsEditOrderDialogOpen(true);
  }

  const handleDeleteOrder = (orderId: string) => {
    setOrders(orders.filter(o => o.id !== orderId));
    toast({
        title: "Order Deleted",
        description: "The order has been successfully deleted.",
        variant: "destructive",
    })
  }

  const handlePrintClick = (order: Order) => {
    setSelectedOrder(order);
    setIsPrintDialogOpen(true);
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
      })
      .filter((order) => {
        if (paymentStatusFilter === 'all') return true;
        return order.paymentStatus === paymentStatusFilter;
      });
  }, [orders, searchTerm, statusFilter, paymentStatusFilter]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  const WatchedForm = ({ control } : { control: typeof addOrderForm.control | typeof baseOrderForm.control }) => {
    const watchedProducts = useWatch({ control, name: 'products' });
    const watchedDiscount = useWatch({ control, name: 'discount' });
    const watchedTip = useWatch({ control, name: 'tip' });

    const subtotal = useMemo(() => {
      if (!watchedProducts) return 0;
      return watchedProducts.reduce((acc, p) => acc + ((p?.price || 0) * (p?.qty || 0)), 0);
    }, [watchedProducts]);

    const total = subtotal - (Number(watchedDiscount) || 0) + (Number(watchedTip) || 0);

    return (
       <div className="space-y-2 p-4 rounded-lg bg-muted/50">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-medium">NPR {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount</span>
            <span className="font-medium text-destructive">- NPR {(Number(watchedDiscount) || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tip</span>
            <span className="font-medium text-green-600">+ NPR {(Number(watchedTip) || 0).toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>NPR {total.toFixed(2)}</span>
          </div>
        </div>
    );
  };
  
  const TableSkeleton = () => (
    [...Array(ITEMS_PER_PAGE)].map((_, i) => (
      <TableRow key={i}>
        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
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
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={statusFilter} onValueChange={(value) => { if(value) { setStatusFilter(value); setCurrentPage(1);} }}>
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
               <Select value={paymentStatusFilter} onValueChange={(value) => { if(value) { setPaymentStatusFilter(value); setCurrentPage(1);} }}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by payment" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">All Payments</SelectItem>
                      {paymentStatuses.map(status => (
                        <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
            </div>
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
                <TableHead>Payment</TableHead>
                <TableHead>Method</TableHead>
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
                            <TableCell className="font-medium">
                                <button onClick={() => handleViewClick(order)} className="hover:underline">
                                    #{order.tokenNumber}
                                </button>
                            </TableCell>
                            <TableCell>{order.tableNumber || '-'}</TableCell>
                            <TableCell>{order.customerName || '-'}</TableCell>
                            <TableCell>
                              <button onClick={() => handleUpdateStatusClick(order)}>
                                <Badge variant="outline" className={`capitalize font-semibold border ${statusStyles[order.status]}`}>
                                    {order.status}
                                </Badge>
                              </button>
                            </TableCell>
                             <TableCell>
                              <button onClick={() => handleUpdatePaymentClick(order)}>
                                <Badge variant="outline" className={`capitalize font-semibold border ${paymentStatusStyles[order.paymentStatus]}`}>
                                    {order.paymentStatus}
                                </Badge>
                              </button>
                            </TableCell>
                            <TableCell>
                                <button onClick={() => handleUpdatePaymentClick(order)} className="capitalize w-full text-left">
                                 {order.paymentMethod}
                                </button>
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
                                    <DropdownMenuItem onClick={() => handleViewClick(order)}>
                                        <Eye className="mr-2 h-4 w-4" /> View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEditClick(order)}>
                                        <Pencil className="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleUpdateStatusClick(order)}>Update Status</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handlePrintClick(order)}>
                                        <Printer className="mr-2 h-4 w-4" /> Print Receipt
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                                          </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the order.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteOrder(order.id)}>
                                                Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={10} className="text-center">
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
      
      {/* Add Order Dialog */}
      <Dialog open={isAddOrderDialogOpen} onOpenChange={setIsAddOrderDialogOpen}>
        <DialogTrigger asChild>
          <Button
            size="icon"
            className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-lg"
            onClick={() => {
              addOrderForm.reset({
                  tableNumber: '',
                  customerName: '',
                  products: [{ name: '', qty: 1, price: 0, productId: '' }],
                  notes: '',
                  discount: '',
                  tip: '',
                  paymentMethod: 'pending',
                  paymentStatus: 'pending',
              });
              setIsAddOrderDialogOpen(true);
            }}
          >
            <PlusCircle className="h-8 w-8" />
            <span className="sr-only">Create Order</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl h-full sm:h-auto">
           <ScrollArea className="h-full">
                <DialogHeader className="p-6">
                    <DialogTitle>Create New Order</DialogTitle>
                    <DialogDescription>
                    Select products, customer details, and any discounts to create a new order.
                    </DialogDescription>
                </DialogHeader>
                <Form {...addOrderForm}>
                    <form onSubmit={addOrderForm.handleSubmit(onAddOrderSubmit)} className="px-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={addOrderForm.control}
                                name="tableNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Table Number (Optional)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="e.g., 5" {...field} value={field.value || ''} />
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
                                            <Input placeholder="e.g., Jane Doe" {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        
                        <div>
                            <Label>Products</Label>
                             <div className="space-y-2 mt-2">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="grid grid-cols-[1fr_80px_80px_auto] items-start gap-2">
                                         <FormField
                                            control={addOrderForm.control}
                                            name={`products.${index}.name`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input placeholder="Product Name" {...field} />
                                                    </FormControl>
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
                                                        <Input type="number" placeholder="Qty" {...field} min={1} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={addOrderForm.control}
                                            name={`products.${index}.price`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input type="number" placeholder="Price" {...field} min={0} />
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
                                onClick={() => append({ name: '', qty: 1, price: 0, productId: '' })}
                            >
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Product
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <FormField
                            control={addOrderForm.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Notes</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="e.g., extra spicy, no onions" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={addOrderForm.control}
                                name="discount"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Discount (NPR)</FormLabel>
                                    <FormControl>
                                    <Input type="number" placeholder="0.00" {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={addOrderForm.control}
                                name="tip"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tip (NPR)</FormLabel>
                                    <FormControl>
                                    <Input type="number" placeholder="0.00" {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            </div>
                        </div>
                        </div>
                        <div className="space-y-4">
                        <div>
                            <Label>Quick Menu</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                            {quickMenuItems.map(item => (
                                <Button key={item.id} type="button" variant="outline" className="h-auto" onClick={() => addProductToOrder(item, addOrderForm, { append, update, fields })}>
                                <div className="p-1 text-center">
                                    <span className="block text-sm font-medium">{item.name}</span>
                                    <span className="block text-xs text-muted-foreground">NPR {item.price}</span>
                                </div>
                                </Button>
                            ))}
                            </div>
                        </div>
                        <WatchedForm control={addOrderForm.control} />
                        <div className="space-y-4 rounded-lg bg-muted/50 p-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={addOrderForm.control}
                              name="paymentMethod"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Payment Method</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select method" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {paymentMethods.map(method => (
                                        <SelectItem key={method} value={method} className="capitalize">{method}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={addOrderForm.control}
                              name="paymentStatus"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Payment Status</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {paymentStatuses.map(status => (
                                        <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-8 p-6 sticky bottom-0 bg-background">
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit">Create Order</Button>
                    </DialogFooter>
                    </form>
                </Form>
           </ScrollArea>
        </DialogContent>
      </Dialog>
      
      {/* Edit Order Dialog */}
       <Dialog open={isEditOrderDialogOpen} onOpenChange={setIsEditOrderDialogOpen}>
        <DialogContent className="max-w-4xl h-full sm:h-auto">
           <ScrollArea className="h-full">
                <DialogHeader className="p-6">
                    <DialogTitle>Edit Order #{selectedOrder?.tokenNumber}</DialogTitle>
                    <DialogDescription>
                    Update products, customer details, and other information for this order.
                    </DialogDescription>
                </DialogHeader>
                <Form {...baseOrderForm}>
                    <form onSubmit={baseOrderForm.handleSubmit(onEditOrderSubmit)} className="px-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={baseOrderForm.control}
                                name="tableNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Table Number (Optional)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="e.g., 5" {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={baseOrderForm.control}
                                name="customerName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Customer Name (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Jane Doe" {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        
                        <div>
                           <Label>Products</Label>
                             <div className="space-y-2 mt-2">
                                {editFields.map((field, index) => (
                                    <div key={field.id} className="grid grid-cols-[1fr_80px_80px_auto] items-start gap-2">
                                        <FormField
                                            control={baseOrderForm.control}
                                            name={`products.${index}.name`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                      <Input placeholder="Product Name" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={baseOrderForm.control}
                                            name={`products.${index}.qty`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input type="number" placeholder="Qty" {...field} min={1} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={baseOrderForm.control}
                                            name={`products.${index}.price`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input type="number" placeholder="Price" {...field} min={0} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button type="button" variant="destructive" size="icon" onClick={() => editRemove(index)} disabled={editFields.length <=1}>
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
                                onClick={() => editAppend({ name: '', qty: 1, price: 0, productId: '' })}
                            >
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Product
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <FormField
                            control={baseOrderForm.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Notes</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="e.g., extra spicy, no onions" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={baseOrderForm.control}
                                name="discount"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Discount (NPR)</FormLabel>
                                    <FormControl>
                                    <Input type="number" placeholder="0.00" {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={baseOrderForm.control}
                                name="tip"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tip (NPR)</FormLabel>
                                    <FormControl>
                                    <Input type="number" placeholder="0.00" {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            </div>
                        </div>
                        </div>
                        <div className="space-y-4">
                        <div>
                            <Label>Quick Menu</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                            {quickMenuItems.map(item => (
                                <Button key={item.id} type="button" variant="outline" className="h-auto" onClick={() => addProductToOrder(item, baseOrderForm, { append: editAppend, update: editUpdate, fields: editFields })}>
                                <div className="p-1 text-center">
                                    <span className="block text-sm font-medium">{item.name}</span>
                                    <span className="block text-xs text-muted-foreground">NPR {item.price}</span>
                                </div>
                                </Button>
                            ))}
                            </div>
                        </div>
                        <WatchedForm control={baseOrderForm.control} />
                         <div className="space-y-4 rounded-lg bg-muted/50 p-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={baseOrderForm.control}
                              name="paymentMethod"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Payment Method</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select method" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {paymentMethods.map(method => (
                                        <SelectItem key={method} value={method} className="capitalize">{method}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={baseOrderForm.control}
                              name="paymentStatus"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Payment Status</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {paymentStatuses.map(status => (
                                        <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-8 p-6 sticky bottom-0 bg-background">
                        <DialogClose asChild>
                            <Button variant="outline" onClick={() => setIsEditOrderDialogOpen(false)}>Cancel</Button>
                        </DialogClose>
                        <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                    </form>
                </Form>
           </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewOrderDialogOpen} onOpenChange={setIsViewOrderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              A read-only view of order #{selectedOrder?.tokenNumber}.
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Table:</strong> {selectedOrder.tableNumber || "N/A"}</div>
                  <div><strong>Customer:</strong> {selectedOrder.customerName || "N/A"}</div>
                  <div><strong>Status:</strong> <span className="capitalize">{selectedOrder.status}</span></div>
                  <div><strong>Payment:</strong> <span className="capitalize">{selectedOrder.paymentStatus} ({selectedOrder.paymentMethod})</span></div>
              </div>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold">Items</h4>
                 <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.products.map(p => (
                      <TableRow key={p.productId}>
                        <TableCell>{p.name}</TableCell>
                        <TableCell className="text-center">{p.qty}</TableCell>
                        <TableCell className="text-right">{(p.price).toFixed(2)}</TableCell>
                        <TableCell className="text-right">{(p.price * p.qty).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Separator />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>NPR {selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                    <div className="flex justify-between">
                        <span>Discount</span>
                        <span>- NPR {selectedOrder.discount.toFixed(2)}</span>
                    </div>
                )}
                 {selectedOrder.tip > 0 && (
                    <div className="flex justify-between">
                        <span>Tip</span>
                        <span>+ NPR {selectedOrder.tip.toFixed(2)}</span>
                    </div>
                )}
                 <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                    <span>Total</span>
                    <span>NPR {selectedOrder.totalPrice.toFixed(2)}</span>
                </div>
              </div>
               {selectedOrder.notes && (
                <>
                  <Separator />
                   <div className="text-sm">
                      <h4 className="font-semibold mb-1">Notes:</h4>
                      <p className="text-muted-foreground">{selectedOrder.notes}</p>
                  </div>
                </>
              )}
            </div>
          )}
           <DialogFooter>
            <DialogClose asChild>
              <Button>Close</Button>
            </DialogClose>
          </DialogFooter>
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
      
       <Dialog open={isUpdatePaymentDialogOpen} onOpenChange={setIsUpdatePaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Payment Details</DialogTitle>
            <DialogDescription>
              Update payment for order #{selectedOrder?.tokenNumber}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
                <Label htmlFor="payment-method">Payment Method</Label>
                <Select 
                    value={paymentDetails.method} 
                    onValueChange={(value: Order['paymentMethod']) => {
                        let newStatus = paymentDetails.status;
                        if (value === 'cash' || value === 'online') {
                            newStatus = 'paid';
                        }
                        setPaymentDetails({method: value, status: newStatus})
                    }}
                >
                    <SelectTrigger id="payment-method" className="w-full mt-2">
                        <SelectValue placeholder="Select a method" />
                    </SelectTrigger>
                    <SelectContent>
                        {paymentMethods.map(method => (
                        <SelectItem key={method} value={method} className="capitalize">{method}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <div>
                <Label htmlFor="payment-status">Payment Status</Label>
                <Select 
                    value={paymentDetails.status} 
                    onValueChange={(value: Order['paymentStatus']) => setPaymentDetails(prev => ({...prev, status: value}))}
                >
                    <SelectTrigger id="payment-status" className="w-full mt-2">
                        <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                        {paymentStatuses.map(status => (
                        <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleUpdatePayment}>Update Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent className="max-w-md" id="print-receipt">
           <DialogHeader>
            <DialogTitle>Print Receipt</DialogTitle>
            <DialogDescription>
              Preview of the receipt for order #{selectedOrder?.tokenNumber}.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
             <PrintReceipt order={selectedOrder!} />
          </div>
          <DialogFooter className="mt-4">
            <Button onClick={handleDownload} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
            <Button onClick={handlePrint}>Print Receipt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="absolute -left-[9999px] -top-[9999px]">
        {selectedOrder && <PrintReceipt ref={receiptRef} order={selectedOrder} />}
      </div>
    </>
  );
}
