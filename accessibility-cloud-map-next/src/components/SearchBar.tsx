"use client";

import { useEffect, useRef, useState } from 'react';
import { Search, MapPin, SlidersHorizontal } from 'lucide-react';
import { geocodeSearch, type GeocodeResult } from '../lib/geocoding';

interface SearchBarProps {
  onSelectLocation: (result: GeocodeResult) => void;
  onToggleFilters: () => void;
  filtersActive: boolean;
}

export function SearchBar({ onSelectLocation, onToggleFilters, filtersActive }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) return;
    debounceRef.current = setTimeout(async () => {
      const r = await geocodeSearch(query);
      setResults(r);
      setOpen(true);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Derived at render time rather than cleared via a separate setState in
  // an effect — once the query is emptied there's nothing to show.
  const displayedResults = query.trim() ? results : [];

  return (
    <div className="w-full max-w-md relative">
      <div className="flex items-center gap-2 bg-white rounded-xl shadow-lg border border-gray-100 px-3 py-2.5">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => displayedResults.length > 0 && setOpen(true)}
          placeholder="Search a place or address…"
          className="flex-1 outline-none text-sm text-gray-800 placeholder:text-gray-400 min-w-0"
        />
        <button
          onClick={onToggleFilters}
          className={`p-1.5 rounded-lg shrink-0 transition-colors ${
            filtersActive ? 'bg-accent text-white' : 'hover:bg-gray-100 text-gray-500'
          }`}
          aria-label="Toggle filters"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {open && displayedResults.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
          {displayedResults.map((r, i) => (
            <button
              key={i}
              onClick={() => {
                onSelectLocation(r);
                setQuery(r.name);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 hover:bg-gray-50 flex items-start gap-2 border-b border-gray-50 last:border-0"
            >
              <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{r.name}</p>
                {r.subtitle && <p className="text-xs text-gray-500 truncate">{r.subtitle}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}