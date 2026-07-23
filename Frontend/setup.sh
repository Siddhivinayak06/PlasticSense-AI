#!/bin/bash

# Ensure directories exist
mkdir -p src/app/{dashboard,reports,map,analytics,hotspots,assignments,users,settings}
mkdir -p src/components/{ui,layout,shared}
mkdir -p src/features
mkdir -p src/hooks
mkdir -p src/services
mkdir -p src/lib
mkdir -p src/providers
mkdir -p src/store
mkdir -p src/types
mkdir -p src/utils
mkdir -p src/constants
mkdir -p src/assets
mkdir -p src/styles
mkdir -p src/mock

# Create Mock Data files
cat << 'EOF' > src/mock/index.ts
export const mockReports = [
  { id: 1, title: 'Plastic Waste at Beach', status: 'Pending', date: '2026-07-14' },
  { id: 2, title: 'Ocean Cleanup Status', status: 'In Progress', date: '2026-07-13' }
];

export const mockUsers = [
  { id: 1, name: 'Admin User', role: 'admin' },
  { id: 2, name: 'Field Worker', role: 'worker' }
];

export const mockAnalytics = {
  totalCollected: '500kg',
  activeHotspots: 12
};
EOF

# Create Zustand Store
cat << 'EOF' > src/store/index.ts
import { create } from 'zustand';

interface AppState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
EOF

# Create Query Provider
cat << 'EOF' > src/providers/QueryProvider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
EOF

# Create Axios Instance
cat << 'EOF' > src/lib/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});
EOF

# Create Layout Components
cat << 'EOF' > src/components/layout/Sidebar.tsx
import Link from 'next/link';

export function Sidebar() {
  return (
    <aside className="w-64 h-full bg-white/60 backdrop-blur-md border-r p-4 hidden md:block">
      <nav className="space-y-2">
        <Link href="/dashboard" className="block p-2 rounded-lg hover:bg-primary/10">Dashboard</Link>
        <Link href="/reports" className="block p-2 rounded-lg hover:bg-primary/10">Reports</Link>
        <Link href="/map" className="block p-2 rounded-lg hover:bg-primary/10">Map</Link>
        <Link href="/analytics" className="block p-2 rounded-lg hover:bg-primary/10">Analytics</Link>
      </nav>
    </aside>
  );
}
EOF

cat << 'EOF' > src/components/layout/Navbar.tsx
export function Navbar() {
  return (
    <header className="h-16 bg-white/60 backdrop-blur-md border-b flex items-center px-6 justify-between">
      <h1 className="text-xl font-bold text-primary">PlasticSense AI</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm">User Profile</span>
      </div>
    </header>
  );
}
EOF

cat << 'EOF' > src/components/layout/MainLayout.tsx
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
EOF

# Create basic page routing structure
for route in dashboard reports map analytics hotspots assignments users settings; do
  cat << EOF > src/app/$route/page.tsx
export default function ${route^}Page() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">${route^}</h1>
      <p>This is the ${route} page.</p>
    </div>
  );
}
EOF
done

# Create API layer example
cat << 'EOF' > src/services/reports.ts
import { mockReports } from '@/mock';

export const getReports = async () => {
  // Simulate API call
  return new Promise((resolve) => setTimeout(() => resolve(mockReports), 500));
};
EOF

# Create simple hooks example
cat << 'EOF' > src/hooks/useReports.ts
import { useQuery } from '@tanstack/react-query';
import { getReports } from '@/services/reports';

export function useReports() {
  return useQuery({
    queryKey: ['reports'],
    queryFn: getReports,
  });
}
EOF

# Create theme provider
cat << 'EOF' > src/providers/ThemeProvider.tsx
'use client';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <NextThemesProvider attribute="class" defaultTheme="light">{children}</NextThemesProvider>;
}
EOF

# Create Error Component
cat << 'EOF' > src/components/shared/ErrorBoundary.tsx
'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return <h1>Sorry.. there was an error</h1>;
    }

    return this.props.children;
  }
}
EOF

# Replace App Layout
cat << 'EOF' > src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { MainLayout } from "@/components/layout/MainLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PlasticSense AI",
  description: "Intelligent Plastic Pollution Monitoring & Cleanup Decision Support System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased bg-[#F8FAFC]`}>
        <ErrorBoundary>
          <ThemeProvider>
            <QueryProvider>
              <MainLayout>
                {children}
              </MainLayout>
            </QueryProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
EOF

# Install next-themes
npm install next-themes

chmod +x setup.sh
