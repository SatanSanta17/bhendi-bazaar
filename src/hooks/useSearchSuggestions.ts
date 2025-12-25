// src/hooks/useSearchSuggestions.ts
import { useState, useEffect } from "react";
import type { Product } from "@/domain/product";
import type { Category } from "@/domain/category";
import { useDebounce } from "./core/useDebounce";

export function useSearchSuggestions(query: string, debounceMs = 300) {
  const debouncedQuery = useDebounce(query, debounceMs);

  const [suggestions, setSuggestions] = useState<{
    products: Product[];
    categories: Category[];
  }>({ products: [], categories: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setSuggestions({ products: [], categories: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(debouncedQuery)}`
        );
        const data = await response.json();
        setSuggestions(data);
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [debouncedQuery, debounceMs]);

  return { suggestions, loading };
}