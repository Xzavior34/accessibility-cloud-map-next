"use client";

import { useCallback, useEffect, useState } from 'react';

export type TextSize = 'normal' | 'large' | 'x-large';

export interface A11ySettings {
  textSize: TextSize;
  highContrast: boolean;
  reduceMotion: boolean;
}

const STORAGE_KEY = 'a11y-map-settings';
const DEFAULTS: A11ySettings = { textSize: 'normal', highContrast: false, reduceMotion: false };

function readSettings(): A11ySettings {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

/**
 * Manages the app's own accessibility settings — since this is a product
 * for accessibility, the app itself should be genuinely usable: adjustable
 * text size and a high-contrast mode, applied via data attributes on <html>
 * so CSS can respond to them globally.
 */
export function useA11ySettings() {
  const [settings, setSettings] = useState<A11ySettings>(() => readSettings());

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-text-size', settings.textSize);
    root.setAttribute('data-high-contrast', String(settings.highContrast));
    root.setAttribute('data-reduce-motion', String(settings.reduceMotion));
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('[useA11ySettings] Failed to save', e);
    }
  }, [settings]);

  const setTextSize = useCallback((textSize: TextSize) => {
    setSettings((prev) => ({ ...prev, textSize }));
  }, []);

  const toggleHighContrast = useCallback(() => {
    setSettings((prev) => ({ ...prev, highContrast: !prev.highContrast }));
  }, []);

  const toggleReduceMotion = useCallback(() => {
    setSettings((prev) => ({ ...prev, reduceMotion: !prev.reduceMotion }));
  }, []);

  return { settings, setTextSize, toggleHighContrast, toggleReduceMotion };
}
