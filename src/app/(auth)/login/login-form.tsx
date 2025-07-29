
'use client';

import { useState, useEffect, Suspense } from 'react';
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
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

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
import { AlertTriangle, CheckCircle, ShieldCheck } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const signupSchema = z.object({
  name: z.string().min(2, { message: 'Name is required.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

const businessInfoSchema = z.object({
  businessName: z.string().min(2, { message: 'Business name must be at least 2 characters.' }),
  mobileNumber: z.string().regex(/^\d{10}$/, { message: 'Please enter a valid 10-digit mobile number.' }),
  address: z.string().min(5, { message: 'Address must be at least 5 characters.' }),
});

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
  rememberMe: z.boolean().default(false),
});

async function generateUniqueUsername(businessName: string): Promise<string> {
    const baseUsername = businessName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
    let username = baseUsername;
    let counter = 1;
    while (true) {
        const q = query(collection(db, 'users'), where('username', '==', username));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return username;
        }
        username = `${baseUsername}${counter}`;
        counter++;
    }
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [showApprovalMessage, setShowApprovalMessage] = useState(false);
  const [signupStep, setSignupStep] = useState(1);
  const [createdUser, setCreatedUser] = useState<FirebaseAuthUser | null>(null);

  useEffect(() => {
    const approvalParam = searchParams.get('approval');
    if (approvalParam === 'pending') {
      setShowApprovalMessage(true);
      // To prevent the message from showing again on refresh,
      // we can remove the query param from the URL.
      window.history.replaceState(null, '', '/login');
    }
  }, [searchParams]);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: true },
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
            setShowApprovalMessage(true);
            auth.signOut();
        } else {
            router.push('/dashboard');
        }
      } else {
        const userData = {
            name: user.displayName,
            email: user.email,
            role: 'manager',
            status: 'pending',
            avatar: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
            uid: user.uid,
            ...additionalData,
        };
        await setDoc(userDocRef, userData);
        if (userData.status === 'pending') {
            setShowApprovalMessage(true);
            auth.signOut();
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
        } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
            toast({
                title: 'Authentication Failed',
                description: 'Invalid email or password. Please check your credentials and try again.',
                variant: 'destructive',
            });
        } else {
             toast({
                title: 'Authentication Failed',
                description: 'An unexpected error occurred. Please try again later.',
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
        let description = 'An unexpected error occurred during sign-up. Please try again later.';
        if (error.code === 'auth/email-already-in-use') {
            description = 'This email address is already in use. Please use a different email or log in.';
        } else if (error.code === 'auth/weak-password') {
            description = 'The password is too weak. Please choose a stronger password.';
        }
        toast({
            title: 'Sign Up Failed',
            description,
            variant: 'destructive',
        });
    } finally {
        setIsLoading(false);
    }
  };

  const onBusinessInfoSubmit = async (values: z.infer<typeof businessInfoSchema>) => {
    if (!createdUser || !createdUser.email) return;
    setIsLoading(true);
    try {
        const username = await generateUniqueUsername(values.businessName);
        const userData = {
            name: createdUser.displayName,
            email: createdUser.email,
            role: 'manager',
            status: 'pending',
            avatar: createdUser.photoURL || `https://i.pravatar.cc/150?u=${createdUser.uid}`,
            uid: createdUser.uid,
            username,
            ...values,
        };
        await setDoc(doc(db, "users", createdUser.uid), userData);
        if (createdUser.email) {
            await setDoc(doc(db, "users_by_email", createdUser.email), { uid: createdUser.uid });
        }

        await auth.signOut();
        setCreatedUser(null);
        signupForm.reset();
        businessInfoForm.reset();
        setSignupStep(3);

    } catch (error: any) {
         toast({
            title: 'Sign Up Failed',
            description: 'An unexpected error occurred while saving business information.',
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
        const { user } = result;
        
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const dbUser = userDoc.data();
            if (dbUser.status === 'pending') {
                setShowApprovalMessage(true);
                await auth.signOut();
            } else {
                 toast({ title: 'Login Successful', description: 'Welcome back!' });
                 router.push('/dashboard');
            }
        } else {
            await auth.signOut();
            toast({
                title: 'Login Failed',
                description: "Your account was not found. Please sign up first.",
                variant: 'destructive',
            });
        }
    } catch (error: any) {
        toast({
            title: 'Google Sign-In Failed',
            description: 'Could not sign in with Google. Please try again.',
            variant: 'destructive',
        });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleReturnToLogin = () => {
    setSignupStep(1);
    setActiveTab('login');
    setShowApprovalMessage(false);
  };

  const CaptchaPlaceholder = () => (
    <div className="flex items-center justify-center p-4 my-4 bg-muted/50 border-dashed border-2 border-muted rounded-lg">
        <div className="text-center text-muted-foreground">
            <ShieldCheck className="mx-auto h-8 w-8 mb-2" />
            <p className="text-sm font-medium">CAPTCHA Placeholder</p>
            <p className="text-xs">This would be a real CAPTCHA in production.</p>
        </div>
    </div>
  );

  return (
       <div className="w-full max-w-md space-y-4">
        {showApprovalMessage && (
          <Alert variant="default" className="bg-amber-100 border-amber-300 text-amber-800">
            <AlertTriangle className="h-4 w-4 !text-amber-800" />
            <AlertTitle>Account Pending Approval</AlertTitle>
            <AlertDescription>
              Your account is awaiting approval from a superadmin. You will be able to log in once your account is approved.
            </AlertDescription>
          </Alert>
        )}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login" disabled={signupStep !== 1}>Login</TabsTrigger>
            <TabsTrigger value="signup" disabled={signupStep !== 1}>Sign Up</TabsTrigger>
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
                    <FormField
                      control={loginForm.control}
                      name="rememberMe"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                           <FormControl>
                            <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={isLoading}
                                />
                           </FormControl>
                           <div className="space-y-1 leading-none">
                             <Label
                                htmlFor="rememberMe"
                                className="font-normal"
                             >
                               Remember me
                             </Label>
                           </div>
                        </FormItem>
                      )}
                    />
                    <CaptchaPlaceholder />
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
                            <CaptchaPlaceholder />
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
                                            <Input placeholder="e.g. 9812345678" {...field} disabled={isLoading} />
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
                {signupStep === 3 && (
                    <>
                      <CardHeader className="text-center">
                          <CardTitle className="text-2xl">Submission Complete</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                           <Alert variant="default" className="bg-green-100 border-green-300 text-green-800">
                                <CheckCircle className="h-4 w-4 !text-green-800" />
                                <AlertTitle>Account Pending Approval</AlertTitle>
                                <AlertDescription>
                                Your account has been created and is awaiting approval from a superadmin. You will be able to log in once your account is approved.
                                </AlertDescription>
                            </Alert>
                            <Button className="w-full" onClick={handleReturnToLogin}>Return to Login</Button>
                      </CardContent>
                    </>
                )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}
