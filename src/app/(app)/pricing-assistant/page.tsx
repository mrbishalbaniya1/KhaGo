
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PricingAssistantForm } from '@/components/pricing-assistant-form';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function PricingAssistantFormSkeleton() {
    return (
        <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-6">
                <Skeleton className="h-10 w-full" />
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
        </div>
    )
}

export default function PricingAssistantPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const productId = searchParams?.productId as string | undefined;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">AI Pricing Assistant</CardTitle>
        <CardDescription>
          Get AI-powered suggestions for optimal product pricing based on stock,
          popularity, and spoilage risk.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<PricingAssistantFormSkeleton />}>
          <PricingAssistantForm productId={productId} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
