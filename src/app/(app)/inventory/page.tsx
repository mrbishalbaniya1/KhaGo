
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { PlusCircle } from 'lucide-react';
import { format, isToday, isThisWeek, isThisMonth, isThisYear } from 'date-fns';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { InventoryTransaction, Product } from '@/lib/types';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { TablePagination } from '@/components/ui/table-pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, Timestamp, query, where } from 'firebase/firestore';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

const transactionSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  qtyChange: z.coerce.number().int().refine(val => val !== 0, 'Quantity cannot be zero'),
  reason: z.enum(['stock-in', 'usage', 'spoilage'], { required_error: 'Reason is required.' }),
});

const ITEMS_PER_PAGE = 10;

export default function InventoryPage() {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, managerId } = useAuth();

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
        setIsDialogOpen(true);
        router.replace('/inventory', { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (!user || !managerId) return;

      const unsubProducts = onSnapshot(query(collection(db, 'products'), where('managerId', '==', managerId)), (snapshot) => {
          const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
          setProducts(productsData);
      });

      const unsubTransactions = onSnapshot(query(collection(db, 'inventory'), where('managerId', '==', managerId)), (snapshot) => {
          const transactionsData = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                  id: doc.id,
                  ...data,
                  date: (data.date as Timestamp).toDate()
              } as InventoryTransaction
          });
          setTransactions(transactionsData.sort((a,b) => (b.date as Date).getTime() - (a.date as Date).getTime()));
      });

      return () => {
          unsubProducts();
          unsubTransactions();
      }
  }, [user, managerId]);

  const stockManagedProducts = useMemo(() => products.filter(p => p.isStockManaged), [products]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      productId: '',
      qtyChange: 0,
      reason: 'stock-in',
    },
  });

  const onSubmit = async (values: z.infer<typeof transactionSchema>) => {
    const product = stockManagedProducts.find(p => p.id === values.productId);
    if (!user || !managerId || !product) return;

    try {
        await addDoc(collection(db, 'inventory'), {
            ...values,
            productName: product.name,
            date: Timestamp.now(),
            managerId: managerId,
        });
        toast({
        title: 'Transaction Added',
        description: `Stock for ${product.name} has been updated.`,
        });
        form.reset();
        setIsDialogOpen(false);
    } catch (error) {
        toast({ title: 'Error', description: 'Failed to add transaction.', variant: 'destructive' });
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((transaction) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          transaction.productName.toLowerCase().includes(searchLower) ||
          transaction.reason.toLowerCase().includes(searchLower)
        );
      })
      .filter((transaction) => {
        const txDate = transaction.date as Date;
        if (dateFilter === 'all') return true;
        if (dateFilter === 'today') return isToday(txDate);
        if (dateFilter === 'week') return isThisWeek(txDate, { weekStartsOn: 1 });
        if (dateFilter === 'month') return isThisMonth(txDate);
        if (dateFilter === 'year') return isThisYear(txDate);
        return true;
      });
  }, [transactions, searchTerm, dateFilter]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  const TableSkeleton = () => (
    [...Array(ITEMS_PER_PAGE)].map((_, i) => (
      <TableRow key={i}>
        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
      </TableRow>
    ))
  );

  return (
    <>
      <Card>
        <CardHeader>
           <TableToolbar
            title="Inventory Transactions"
            description="Track and manage your stock movements."
            searchTerm={searchTerm}
            onSearchTermChange={(term) => {
              setSearchTerm(term);
              setCurrentPage(1);
            }}
            dateFilter={dateFilter}
            onDateFilterChange={(filter) => {
              setDateFilter(filter);
              setCurrentPage(1);
            }}
            searchPlaceholder="Search by product name or reason..."
          >
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full sm:w-auto">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Transaction</DialogTitle>
                  <DialogDescription>
                    Fill in the details below to add a new stock transaction.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="productId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a product" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {stockManagedProducts.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="qtyChange"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity Change</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g., -10 or 20" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reason</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a reason" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="stock-in">Stock-In (Purchase)</SelectItem>
                              <SelectItem value="usage">Usage (Sales)</SelectItem>
                              <SelectItem value="spoilage">Spoilage</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline" onClick={() => form.reset()}>Cancel</Button>
                      </DialogClose>
                      <Button type="submit">Add Transaction</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
           </TableToolbar>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Quantity Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isClient ? (
                paginatedTransactions.length > 0 ? (
                  paginatedTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{format(tx.date as Date, 'MMM d, yyyy p')}</TableCell>
                      <TableCell className="font-medium">{tx.productName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">{tx.reason.replace('-', ' ')}</Badge>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${tx.qtyChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.qtyChange > 0 ? `+${tx.qtyChange}` : tx.qtyChange}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                )
              ) : (
                <TableSkeleton />
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredTransactions.length}
            itemsPerPage={ITEMS_PER_PAGE}
            itemName="transactions"
          />
        </CardFooter>
      </Card>
    </>
  );
}
