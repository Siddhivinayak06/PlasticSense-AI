'use client';

import Link from 'next/link';
import { Settings, Info } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

/**
 * The application has no user accounts: it is a single-operator local deployment.
 * This menu says so instead of showing an invented identity and a log-out button
 * that would do nothing.
 */
export function ProfileMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-muted/60 transition-colors cursor-pointer"
        aria-label="Operator menu"
      >
        <Avatar className="size-8">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">OP</AvatarFallback>
        </Avatar>
        <div className="hidden lg:flex flex-col items-start">
          <span className="text-xs font-semibold text-foreground">Local operator</span>
          <span className="text-[10px] text-muted-foreground">WasteSense AI</span>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64" sideOffset={8}>
        <div className="flex gap-2 px-2 pt-1.5 pb-2 text-xs text-muted-foreground">
          <Info className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>No sign-in: this local deployment has a single operator and no user accounts.</span>
        </div>
        <DropdownMenuSeparator />
        <Link href="/settings">
          <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
            <Settings className="size-4" aria-hidden="true" />
            <span>System status</span>
          </DropdownMenuItem>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
