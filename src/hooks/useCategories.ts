"use client";

import { useEffect, useState } from 'react';
import { fetchCategories } from '../lib/accessibilityCloud';
import type { Category } from '../types/accessibilityCloud';

export function useCategories(locale = 'en') {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchCategories(locale)
      .then((res) => setCategories(res.results))
      .catch((e) => console.warn('[fetchCategories]', e))
      .finally(() => setLoaded(true));
  }, [locale]);

  /** Finds a category whose English name matches a keyword (case-insensitive substring match). */
  const findByKeyword = (keyword: string): Category | undefined =>
    categories.find((c) => c.translations?._id?.en?.toLowerCase().includes(keyword.toLowerCase()));

  return { categories, loaded, findByKeyword };
}
