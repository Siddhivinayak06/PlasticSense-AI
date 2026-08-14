'use client';

import { useState, useRef, useEffect } from 'react';
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
  location: { icon: MapPin, label: 'Location', color: 'text-emerald-500' },
  hotspot: { icon: Flame, label: 'Hotspot', color: 'text-orange-500' },
  ngo: { icon: Building2, label: 'NGO', color: 'text-violet-500' },
  assignment: { icon: ClipboardList, label: 'Assignment', color: 'text-cyan-500' },
};

// Mock search index for demo
const SEARCH_INDEX: SearchResult[] = [
  { id: '1', label: 'RPT-2026-001', category: 'report', href: '/history', subtitle: 'Juhu Beach, Mumbai' },
  { id: '2', label: 'RPT-2026-002', category: 'report', href: '/history', subtitle: 'Marina Beach, Chennai' },
  { id: '3', label: 'RPT-2026-003', category: 'report', href: '/history', subtitle: 'Baga Beach, Goa' },
  { id: '4', label: 'Mumbai Coastal Area', category: 'hotspot', href: '/hotspots', subtitle: 'Critical · 94/100' },
  { id: '5', label: 'Chennai Coast', category: 'hotspot', href: '/hotspots', subtitle: 'High · 78/100' },
  { id: '6', label: 'Goa Beach Zone', category: 'hotspot', href: '/hotspots', subtitle: 'Medium · 52/100' },
  { id: '7', label: 'Green Earth Foundation', category: 'ngo', href: '/ngo-teams', subtitle: 'Mumbai · 4 active' },
  { id: '8', label: 'Ocean Crusaders', category: 'ngo', href: '/ngo-teams', subtitle: 'Chennai · 2 active' },
  { id: '9', label: 'Eco Warriors India', category: 'ngo', href: '/ngo-teams', subtitle: 'Goa · 3 active' },
  { id: '10', label: 'CLN-2026-0001', category: 'assignment', href: '/assignments', subtitle: 'Juhu Beach Cleanup' },
  { id: '11', label: 'CLN-2026-0042', category: 'assignment', href: '/assignments', subtitle: 'Marina Beach Cleanup' },
  { id: '12', label: 'Juhu Beach', category: 'location', href: '/map', subtitle: 'Mumbai, Maharashtra' },
  { id: '13', label: 'Marina Beach', category: 'location', href: '/map', subtitle: 'Chennai, Tamil Nadu' },
  { id: '14', label: 'Plastic Bottles', category: 'report', href: '/analytics', subtitle: 'Waste Category' },
  { id: '15', label: 'Plastic Bags', category: 'report', href: '/analytics', subtitle: 'Waste Category' },
];

interface SearchBoxProps {
  placeholder?: string;
}

export function SearchBox({ placeholder = 'Search reports, hotspots, NGOs...' }: SearchBoxProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase();
    const filtered = SEARCH_INDEX.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.subtitle?.toLowerCase().includes(q) ||
        item.category.includes(q),
    ).slice(0, 8);
    setResults(filtered);
  }, [query]);

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
            onClick={() => { setQuery(''); setResults([]); }}
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
