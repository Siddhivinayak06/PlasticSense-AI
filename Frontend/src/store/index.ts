import { create } from 'zustand';

interface AppState {
  // Sidebar
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Mobile menu
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;

  // Notifications
  isNotificationOpen: boolean;
  toggleNotification: () => void;
  closeNotification: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Sidebar
  isSidebarOpen: true,
  isSidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

  // Mobile menu
  isMobileMenuOpen: false,
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),

  // Notifications
  isNotificationOpen: false,
  toggleNotification: () => set((state) => ({ isNotificationOpen: !state.isNotificationOpen })),
  closeNotification: () => set({ isNotificationOpen: false }),
}));
