
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
import { Button } from '@/components/ui/button';
import { PlusCircle, Search } from 'lucide-react';
import { mockExpenses as initialExpenses } from '@/lib/mock-data';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { Expense } from '@/lib/types';
import { TablePagination } from '@/components/ui/table-pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const expenseSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  description: z.string().optional(),
  date: z.date({ required_error: 'A date is required.' }),
});

const ITEMS_PER_PAGE = 10;

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('week');
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: '',
      amount: 0,
      description: '',
      date: new Date(),
    },
  });

  const onSubmit = (values: z.infer<typeof expenseSchema>) => {
    const newExpense: Expense = {
      id: `e${expenses.length + 1}`,
      ...values,
      description: values.description || '',
    };
    setExpenses([newExpense, ...expenses]);
    toast({
      title: 'Expense Added',
      description: `The expense for ${values.category} has been added successfully.`,
    });
    form.reset();
    setIsDialogOpen(false);
  };

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((expense) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          expense.category.toLowerCase().includes(searchLower) ||
          expense.description.toLowerCase().includes(searchLower)
        );
      })
      .filter((expense) => {
        if (dateFilter === 'all') return true;
        if (dateFilter === 'today') return isToday(expense.date);
        if (dateFilter === 'week') return isThisWeek(expense.date, { weekStartsOn: 1 });
        if (dateFilter === 'month') return isThisMonth(expense.date);
        if (dateFilter === 'year') return isThisYear(expense.date);
        return true;
      });
  }, [expenses, searchTerm, dateFilter]);

  const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE);
  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  const TableSkeleton = () => (
    [...Array(ITEMS_PER_PAGE)].map((_, i) => (
      <TableRow key={i}>
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
      </TableRow>
    ))
  );

  return (
    <>
      <Card>
        <CardHeader>
           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Expenses</CardTitle>
                <CardDescription>Track and manage your business expenses.</CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New Expense</DialogTitle>
                    <DialogDescription>
                      Fill in the details below to add a new expense.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Groceries" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount (NPR)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="e.g., Weekly vegetable supply"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={'outline'}
                                    className={cn(
                                      'w-full pl-3 text-left font-normal',
                                      !field.value && 'text-muted-foreground'
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, 'PPP')
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() || date < new Date('1900-01-01')
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit">Add Expense</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
             <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by category or description..."
                  className="w-full rounded-lg bg-background pl-8 sm:w-[300px]"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
                <Select
                  value={dateFilter}
                  onValueChange={(value) => {
                    if (value) {
                      setDateFilter(value);
                      setCurrentPage(1);
                    }
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isClient ? (
                  paginatedExpenses.length > 0 ? (
                      paginatedExpenses.map((expense) => (
                          <TableRow key={expense.id}>
                              <TableCell>{format(expense.date, 'MMM d, yyyy')}</TableCell>
                              <TableCell className="font-medium">
                              {expense.category}
                              </TableCell>
                              <TableCell>{expense.description}</TableCell>
                              <TableCell className="text-right">
                              NPR {expense.amount.toFixed(2)}
                              </TableCell>
                          </TableRow>
                      ))
                  ) : (
                      <TableRow>
                          <TableCell colSpan={4} className="text-center">
                              No expenses found.
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
            totalItems={filteredExpenses.length}
            itemsPerPage={ITEMS_PER_PAGE}
            itemName="expenses"
          />
        </CardFooter>
      </Card>
    </>
  );
}
