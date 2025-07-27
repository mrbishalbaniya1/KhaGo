
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminPage() {
  const { user, userRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (userRole && userRole !== 'superadmin') {
      router.push('/dashboard');
    }
  }, [userRole, router]);

  if (userRole !== 'superadmin') {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <p>You do not have permission to view this page.</p>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Panel</CardTitle>
          <CardDescription>
            Super administrative tools and settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Welcome, Super Admin! This is where you can manage critical aspects of the application.</p>
        </CardContent>
      </Card>
    </div>
  );
}
