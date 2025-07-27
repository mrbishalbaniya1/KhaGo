
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useEffect } from 'react';

const businessInfoSchema = z.object({
  businessName: z.string().min(1, 'Restaurant name is required.'),
  address: z.string().min(1, 'Address is required.'),
  mobileNumber: z.string().min(1, 'Contact number is required.'),
});

export default function SettingsPage() {
  const { userData, user, userRole } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof businessInfoSchema>>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: {
      businessName: '',
      address: '',
      mobileNumber: '',
    },
  });

  useEffect(() => {
    if (userData) {
      form.reset({
        businessName: userData.businessName || '',
        address: userData.address || '',
        mobileNumber: userData.mobileNumber || '',
      });
    }
  }, [userData, form]);

  const onSubmit = async (values: z.infer<typeof businessInfoSchema>) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, values);
      toast({
        title: 'Success',
        description: 'Your business information has been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update business information.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Manage your application and account settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* General Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Appearance</h3>
            <Separator />
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="theme" className="text-base font-semibold">Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Select the application's color scheme.
                </p>
              </div>
              <ThemeSwitcher />
            </div>
          </div>

          {/* Notification Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Notifications</h3>
            <Separator />
            <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="email-notifications" className="text-base font-semibold">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                            Receive email updates for important events.
                        </p>
                    </div>
                    <Switch id="email-notifications" defaultChecked />
                </div>
                 <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="push-notifications" className="text-base font-semibold">Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                           Get real-time alerts on your devices.
                        </p>
                    </div>
                    <Switch id="push-notifications" />
                </div>
            </div>
          </div>
          
           {/* Business Information */}
          {userRole === 'manager' && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <h3 className="text-lg font-medium">Business Information</h3>
                <Separator />
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Restaurant Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mobileNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
              </form>
            </Form>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
