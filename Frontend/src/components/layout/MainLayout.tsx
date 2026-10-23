'use client';

import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { MobileDrawer } from './MobileDrawer';
import { fadeIn } from '@/lib/motion';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Landing page gets NO layout chrome
  if (pathname === '/') {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      <MobileDrawer />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar />
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={pathname}
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="w-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
