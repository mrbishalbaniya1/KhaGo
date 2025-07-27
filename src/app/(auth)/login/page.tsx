
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider, db } from '@/lib/firebase';
import { doc, setDoc } from "firebase/firestore";

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Icons } from '@/components/icons';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const formSchema = z.object({
  name: z.string().optional(),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [showApprovalMessage, setShowApprovalMessage] = useState(false);

  useEffect(() => {
    if (searchParams.get('approval') === 'pending') {
      setShowApprovalMessage(true);
    }
  }, [searchParams]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });
  
  const handleUserCreation = async (user: any, name?: string, provider: 'google' | 'email' = 'email') => {
    const userData = {
        name: name || user.displayName,
        email: user.email,
        role: provider === 'google' ? 'customer' : 'manager',
        status: provider === 'google' ? 'approved' : 'pending',
        avatar: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
        uid: user.uid,
    };
    await setDoc(doc(db, "users", user.uid), userData);
    
    if (userData.status === 'pending') {
        router.push('/login?approval=pending');
    } else {
        router.push('/dashboard');
    }
  }


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setShowApprovalMessage(false);
    try {
      if (activeTab === 'signup') {
        if (!values.name) {
             toast({
                title: 'Name is required',
                description: 'Please enter your name to sign up.',
                variant: 'destructive',
             });
             setIsLoading(false);
             return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        await updateProfile(userCredential.user, { displayName: values.name });
        await handleUserCreation(userCredential.user, values.name);
        
        toast({
          title: 'Account Created',
          description: "You've successfully signed up! Your account is pending approval.",
        });

      } else {
        await signInWithEmailAndPassword(auth, values.email, values.password);
        toast({
          title: 'Login Successful',
          description: 'Welcome back!',
        });
        router.push('/dashboard');
      }
    } catch (error: any) {
       if (error.code === 'auth/user-disabled') {
            setShowApprovalMessage(true);
        } else {
             toast({
                title: 'Authentication Failed',
                description: error.message || 'An unexpected error occurred.',
                variant: 'destructive',
            });
        }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setShowApprovalMessage(false);
    try {
        const result = await signInWithPopup(auth, googleProvider);
        await handleUserCreation(result.user, result.user.displayName || undefined, 'google');
        toast({
            title: 'Login Successful',
            description: 'Welcome!',
        });
    } catch (error: any) {
        toast({
            title: 'Google Sign-In Failed',
            description: error.message || 'Could not sign in with Google. Please try again.',
            variant: 'destructive',
        });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute top-8 left-8 flex items-center gap-2">
        <Icons.logo className="h-8 w-8 text-primary" />
        <span className="font-headline text-2xl font-bold tracking-tight">CulinaryFlow</span>
      </div>
       <div className="w-full max-w-md space-y-4">
        {showApprovalMessage && (
          <Alert variant="default" className="bg-amber-100 border-amber-300 text-amber-800">
            <AlertTriangle className="h-4 w-4 !text-amber-800" />
            <AlertTitle>Account Pending Approval</AlertTitle>
            <AlertDescription>
              Your account has been created and is awaiting approval from a superadmin. You will be able to log in once your account is approved.
            </AlertDescription>
          </Alert>
        )}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Welcome Back</CardTitle>
                <CardDescription>
                  Enter your credentials to access your account.
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                              placeholder="sita.sharma@culinaryflow.np"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="********"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Signing In...' : 'Sign In'}
                    </Button>
                  </form>
                </Form>
                <Separator className="my-6" />
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                   <Icons.logo className="mr-2 h-4 w-4" />
                  Sign in with Google
                </Button>
              </CardContent>
              <CardFooter className="flex justify-center text-sm">
                  <p>For demo, use `sita.sharma@culinaryflow.np` and password `password`</p>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="signup">
             <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Create an Account</CardTitle>
                <CardDescription>
                  Sign up as a manager. Your account will require admin approval.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                     <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. John Doe"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="********"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Creating Account...' : 'Sign Up'}
                    </Button>
                  </form>
                </Form>
                 <Separator className="my-6" />
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                   <Icons.logo className="mr-2 h-4 w-4" />
                  Sign up with Google
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
