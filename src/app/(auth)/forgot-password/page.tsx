
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { useState } from 'react';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = (values: z.infer<typeof forgotPasswordSchema>) => {
    // In a real application, you would handle the password reset logic here,
    // e.g., by calling a Firebase function.
    console.log('Password reset requested for:', values.email);
    toast({
      title: 'Password Reset Requested',
      description: `If an account exists for ${values.email}, a password reset link has been sent.`,
    });
    setIsSubmitted(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="absolute top-8 left-8 flex items-center gap-2">
            <Icons.logo className="h-8 w-8 text-primary" />
            <span className="font-headline text-2xl font-bold tracking-tight">KhaGo</span>
        </div>
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
            <CardTitle className="text-2xl">Forgot Your Password?</CardTitle>
            <CardDescription>
                No problem. Enter your email below and we'll send you a link to reset it.
            </CardDescription>
            </CardHeader>
            <CardContent>
            {isSubmitted ? (
                <div className="text-center text-sm text-muted-foreground">
                    <p>
                        Please check your inbox for the password reset link. If you don't see it, check your spam folder.
                    </p>
                    <Button variant="link" asChild className="mt-4">
                        <Link href="/login">Return to Login</Link>
                    </Button>
                </div>
            ) : (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                            <Input
                                type="email"
                                placeholder="user@example.com"
                                {...field}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full">
                        Send Reset Link
                    </Button>
                    </form>
                </Form>
            )}
            </CardContent>
        </Card>
    </div>
  );
}
