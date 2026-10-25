import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { MainLayout } from "@/components/layout/MainLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WasteSense AI",
  description: "Intelligent Plastic Pollution Monitoring & Cleanup Decision Support System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ErrorBoundary>
          <ThemeProvider>
            <QueryProvider>
              <AuthProvider>
                <MainLayout>
                  {children}
                </MainLayout>
                <Toaster richColors closeButton position="bottom-right" />
              </AuthProvider>
            </QueryProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

