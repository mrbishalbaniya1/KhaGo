
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { Product } from '@/lib/types';
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
  FormDescription,
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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { TablePagination } from '@/components/ui/table-pagination';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  category: z.string().min(1, 'Category is required'),
  price: z.coerce.number().positive('Price must be a positive number'),
  isStockManaged: z.boolean().default(false),
  stockQty: z.coerce.number().int().nonnegative('Stock must be a non-negative number'),
  available: z.boolean().default(true),
  popularityScore: z.coerce.number().min(1).max(10),
  spoilageRisk: z.enum(['low', 'medium', 'high']),
});

const ITEMS_PER_PAGE = 10;

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, managerId } = useAuth();

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
        setIsAddDialogOpen(true);
        router.replace('/products', { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (!user || !managerId) return;

    const q = query(collection(db, 'products'), where("managerId", "==", managerId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(productsData);
    });
    return () => unsubscribe();
  }, [user, managerId]);

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      category: '',
      price: 0,
      isStockManaged: false,
      stockQty: 0,
      available: true,
      popularityScore: 5,
      spoilageRisk: 'medium',
    },
  });

  const editForm = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
  });

  const onAddSubmit = async (values: z.infer<typeof productSchema>) => {
    if (!user || !managerId) return;

    try {
        await addDoc(collection(db, 'products'), { ...values, managerId: managerId });
        toast({
            title: 'Product Added',
            description: `${values.name} has been added to the catalog.`,
        });
        form.reset();
        setIsAddDialogOpen(false);
    } catch (error) {
        toast({ title: 'Error', description: 'Failed to add product.', variant: 'destructive'});
    }
  };

  const onEditSubmit = async (values: z.infer<typeof productSchema>) => {
    if (!selectedProduct) return;
    try {
        const productDoc = doc(db, 'products', selectedProduct.id);
        await updateDoc(productDoc, values);
        toast({
        title: 'Product Updated',
        description: `${values.name}'s information has been updated.`,
        });
        setIsEditDialogOpen(false);
        setSelectedProduct(null);
    } catch (error) {
        toast({ title: 'Error', description: 'Failed to update product.', variant: 'destructive'});
    }
  };

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    editForm.reset(product);
    setIsEditDialogOpen(true);
  };

  const handleDeleteProduct = async (id: string) => {
    try {
        await deleteDoc(doc(db, 'products', id));
        toast({
        title: 'Product Deleted',
        description: 'The product has been removed from the catalog.',
        variant: 'destructive',
        });
    } catch (error) {
        toast({ title: 'Error', description: 'Failed to delete product.', variant: 'destructive'});
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        product.name.toLowerCase().includes(searchLower) ||
        product.category.toLowerCase().includes(searchLower)
      );
    });
  }, [products, searchTerm]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  const ProductFormFields = ({ control }: { control: any }) => {
    const isStockManaged = useWatch({
      control,
      name: 'isStockManaged',
    });

    return (
      <>
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={control}
            name="name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Product Name</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., Chicken Momo" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={control}
            name="category"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., Appetizer" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <FormField
            control={control}
            name="price"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Price (NPR)</FormLabel>
                <FormControl>
                    <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        
        <FormField
            control={control}
            name="isStockManaged"
            render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                    <FormLabel>Track Stock?</FormLabel>
                    <FormDescription>
                    Enable to track inventory for this product.
                    </FormDescription>
                    <FormMessage />
                </div>
                <FormControl>
                    <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    />
                </FormControl>
                </FormItem>
            )}
            />
        
        <div className={cn("space-y-4", !isStockManaged && 'hidden')}>
            <FormField
                control={control}
                name="stockQty"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Stock Quantity</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            <FormField
                control={control}
                name="popularityScore"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Popularity (1-10)</FormLabel>
                    <FormControl>
                        <Input type="number" min="1" max="10" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            <FormField
            control={control}
            name="spoilageRisk"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Spoilage Risk</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select risk level" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <FormField
            control={control}
            name="available"
            render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                    <FormLabel>Available</FormLabel>
                    <FormMessage />
                </div>
                <FormControl>
                    <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    />
                </FormControl>
                </FormItem>
            )}
            />
      </>
    );
  };


  return (
    <>
      <Card>
        <CardHeader>
           <TableToolbar
            title="Products"
            description="Manage your product catalog."
            searchTerm={searchTerm}
            onSearchTermChange={(term) => {
              setSearchTerm(term);
              setCurrentPage(1);
            }}
            searchPlaceholder="Search by product name or category..."
            showDateFilter={false}
          >
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                    <Button size="sm" className="w-full sm:w-auto">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Product
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                    <DialogDescription>
                    Fill in the details below to add a new product to your catalog.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onAddSubmit)} className="space-y-4">
                    <ProductFormFields control={form.control} />
                    <DialogFooter>
                        <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit">Add Product</Button>
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
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>NPR {product.price.toFixed(2)}</TableCell>
                    <TableCell>{product.isStockManaged ? product.stockQty : 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={product.available ? 'default' : 'destructive'} className={product.available ? 'bg-green-500' : ''}>
                        {product.available ? 'Available' : 'Unavailable'}
                      </Badge>
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
                          <DropdownMenuItem onClick={() => handleEditClick(product)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                           <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the product.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteProduct(product.id)}>
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
                  <TableCell colSpan={6} className="text-center">
                    No products found.
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
                totalItems={filteredProducts.length}
                itemsPerPage={ITEMS_PER_PAGE}
                itemName="products"
            />
        </CardFooter>
      </Card>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update the product details below.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <ProductFormFields control={editForm.control} />
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
