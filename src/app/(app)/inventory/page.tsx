
'use client';

import { useState, useMemo } from 'react';
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
import { mockInventoryTransactions as initialTransactions, mockProducts } from '@/lib/mock-data';
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
import type { InventoryTransaction } from '@/lib/types';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { TablePagination } from '@/components/ui/table-pagination';

const transactionSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  qtyChange: z.coerce.number().int().refine(val => val !== 0, 'Quantity cannot be zero'),
  reason: z.enum(['stock-in', 'usage', 'spoilage'], { required_error: 'Reason is required.' }),
});

const ITEMS_PER_PAGE = 10;

export default function InventoryPage() {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>(initialTransactions);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      productId: '',
      qtyChange: 0,
      reason: 'stock-in',
    },
  });

  const onSubmit = (values: z.infer<typeof transactionSchema>) => {
    const product = mockProducts.find(p => p.id === values.productId);
    if (!product) return;

    const newTransaction: InventoryTransaction = {
      id: `t${transactions.length + 1}`,
      productName: product.name,
      date: new Date(),
      ...values,
    };
    setTransactions([newTransaction, ...transactions]);
    toast({
      title: 'Transaction Added',
      description: `Stock for ${product.name} has been updated.`,
    });
    form.reset();
    setIsDialogOpen(false);
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
        if (dateFilter === 'all') return true;
        if (dateFilter === 'today') return isToday(transaction.date);
        if (dateFilter === 'week') return isThisWeek(transaction.date, { weekStartsOn: 1 });
        if (dateFilter === 'month') return isThisMonth(transaction.date);
        if (dateFilter === 'year') return isThisYear(transaction.date);
        return true;
      });
  }, [transactions, searchTerm, dateFilter]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
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
          />
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
              {paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{format(tx.date, 'MMM d, yyyy p')}</TableCell>
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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
           <Button
            size="icon"
            className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-lg"
          >
            <PlusCircle className="h-8 w-8" />
            <span className="sr-only">Add Transaction</span>
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
                        {mockProducts.map(p => (
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
    </>
  );
}
