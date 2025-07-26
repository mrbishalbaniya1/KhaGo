
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { mockInventoryTransactions as initialTransactions, mockProducts } from '@/lib/mock-data';
import { format } from 'date-fns';
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
import { Skeleton } from '@/components/ui/skeleton';

const transactionSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  qtyChange: z.coerce.number().int().refine(val => val !== 0, 'Quantity cannot be zero'),
  reason: z.enum(['stock-in', 'usage', 'spoilage'], { required_error: 'Reason is required.' }),
});

export default function InventoryPage() {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>(initialTransactions);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

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
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Inventory Transactions</CardTitle>
          <CardDescription>Track all stock movements.</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
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
              transactions.map((tx) => (
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
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-[40px] ml-auto" /></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
