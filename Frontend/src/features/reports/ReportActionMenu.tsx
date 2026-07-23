'use client';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye, Pencil, Copy, Trash2, Download, Share2 } from 'lucide-react';
import Link from 'next/link';

interface ReportActionMenuProps {
  reportId: string;
}

export function ReportActionMenu({ reportId }: ReportActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center justify-center size-7 rounded-md hover:bg-muted/60 transition-colors cursor-pointer outline-none"
        aria-label="Report actions"
      >
        <MoreHorizontal className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={4} className="w-44">
        <DropdownMenuItem render={<Link href={`/reports/${reportId}`} />}>
          <Eye className="size-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href={`/reports/${reportId}/edit`} />}>
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Copy className="size-4" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Download className="size-4" />
          Download
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Share2 className="size-4" />
          Share
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
