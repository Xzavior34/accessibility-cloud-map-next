"use client";

import { MapPin, ParkingCircle } from 'lucide-react';
import type { Category, WheelchairFilterPreset } from '../types/accessibilityCloud';

interface QuickFiltersProps {
  categories: Category[];
  onApply: (categoryId: string | undefined, filter: WheelchairFilterPreset) => void;
  activeCategoryId: string | undefined;
}

interface QuickFilterDef {
  label: string;
  icon: React.ReactNode;
  keyword: string;
}

const QUICK_FILTERS: QuickFilterDef[] = [
  { label: 'Accessible toilets', icon: <span aria-hidden>🚻</span>, keyword: 'toilet' },
  { label: 'Accessible parking', icon: <ParkingCircle className="w-4 h-4" />, keyword: 'parking' },
  { label: 'Pharmacies', icon: <span aria-hidden>💊</span>, keyword: 'pharmac' },
  { label: 'Restaurants', icon: <span aria-hidden>🍽</span>, keyword: 'restaurant' },
];

/**
 * One-tap shortcuts for the accessible amenities people most urgently need
 * when out and about — rather than making them dig through a general
 * category list every time. Each shortcut applies a category + the
 * "at least partially accessible" wheelchair filter together.
 */
export function QuickFilters({ categories, onApply, activeCategoryId }: QuickFiltersProps) {
  if (categories.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mb-1" role="group" aria-label="Quick filters">
      {QUICK_FILTERS.map((qf) => {
        const category = categories.find((c) =>
          c.translations?._id?.en?.toLowerCase().includes(qf.keyword),
        );
        if (!category) return null;
        const active = activeCategoryId === category._id;
        return (
          <button
            key={qf.label}
            onClick={() =>
              onApply(
                active ? undefined : category._id,
                'at-least-partially-accessible-by-wheelchair',
              )
            }
            aria-pressed={active}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium shadow-lg border transition-colors whitespace-nowrap ${
              active
                ? 'bg-accent text-white border-accent'
                : 'bg-white text-gray-700 border-gray-100 hover:bg-gray-50'
            }`}
          >
            {qf.icon}
            {qf.label}
          </button>
        );
      })}
      <button
        onClick={() => onApply(undefined, 'at-least-partially-accessible-by-wheelchair')}
        className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium shadow-lg border border-gray-100 bg-white text-gray-700 hover:bg-gray-50 whitespace-nowrap"
      >
        <MapPin className="w-4 h-4" />
        All accessible places
      </button>
    </div>
  );
}
