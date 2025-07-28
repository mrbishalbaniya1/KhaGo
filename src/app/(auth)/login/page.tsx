
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
  User as FirebaseAuthUser,
} from 'firebase/auth';
import { auth, googleProvider, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from "firebase/firestore";

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

const signupSchema = z.object({
  name: z.string().min(2, { message: 'Name is required.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

const businessInfoSchema = z.object({
  businessName: z.string().min(2, { message: 'Business name is required.' }),
  mobileNumber: z.string().min(1, 'Mobile number is required.'),
  address: z.string().min(1, 'Address is required.'),
});

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [showApprovalMessage, setShowApprovalMessage] = useState(false);
  const [signupStep, setSignupStep] = useState(1);
  const [createdUser, setCreatedUser] = useState<FirebaseAuthUser | null>(null);

  useEffect(() => {
    if (searchParams.get('approval') === 'pending') {
      setShowApprovalMessage(true);
    }
  }, [searchParams]);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '' },
  });
  
  const businessInfoForm = useForm<z.infer<typeof businessInfoSchema>>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: { businessName: '', mobileNumber: '', address: '' },
  });

  const handleUserInDb = async (user: FirebaseAuthUser, additionalData: Record<string, any> = {}) => {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const dbUser = userDoc.data();
        if (dbUser.status === 'pending') {
            router.push('/login?approval=pending');
        } else {
            router.push('/dashboard');
        }
      } else {
        const userData = {
            name: user.displayName,
            email: user.email,
            role: 'customer',
            status: 'approved',
            avatar: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
            uid: user.uid,
            ...additionalData,
        };
        await setDoc(userDocRef, userData);
        if (userData.status === 'pending') {
            router.push('/login?approval=pending');
        } else {
            router.push('/dashboard');
        }
      }
  };


  const onLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    setShowApprovalMessage(false);
    try {
        await signInWithEmailAndPassword(auth, values.email, values.password);
        toast({ title: 'Login Successful', description: 'Welcome back!' });
        router.push('/dashboard');
    } catch (error: any) {
       if (error.code === 'auth/user-disabled') {
            setShowApprovalMessage(true);
        } else if (error.code === 'auth/invalid-credential') {
            const userDocRef = doc(db, 'users_by_email', values.email);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              const { uid } = userDoc.data();
              const mainUserDoc = await getDoc(doc(db, 'users', uid));
              if (mainUserDoc.exists() && mainUserDoc.data().status === 'pending') {
                 setShowApprovalMessage(true);
                 return;
              }
            }
            toast({
                title: 'Authentication Failed',
                description: 'Invalid email or password.',
                variant: 'destructive',
            });
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

  const onSignupSubmit = async (values: z.infer<typeof signupSchema>) => {
    setIsLoading(true);
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        await updateProfile(userCredential.user, { displayName: values.name });
        setCreatedUser(userCredential.user);
        setSignupStep(2);
    } catch (error: any) {
        toast({
            title: 'Sign Up Failed',
            description: error.message || 'An unexpected error occurred.',
            variant: 'destructive',
        });
    } finally {
        setIsLoading(false);
    }
  };

  const onBusinessInfoSubmit = async (values: z.infer<typeof businessInfoSchema>) => {
    if (!createdUser) return;
    setIsLoading(true);
    try {
        const userData = {
            name: createdUser.displayName,
            email: createdUser.email,
            role: 'manager',
            status: 'pending',
            avatar: createdUser.photoURL || `https://i.pravatar.cc/150?u=${createdUser.uid}`,
            uid: createdUser.uid,
            ...values,
        };
        await setDoc(doc(db, "users", createdUser.uid), userData);
        await setDoc(doc(db, "users_by_email", userData.email!), { uid: createdUser.uid });

        toast({
          title: 'Account Created',
          description: "You've successfully signed up! Your account is pending approval.",
        });
        await auth.signOut();
        setSignupStep(1);
        setCreatedUser(null);
        setActiveTab('login');
        router.push('/login?approval=pending');

    } catch (error: any) {
         toast({
            title: 'Sign Up Failed',
            description: error.message || 'An unexpected error occurred.',
            variant: 'destructive',
        });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setShowApprovalMessage(false);
    try {
        const result = await signInWithPopup(auth, googleProvider);
        await handleUserInDb(result.user);
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
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute top-8 left-8 flex items-center gap-2">
        <Icons.logo className="h-8 w-8 text-primary" />
        <span className="font-headline text-2xl font-bold tracking-tight">KhaGo</span>
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
            <TabsTrigger value="login" disabled={signupStep === 2}>Login</TabsTrigger>
            <TabsTrigger value="signup" disabled={signupStep === 2}>Sign Up</TabsTrigger>
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
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="sita.sharma@khago.np"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
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
                  <p>For demo, use `sita.sharma@khago.np` and password `password`</p>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="signup">
             <Card>
                {signupStep === 1 && (
                  <>
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Create an Account (Step 1/2)</CardTitle>
                        <CardDescription>
                        Sign up as a manager. Your account will require admin approval.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...signupForm}>
                        <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
                            <FormField
                            control={signupForm.control}
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
                            control={signupForm.control}
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
                            control={signupForm.control}
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
                            {isLoading ? 'Creating Account...' : 'Continue'}
                            </Button>
                        </form>
                        </Form>
                        <Separator className="my-6" />
                        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                        <Icons.logo className="mr-2 h-4 w-4" />
                        Sign up with Google
                        </Button>
                    </CardContent>
                  </>
                )}
                {signupStep === 2 && (
                    <>
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Business Information (Step 2/2)</CardTitle>
                        <CardDescription>
                            Please provide some details about your business.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...businessInfoForm}>
                        <form onSubmit={businessInfoForm.handleSubmit(onBusinessInfoSubmit)} className="space-y-4">
                            <FormField
                                control={businessInfoForm.control}
                                name="businessName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Business Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. My Awesome Restaurant" {...field} disabled={isLoading} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={businessInfoForm.control}
                                name="mobileNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mobile Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+977-98xxxxxxxx" {...field} disabled={isLoading} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={businessInfoForm.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Address</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. 123 Main St, Kathmandu" {...field} disabled={isLoading} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Submitting...' : 'Submit for Approval'}
                            </Button>
                        </form>
                        </Form>
                    </CardContent>
                    </>
                )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
