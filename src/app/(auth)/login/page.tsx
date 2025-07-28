
import { Suspense } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import LoginForm from './login-form';
import { Icons } from '@/components/icons';

// This is the new page component. It's a Server Component.
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
       <div className="absolute top-8 left-8 flex items-center gap-2">
        <Icons.logo className="h-8 w-8 text-primary" />
        <span className="font-headline text-2xl font-bold tracking-tight">KhaGo</span>
      </div>
      {/* The component that uses searchParams is wrapped in Suspense. */}
      <Suspense fallback={<LoginSkeleton />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

// A skeleton loader to show while the client component is loading.
function LoginSkeleton() {
  return (
    <div className="w-full max-w-md space-y-4">
      <Card>
        <CardHeader>
           <Skeleton className="h-4 w-1/2 mx-auto" />
           <Skeleton className="h-3 w-3/4 mx-auto" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
           <Skeleton className="h-4 w-full" />
           <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
