
'use client';

import { use, useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams } from 'next/navigation';

import { suggestProductPricing, type SuggestProductPricingOutput } from '@/ai/flows/suggest-product-pricing';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles, Lightbulb, AlertCircle } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { mockProducts } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  productName: z.string().min(2, { message: 'Product name is required.' }),
  currentStockQty: z.coerce.number().int().positive({ message: 'Stock quantity must be a positive number.' }),
  popularityScore: z.coerce.number().min(1).max(10, { message: 'Popularity must be between 1 and 10.' }),
  spoilageRisk: z.enum(['low', 'medium', 'high'], { required_error: 'Spoilage risk is required.' }),
  currentPrice: z.coerce.number().positive({ message: 'Current price must be a positive number.' }),
});

type PricingFormValues = z.infer<typeof formSchema>;

export function PricingAssistantForm() {
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');
  const { toast } = useToast();
  
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<SuggestProductPricingOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<PricingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: '',
      currentStockQty: 10,
      popularityScore: 5,
      spoilageRisk: 'medium',
      currentPrice: 10.0,
    },
  });

  useEffect(() => {
    if (productId) {
      const product = mockProducts.find((p) => p.id === productId);
      if (product) {
        form.reset({
          productName: product.name,
          currentStockQty: product.stockQty,
          popularityScore: product.popularityScore,
          spoilageRisk: product.spoilageRisk,
          currentPrice: product.price,
        });
      }
    }
  }, [productId, form]);

  const onSubmit = (values: PricingFormValues) => {
    startTransition(async () => {
      setError(null);
      setResult(null);
      try {
        const output = await suggestProductPricing(values);
        setResult(output);
      } catch (e: any) {
        console.error(e);
        setError('An unexpected error occurred. Please try again.');
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to get pricing suggestion.",
        });
      }
    });
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="productName"
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
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="currentStockQty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Stock</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currentPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Price (NPR)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
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
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? 'Analyzing...' : 'Get Suggestion'}
            <Sparkles className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </Form>

      <div className="flex items-center justify-center">
        {isPending && (
            <Card className="w-full animate-pulse">
                <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-16 w-1/2 mx-auto" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </CardContent>
            </Card>
        )}
        {error && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        {result && (
          <Card className="w-full shadow-lg border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline">
                <Sparkles className="text-accent" />
                Pricing Suggestion
              </CardTitle>
              <CardDescription>
                AI-powered recommendation for {form.getValues('productName')}.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">Suggested Price</p>
                <p className="text-5xl font-bold text-primary flex items-center justify-center">
                  <span className="text-3xl mr-1">NPR</span>
                  {result.suggestedPrice.toFixed(2)}
                </p>
              </div>
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>Reasoning</AlertTitle>
                <AlertDescription>{result.reasoning}</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
        {!isPending && !result && !error && (
            <div className="text-center text-muted-foreground">
                <Lightbulb className="mx-auto h-12 w-12" />
                <p className="mt-4">Fill out the form to get your pricing suggestion.</p>
            </div>
        )}
      </div>
    </div>
  );
}
