'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchHotspots } from '@/services/hotspots';
import { fetchNGOs } from '@/services/ngos';
import { fetchAssignments } from '@/services/assignments';
import { fetchDetections } from '@/services/detection';
import { sidebarMenuGroups } from '@/constants/navigation';
import { Search, X, FileText, MapPin, Flame, Building2, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface SearchResult {
  id: string;
  label: string;
  category: 'report' | 'location' | 'hotspot' | 'ngo' | 'assignment';
  href: string;
  subtitle?: string;
}

const CATEGORY_CONFIG = {
  report: { icon: FileText, label: 'Report', color: 'text-blue-500' },
  location: { icon: MapPin, label: 'Page', color: 'text-emerald-500' },
  hotspot: { icon: Flame, label: 'Hotspot', color: 'text-orange-500' },
  ngo: { icon: Building2, label: 'NGO', color: 'text-violet-500' },
  assignment: { icon: ClipboardList, label: 'Assignment', color: 'text-cyan-500' },
};

const PAGES: SearchResult[] = sidebarMenuGroups.flatMap((g) =>
  g.items.map((item) => ({ id: `page-${item.id}`, label: item.label, category: 'location' as const, href: item.href, subtitle: 'Page' })),
);

/** Search index built from live API data; fetched only once the search is opened. */
function useSearchIndex(enabled: boolean): SearchResult[] {
  const opts = { enabled, staleTime: 60_000 };
  const hotspots = useQuery({ queryKey: ['hotspots'], queryFn: fetchHotspots, ...opts });
  const ngos = useQuery({ queryKey: ['ngos'], queryFn: fetchNGOs, ...opts });
  const assignments = useQuery({ queryKey: ['assignments'], queryFn: () => fetchAssignments(), ...opts });
  const reports = useQuery({ queryKey: ['detections', 'search'], queryFn: () => fetchDetections(1, 100), ...opts });

  return useMemo(() => [
    ...PAGES,
    ...(hotspots.data?.hotspots ?? []).map((h) => ({
      id: h.id, label: h.name, category: 'hotspot' as const, href: `/hotspots/${encodeURIComponent(h.id)}`,
      subtitle: `${h.report_count} reports · ${h.severity === 'unknown' ? 'not assessed' : `${h.severity} risk`}`,
    })),
    ...(ngos.data ?? []).map((n) => ({
      id: n.id, label: n.name, category: 'ngo' as const, href: '/ngo-teams', subtitle: `${n.city}${n.is_sample ? ' · sample' : ''}`,
    })),
    ...(assignments.data ?? []).map((a) => ({
      id: a.id, label: a.title, category: 'assignment' as const, href: `/assignments/${a.id}`, subtitle: `${a.id} · ${a.status.replace('_', ' ')}`,
    })),
    ...(reports.data?.data ?? []).map((d) => ({
      id: d.id, label: `Report ${d.id.slice(0, 8)}`, category: 'report' as const, href: `/history/${d.id}`,
      subtitle: `${new Date(d.created_at).toLocaleDateString()} · ${d.items.length} objects · ${d.items.map((i) => i.class_name).slice(0, 3).join(', ')}`,
    })),
  ], [hotspots.data, ngos.data, assignments.data, reports.data]);
}

interface SearchBoxProps {
  placeholder?: string;
}

export function SearchBox({ placeholder = 'Search reports, hotspots, NGOs...' }: SearchBoxProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const index = useSearchIndex(isOpen || query.length > 0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return index
      .filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.subtitle?.toLowerCase().includes(q) ||
          item.category.includes(q),
      )
      .slice(0, 8);
  }, [query, index]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, []);

  const groupedResults = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {});

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          className="w-[280px] rounded-xl border border-border/60 bg-muted/40 pl-9 pr-12 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
          aria-label="Global search"
        />
        {query ? (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="size-3.5" />
          </button>
        ) : (
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/60 bg-muted/60 border border-border/50 rounded px-1.5 py-0.5 font-mono">
            ⌘K
          </kbd>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-[360px] right-0 glass rounded-xl border border-border/50 shadow-xl z-50 max-h-[400px] overflow-y-auto custom-scrollbar">
          {Object.entries(groupedResults).map(([category, items]) => {
            const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
            return (
              <div key={category}>
                <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 bg-muted/20">
                  {config.label}
                </div>
                {items.map((item) => {
                  const Icon = config.icon;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => { setIsOpen(false); setQuery(''); }}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40 transition-colors"
                    >
                      <Icon className={cn('size-4 shrink-0', config.color)} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
                        {item.subtitle && (
                          <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {isOpen && query.trim() && results.length === 0 && (
        <div className="absolute top-full mt-2 w-[360px] right-0 glass rounded-xl border border-border/50 shadow-xl z-50 p-8 text-center">
          <p className="text-sm text-muted-foreground">No results found for &ldquo;{query}&rdquo;</p>
        </div>
      )}
    </div>
  );
}
