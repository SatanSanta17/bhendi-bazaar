// hooks/forms/useFormPersist.ts

import { useEffect, useRef } from "react";
import { UseFormReturn } from "react-hook-form";

export function useFormPersist<T extends Record<string, any>>(
  key: string,
  form: UseFormReturn<T>,
  options: {
    enabled?: boolean;
    excludeFields?: (keyof T)[];
    debounceMs?: number;
  } = {}
) {
  const { enabled = true, excludeFields = [], debounceMs = 1000 } = options;

  const hasLoadRef = useRef(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (!enabled || hasLoadRef.current) return;

    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Only set fields that aren't excluded
        Object.keys(parsed).forEach((field) => {
          if (!excludeFields.includes(field as keyof T)) {
            form.setValue(field as any, parsed[field]);
          }
        });
        hasLoadRef.current = true;
      } catch (err) {
        console.error("Failed to parse saved form data:", err);
        localStorage.removeItem(key);
      }
    } else {
      hasLoadRef.current = true;
    }
  }, [key, enabled]);

  // Save to localStorage on change (debounced)
  useEffect(() => {
    if (!enabled) return;

    const subscription = form.watch((data) => {
      const timeoutId = setTimeout(() => {
        // Remove excluded fields
        const dataToSave = { ...data };
        excludeFields.forEach((field) => {
          delete (dataToSave as any)[field];
        });
        localStorage.setItem(key, JSON.stringify(dataToSave));
      }, debounceMs);

      return () => clearTimeout(timeoutId);
    });

    return () => subscription.unsubscribe();
  }, [key, enabled, form, excludeFields, debounceMs]);

  const clearSaved = () => {
    localStorage.removeItem(key);
    hasLoadRef.current = false;
  };

  return { clearSaved };
}