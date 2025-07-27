
'use client';

import Link from 'next/link';
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
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { mockProducts as initialProducts } from '@/lib/mock-data';
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

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  category: z.string().min(1, 'Category is required'),
  price: z.coerce.number().positive('Price must be a positive number'),
  stockQty: z.coerce.number().int().nonnegative('Stock must be a non-negative number'),
  available: z.boolean().default(true),
  popularityScore: z.coerce.number().min(1).max(10),
  spoilageRisk: z.enum(['low', 'medium', 'high']),
});

const ITEMS_PER_PAGE = 10;

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      category: '',
      price: 0,
      stockQty: 0,
      available: true,
      popularityScore: 5,
      spoilageRisk: 'medium',
    },
  });

  const editForm = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
  });

  const onAddSubmit = (values: z.infer<typeof productSchema>) => {
    const newProduct: Product = {
      id: `p${products.length + 1}`,
      ...values,
    };
    setProducts([newProduct, ...products]);
    toast({
      title: 'Product Added',
      description: `${values.name} has been added to the catalog.`,
    });
    form.reset();
    setIsAddDialogOpen(false);
  };

  const onEditSubmit = (values: z.infer<typeof productSchema>) => {
    if (!selectedProduct) return;
    setProducts(
      products.map((p) =>
        p.id === selectedProduct.id ? { ...p, ...values } : p
      )
    );
    toast({
      title: 'Product Updated',
      description: `${values.name}'s information has been updated.`,
    });
    setIsEditDialogOpen(false);
    setSelectedProduct(null);
  };

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    editForm.reset(product);
    setIsEditDialogOpen(true);
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter((product) => product.id !== id));
    toast({
      title: 'Product Deleted',
      description: 'The product has been removed from the catalog.',
      variant: 'destructive',
    });
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
          />
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
                    <TableCell>{product.stockQty}</TableCell>
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

      {/* Add Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
           <Button
            size="icon"
            className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-lg"
          >
            <PlusCircle className="h-8 w-8" />
            <span className="sr-only">Add Product</span>
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
              <div className="grid grid-cols-2 gap-4">
                  <FormField
                  control={form.control}
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
                  control={form.control}
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
              <div className="grid grid-cols-2 gap-4">
                  <FormField
                  control={form.control}
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
                  control={form.control}
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
                      control={form.control}
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
                  control={form.control}
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
                control={form.control}
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
              <div className="grid grid-cols-2 gap-4">
                  <FormField
                  control={editForm.control}
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
                  control={editForm.control}
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
              <div className="grid grid-cols-2 gap-4">
                  <FormField
                  control={editForm.control}
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
                  control={editForm.control}
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
                      control={editForm.control}
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
                  control={editForm.control}
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
                control={editForm.control}
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
