'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Car,
  MessageSquare,
  Stethoscope,
  MapPin,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { Separator } from '@/components/ui/separator';

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'My Garage',
    href: '/dashboard/garage',
    icon: Car,
  },
  {
    title: 'AI Chat',
    href: '/dashboard/chat',
    icon: MessageSquare,
  },
  {
    title: 'Diagnostics',
    href: '/dashboard/diagnostics',
    icon: Stethoscope,
  },
  {
    title: 'Find Shops',
    href: '/dashboard/shops',
    icon: MapPin,
  },
];

const bottomNavItems = [
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const {
    sidebarCollapsed,
    toggleSidebarCollapse,
    mobileMenuOpen,
    setMobileMenuOpen,
  } = useUIStore();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const NavLink = ({
    item,
  }: {
    item: { title: string; href: string; icon: React.ComponentType<{ className?: string }> };
  }) => {
    const Icon = item.icon;
    const active = isActive(item.href);

    return (
      <Link
        href={item.href}
        onClick={() => setMobileMenuOpen(false)}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent',
          active
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:text-foreground',
          sidebarCollapsed && 'justify-center px-2'
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!sidebarCollapsed && <span>{item.title}</span>}
      </Link>
    );
  };

  const sidebarContent = (
    <>
      <div className="flex h-14 items-center border-b px-4">
        {!sidebarCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <Car className="h-6 w-6 text-primary" />
            <span>MyAutoWhiz</span>
          </Link>
        )}
        {sidebarCollapsed && (
          <Car className="mx-auto h-6 w-6 text-primary" />
        )}
      </div>

      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-2">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>
      </div>

      <div className="border-t py-4">
        <nav className="grid gap-1 px-2">
          {bottomNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* Subscription status */}
        {!sidebarCollapsed && user?.subscriptionTier && (
          <div className="mx-2 mt-4 rounded-lg border bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground">Current Plan</p>
            <p className="text-sm font-semibold capitalize">
              {user.subscriptionTier.toLowerCase()}
            </p>
            {user.subscriptionTier === 'FREE' && (
              <Link
                href="/dashboard/subscription"
                className="mt-2 block text-xs text-primary hover:underline"
              >
                Upgrade to Pro
              </Link>
            )}
          </div>
        )}

        {/* Collapse button (desktop only) */}
        <div className="hidden px-2 pt-4 md:block">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={toggleSidebarCollapse}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Collapse
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden border-r bg-background md:flex md:flex-col',
          sidebarCollapsed ? 'md:w-16' : 'md:w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-background transition-transform duration-300 ease-in-out md:hidden',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2"
          onClick={() => setMobileMenuOpen(false)}
        >
          <X className="h-5 w-5" />
        </Button>
        {sidebarContent}
      </aside>
    </>
  );
}
