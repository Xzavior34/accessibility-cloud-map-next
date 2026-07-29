"use client";

import { Type, Contrast, X } from 'lucide-react';
import type { A11ySettings, TextSize } from '../hooks/useA11ySettings';

interface AccessibilityToolbarProps {
  settings: A11ySettings;
  onTextSizeChange: (size: TextSize) => void;
  onToggleHighContrast: () => void;
  onClose: () => void;
}

const TEXT_SIZES: { value: TextSize; label: string }[] = [
  { value: 'normal', label: 'A' },
  { value: 'large', label: 'A' },
  { value: 'x-large', label: 'A' },
];

export function AccessibilityToolbar({
  settings,
  onTextSizeChange,
  onToggleHighContrast,
  onClose,
}: AccessibilityToolbarProps) {
  return (
    <div
      className="w-72 max-w-[90vw] bg-white rounded-2xl shadow-xl border border-gray-100 p-4"
      role="dialog"
      aria-label="Display settings"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-900">Display settings</h2>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100" aria-label="Close display settings">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2 flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5" /> Text size
        </p>
        <div className="flex gap-1.5" role="radiogroup" aria-label="Text size">
          {TEXT_SIZES.map((size, i) => (
            <button
              key={size.value}
              role="radio"
              aria-checked={settings.textSize === size.value}
              onClick={() => onTextSizeChange(size.value)}
              className={`flex-1 py-2 rounded-lg border font-semibold transition-colors ${
                settings.textSize === size.value
                  ? 'bg-accent text-white border-accent'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
              style={{ fontSize: `${1 + i * 0.25}rem` }}
            >
              {size.label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center justify-between cursor-pointer py-1">
        <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
          <Contrast className="w-4 h-4" /> High contrast mode
        </span>
        <input
          type="checkbox"
          checked={settings.highContrast}
          onChange={onToggleHighContrast}
          className="w-4 h-4 accent-accent"
        />
      </label>
    </div>
  );
}
