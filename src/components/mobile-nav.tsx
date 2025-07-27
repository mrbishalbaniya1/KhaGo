
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface MobileNavProps {
  navItems: NavItem[];
}

export function MobileNav({ navItems }: MobileNavProps) {
  const pathname = usePathname();

  // Note: The number of columns is hardcoded to 5.
  // If you change the number of items in `mobileNavItems` in the layout,
  // you must update the `grid-cols-*` class here as well.
  const gridColsClass = `grid-cols-${navItems.length}`;

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <div className={cn(
        "grid items-stretch text-center bg-background/80 backdrop-blur-sm shadow-lg rounded-2xl border overflow-hidden",
        "grid-cols-5" // Use a static class for Tailwind to correctly apply the grid layout.
        )}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={cn(
              'flex flex-col items-center justify-center gap-1 p-2 text-muted-foreground transition-colors hover:bg-accent/50 hover:text-accent-foreground h-16',
              isActive && 'text-primary bg-primary/10'
            )}>
                <Icon className="h-6 w-6" />
                <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
