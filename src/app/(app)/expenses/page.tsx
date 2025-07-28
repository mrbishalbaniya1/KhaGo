
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
import { PlusCircle, Search, MoreHorizontal, Trash2 } from 'lucide-react';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
  } from '@/components/ui/dropdown-menu';
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
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, Timestamp, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

const expenseSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  description: z.string().optional(),
  date: z.date({ required_error: 'A date is required.' }),
});

const ITEMS_PER_PAGE = 10;

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('week');
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, managerId } = useAuth();

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
        setIsAddDialogOpen(true);
        router.replace('/expenses', { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    setIsClient(true);
    if (!user || !managerId) return;

    const q = query(collection(db, 'expenses'), where("managerId", "==", managerId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const expensesData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: (data.date as Timestamp).toDate(),
            } as Expense;
        });
        setExpenses(expensesData.sort((a, b) => (b.date as Date).getTime() - (a.date as Date).getTime()));
    });
    return () => unsubscribe();
  }, [user, managerId]);

  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: '',
      amount: 0,
      description: '',
      date: new Date(),
    },
  });

   const editForm = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
  });

  const onAddSubmit = async (values: z.infer<typeof expenseSchema>) => {
    if (!user || !managerId) return;
    try {
        await addDoc(collection(db, 'expenses'), {
            ...values,
            date: Timestamp.fromDate(values.date),
            managerId: managerId,
        });
        toast({
        title: 'Expense Added',
        description: `The expense for ${values.category} has been added successfully.`,
        });
        form.reset();
        setIsAddDialogOpen(false);
    } catch (error) {
        toast({ title: 'Error', description: 'Failed to add expense.', variant: 'destructive' });
    }
  };
  
  const onEditSubmit = async (values: z.infer<typeof expenseSchema>) => {
    if (!selectedExpense) return;
    try {
        const expenseDoc = doc(db, 'expenses', selectedExpense.id);
        await updateDoc(expenseDoc, {
             ...values,
            date: Timestamp.fromDate(values.date),
        });
        toast({
            title: 'Expense Updated',
            description: 'The expense has been updated successfully.',
        });
        setIsEditDialogOpen(false);
        setSelectedExpense(null);
    } catch (error) {
        toast({ title: 'Error', description: 'Failed to update expense.', variant: 'destructive' });
    }
  }
  
  const handleEditClick = (expense: Expense) => {
      setSelectedExpense(expense);
      editForm.reset({
          ...expense,
          date: expense.date as Date,
      });
      setIsEditDialogOpen(true);
  }

  const handleDeleteExpense = async (expenseId: string) => {
      try {
          await deleteDoc(doc(db, 'expenses', expenseId));
          toast({
              title: 'Expense Deleted',
              description: 'The expense has been deleted successfully.',
              variant: 'destructive',
          });
      } catch (error) {
           toast({ title: 'Error', description: 'Failed to delete expense.', variant: 'destructive' });
      }
  }

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((expense) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          expense.category.toLowerCase().includes(searchLower) ||
          expense.description?.toLowerCase().includes(searchLower)
        );
      })
      .filter((expense) => {
        const expenseDate = expense.date as Date;
        if (dateFilter === 'all') return true;
        if (dateFilter === 'today') return isToday(expenseDate);
        if (dateFilter === 'week') return isThisWeek(expenseDate, { weekStartsOn: 1 });
        if (dateFilter === 'month') return isThisMonth(expenseDate);
        if (dateFilter === 'year') return isThisYear(expenseDate);
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
        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
      </TableRow>
    ))
  );

  const ExpenseFormFields = ({ control }: { control: any }) => (
    <>
      <FormField
        control={control}
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
        control={control}
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
        control={control}
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
        control={control}
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
    </>
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
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="w-full sm:w-auto">
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
                    <form onSubmit={form.handleSubmit(onAddSubmit)} className="space-y-4">
                      <ExpenseFormFields control={form.control} />
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
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isClient ? (
                  paginatedExpenses.length > 0 ? (
                      paginatedExpenses.map((expense) => (
                          <TableRow key={expense.id}>
                              <TableCell>{format(expense.date as Date, 'MMM d, yyyy')}</TableCell>
                              <TableCell className="font-medium">
                              {expense.category}
                              </TableCell>
                              <TableCell>{expense.description}</TableCell>
                              <TableCell className="text-right">
                              NPR {expense.amount.toFixed(2)}
                              </TableCell>
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
                                        <DropdownMenuItem onClick={() => handleEditClick(expense)}>
                                            Edit
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
                                                    This action cannot be undone. This will permanently delete the expense record.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteExpense(expense.id)}>
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
                          <TableCell colSpan={5} className="text-center">
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
      
      {/* Edit Expense Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Update the details of your expense record.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <ExpenseFormFields control={editForm.control} />
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
