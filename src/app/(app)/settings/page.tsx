
'use client';

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

export default function SettingsPage() {
  // In a real app, you'd use a theme provider context like next-themes
  // and state management for settings. For this mock, we'll just have the UI.

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
              <Select defaultValue="system">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
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
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Business Information</h3>
            <Separator />
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="restaurant-name">Restaurant Name</Label>
                    <Input id="restaurant-name" defaultValue="CulinaryFlow" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="restaurant-address">Address</Label>
                    <Textarea id="restaurant-address" defaultValue="123 Main Street, Kathmandu, Nepal" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="restaurant-contact">Contact Number</Label>
                    <Input id="restaurant-contact" defaultValue="+977-9800000000" />
                </div>
            </div>
             <div className="flex justify-end pt-4">
                <Button>Save Changes</Button>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
