'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store';

export function useSidebar() {
  const {
    isSidebarCollapsed,
    setSidebarCollapsed,
    isMobileMenuOpen,
    toggleMobileMenu,
    closeMobileMenu,
  } = useAppStore();

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)');
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) {
        closeMobileMenu();
      }
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [closeMobileMenu]);

  return {
    isCollapsed: isSidebarCollapsed,
    toggleCollapse: () => setSidebarCollapsed(!isSidebarCollapsed),
    isMobileOpen: isMobileMenuOpen,
    toggleMobile: toggleMobileMenu,
    closeMobile: closeMobileMenu,
  };
}
