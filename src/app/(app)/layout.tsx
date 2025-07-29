
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { UserNav } from '@/components/user-nav';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  ClipboardList,
  Warehouse,
  Banknote,
  Users,
  AreaChart,
  Package,
  Settings,
  Shield,
  PlusCircle,
  BarChart2,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileNav } from '@/components/mobile-nav';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/orders', label: 'Orders', icon: ClipboardList },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/inventory', label: 'Inventory', icon: Warehouse },
  { href: '/expenses', label: 'Expenses', icon: Banknote },
  { href: '/reports', label: 'Reports', icon: AreaChart },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/users', label: 'Team', icon: Users },
];

const adminNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin', label: 'Approvals', icon: Shield },
    { href: '/users', label: 'Managers', icon: Users },
]

const mobileNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/orders', label: 'Orders', icon: ClipboardList },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/inventory', label: 'Inventory', icon: Warehouse },
  { href: '/expenses', label: 'Expenses', icon: Banknote },
];

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { user, loading, userRole } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const handleOnline = () => {
      toast({
        title: 'Back Online',
        description: 'Your internet connection has been restored.',
      });
    };

    const handleOffline = () => {
      toast({
        title: 'You are offline',
        description: 'Please check your internet connection. Some features may not be available.',
        variant: 'destructive',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);


  if (loading || !user) {
      return (
        <div className="flex h-screen w-full items-center justify-center">
            <Icons.logo className="h-12 w-12 animate-pulse text-primary" />
        </div>
      )
  }

  const addActionLinks: { [key:string]: string} = {
      '/orders': '/orders?create=true',
      '/products': '/products?create=true',
      '/inventory': '/inventory?create=true',
      '/expenses': '/expenses?create=true',
  }

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
           <Link href="/dashboard" className="flex items-center gap-2">
             <Icons.logo className="h-8 w-8 text-primary" />
             <span className="font-headline text-xl font-bold tracking-tight">KhaGo</span>
           </Link>
           <div className="flex items-center gap-2">
             {Object.keys(addActionLinks).map(path => 
                pathname.startsWith(path) && (
                    <Button key={path} size="icon" variant="ghost" asChild>
                        <Link href={addActionLinks[path]}>
                            <PlusCircle className="text-primary" />
                            <span className="sr-only">Add</span>
                        </Link>
                    </Button>
                )
             )}
            <UserNav />
           </div>
        </header>
        <main className="flex-1 overflow-auto p-4 pb-24">{children}</main>
        <MobileNav navItems={mobileNavItems} />
      </div>
    );
  }

  const currentNavItems = userRole === 'superadmin' ? adminNavItems : navItems;


  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2">
             <Link href="/dashboard" className="flex items-center gap-2.5">
                <Button variant="ghost" size="icon" className="h-11 w-11 text-primary">
                <Icons.logo className="h-8 w-8" />
                </Button>
            </Link>
            <div className="flex flex-col group-[[data-collapsible=icon]]:hidden">
                <h2 className="font-headline text-2xl font-bold tracking-tight">
                    KhaGo
                </h2>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu className="flex-1">
            {currentNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href)}
                  tooltip={item.label}
                  size="lg"
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
         <SidebarFooter>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarTrigger />
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-end gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
          <UserNav />
        </header>
        <main className="flex-1 overflow-auto p-4">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </AuthProvider>
  );
}

