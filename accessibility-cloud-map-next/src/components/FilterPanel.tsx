"use client";

import { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import type { Category, WheelchairFilterPreset } from '../types/accessibilityCloud';

interface FilterPanelProps {
  filter: WheelchairFilterPreset | undefined;
  onFilterChange: (filter: WheelchairFilterPreset | undefined) => void;
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  showDisruptions: boolean;
  onShowDisruptionsChange: (show: boolean) => void;
  showEquipment: boolean;
  onShowEquipmentChange: (show: boolean) => void;
  categories: Category[];
  categoriesLoaded: boolean;
  onClose?: () => void;
}

const FILTER_PRESETS: { value: WheelchairFilterPreset | undefined; label: string }[] = [
  { value: undefined, label: 'All places' },
  { value: 'at-least-partially-accessible-by-wheelchair', label: 'Wheelchair accessible (any)' },
  { value: 'fully-accessible-by-wheelchair', label: 'Fully accessible only' },
  { value: 'not-accessible-by-wheelchair', label: 'Not accessible' },
  { value: 'unknown-wheelchair-accessibility', label: 'Unknown accessibility' },
];

export function FilterPanel({
  filter,
  onFilterChange,
  selectedCategories,
  onCategoriesChange,
  showDisruptions,
  onShowDisruptionsChange,
  showEquipment,
  onShowEquipmentChange,
  categories,
  categoriesLoaded,
  onClose,
}: FilterPanelProps) {
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const toggleCategory = (id: string) => {
    if (selectedCategories.includes(id)) {
      onCategoriesChange(selectedCategories.filter((c) => c !== id));
    } else {
      onCategoriesChange([...selectedCategories, id]);
    }
  };

  return (
    <div className="w-80 max-w-[90vw] bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col max-h-[calc(100dvh-2rem)]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Filters &amp; layers</h2>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 md:hidden" aria-label="Close filters">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="overflow-y-auto px-4 py-3 flex flex-col gap-4">
        {/* Wheelchair accessibility filter */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            Wheelchair accessibility
          </h3>
          <div className="flex flex-col gap-1">
            {FILTER_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => onFilterChange(preset.value)}
                className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === preset.value
                    ? 'bg-accent text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Layer toggles */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            Live data layers
          </h3>
          <label className="flex items-center gap-2 px-1 py-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showDisruptions}
              onChange={(e) => onShowDisruptionsChange(e.target.checked)}
              className="w-4 h-4 accent-accent"
            />
            <span className="text-sm text-gray-700">⚠ Elevator/escalator disruptions</span>
          </label>
          <label className="flex items-center gap-2 px-1 py-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showEquipment}
              onChange={(e) => onShowEquipmentChange(e.target.checked)}
              className="w-4 h-4 accent-accent"
            />
            <span className="text-sm text-gray-700">🛗 Elevators &amp; escalators</span>
          </label>
        </div>

        {/* Category filter */}
        <div>
          <button
            onClick={() => setCategoriesOpen((o) => !o)}
            className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2"
          >
            <span>
              Categories{selectedCategories.length > 0 ? ` (${selectedCategories.length})` : ''}
            </span>
            {categoriesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {categoriesOpen && (
            <div className="flex flex-col gap-0.5 max-h-64 overflow-y-auto border border-gray-100 rounded-lg p-2">
              {!categoriesLoaded && <p className="text-sm text-gray-400 px-1 py-2">Loading categories…</p>}
              {categoriesLoaded && categories.length === 0 && (
                <p className="text-sm text-gray-400 px-1 py-2">Couldn&apos;t load categories.</p>
              )}
              {categories.map((cat) => (
                <label key={cat._id} className="flex items-center gap-2 px-1 py-1 rounded hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat._id)}
                    onChange={() => toggleCategory(cat._id)}
                    className="w-3.5 h-3.5 accent-accent"
                  />
                  <span className="text-sm text-gray-700">
                    {cat.translations?._id?.en || cat._id}
                  </span>
                </label>
              ))}
            </div>
          )}
          {selectedCategories.length > 0 && (
            <button
              onClick={() => onCategoriesChange([])}
              className="text-xs text-accent hover:underline mt-1"
            >
              Clear category filter
            </button>
          )}
        </div>
      </div>
    </div>
  );
}