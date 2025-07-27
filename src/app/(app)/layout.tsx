
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
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileNav } from '@/components/mobile-nav';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/contexts/auth-context';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/orders', label: 'Orders', icon: ClipboardList },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/inventory', label: 'Inventory', icon: Warehouse },
  { href: '/expenses', label: 'Expenses', icon: Banknote },
  { href: '/reports', label: 'Reports', icon: AreaChart },
  { href: '/users', label: 'Users', icon: Users },
];

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
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);


  if (loading || !user) {
      return (
        <div className="flex h-screen w-full items-center justify-center">
            <Icons.logo className="h-12 w-12 animate-pulse text-primary" />
        </div>
      )
  }

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
           <Link href="/dashboard" className="flex items-center gap-2">
             <Icons.logo className="h-8 w-8 text-primary" />
             <span className="font-headline text-xl font-bold tracking-tight">CulinaryFlow</span>
           </Link>
          <UserNav />
        </header>
        <main className="flex-1 overflow-auto p-4 pb-24">{children}</main>
        <MobileNav navItems={mobileNavItems} />
      </div>
    );
  }

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
                    CulinaryFlow
                </h2>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu className="flex-1">
            {navItems.map((item) => (
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
