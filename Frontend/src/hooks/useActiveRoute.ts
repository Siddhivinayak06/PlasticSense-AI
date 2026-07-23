'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { sidebarMenuGroups } from '@/constants/navigation';

export function useActiveRoute() {
  const pathname = usePathname();

  const activeItem = useMemo(() => {
    for (const group of sidebarMenuGroups) {
      for (const item of group.items) {
        if (pathname === item.href || pathname.startsWith(item.href + '/')) {
          return item;
        }
      }
    }
    return null;
  }, [pathname]);

  const breadcrumbs = useMemo(() => {
    const crumbs: { label: string; href: string }[] = [
      { label: 'Home', href: '/dashboard' },
    ];
    if (activeItem && activeItem.href !== '/dashboard') {
      crumbs.push({ label: activeItem.label, href: activeItem.href });
    }
    return crumbs;
  }, [activeItem]);

  return {
    pathname,
    activeItem,
    breadcrumbs,
    isActive: (href: string) => pathname === href || pathname.startsWith(href + '/'),
  };
}
