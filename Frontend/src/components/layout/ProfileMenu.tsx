'use client';

import { User, Building2, Bell, Settings, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';

export function ProfileMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-muted/60 transition-colors cursor-pointer"
        aria-label="User menu"
      >
        <Avatar className="size-8">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            AD
          </AvatarFallback>
        </Avatar>
        <div className="hidden lg:flex flex-col items-start">
          <span className="text-xs font-semibold text-foreground">Admin User</span>
          <span className="text-[10px] text-muted-foreground">PlasticSense AI</span>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
        <DropdownMenuLabel className="flex flex-col gap-1 pb-2">
          <span className="text-sm font-semibold">Admin User</span>
          <span className="text-xs text-muted-foreground font-normal">admin@plasticsense.ai</span>
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full w-fit mt-0.5">
            Administrator
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <Link href="/settings">
          <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
            <User className="size-4" />
            <span>Profile</span>
          </DropdownMenuItem>
        </Link>

        <Link href="/settings">
          <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
            <Building2 className="size-4" />
            <span>Organization</span>
          </DropdownMenuItem>
        </Link>

        <Link href="/settings">
          <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
            <Bell className="size-4" />
            <span>Notifications</span>
          </DropdownMenuItem>
        </Link>

        <Link href="/settings">
          <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
            <Settings className="size-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </Link>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer">
          <LogOut className="size-4 mr-2" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
