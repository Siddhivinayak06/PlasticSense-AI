'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { AnimatedThemeToggler } from '@/registry/magicui/animated-theme-toggler';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = (resolvedTheme || theme || 'dark') as 'light' | 'dark';

  if (!mounted) {
    return (
      <div
        className="size-9 rounded-xl border border-transparent flex items-center justify-center text-muted-foreground opacity-50 cursor-default"
        aria-hidden="true"
      >
        <span className="size-4" />
      </div>
    );
  }

  return (
    <AnimatedThemeToggler
      theme={currentTheme === 'dark' ? 'dark' : 'light'}
      onThemeChange={(newTheme) => setTheme(newTheme)}
      duration={450}
      variant="circle"
      className={
        className ??
        'size-9 rounded-xl border border-transparent hover:border-border/60 hover:bg-muted/60 flex items-center justify-center text-foreground transition-colors cursor-pointer [&_svg]:size-4'
      }
    />
  );
}

export { AnimatedThemeTogglerDemo } from '@/registry/magicui/animated-theme-toggler';
