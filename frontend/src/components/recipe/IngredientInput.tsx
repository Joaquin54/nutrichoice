// components/recipe/IngredientInput.tsx
// Searchable ingredient row — debounced search, dropdown select, quantity + unit.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Trash2, ChevronDown } from 'lucide-react';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';
import { searchIngredients, type IngredientSearchResult } from '../../api';

export type IngredientUnit =
  | 'grams' | 'cups' | 'tablespoons' | 'tsp' | 'pinch' | 'count' | 'whole' | 'each';

export const UNIT_OPTIONS: IngredientUnit[] = [
  'grams', 'cups', 'tablespoons', 'tsp', 'pinch', 'count', 'whole', 'each',
];

export interface IngredientRow {
  ingredientId: number | null;
  ingredientName: string;
  quantity: string;
  unit: IngredientUnit;
}

interface IngredientInputProps {
  row: IngredientRow;
  index: number;
  canRemove: boolean;
  onChange: (index: number, row: IngredientRow) => void;
  onRemove: (index: number) => void;
}

export const IngredientInput = React.memo(function IngredientInput({ row, index, canRemove, onChange, onRemove }: IngredientInputProps) {
  const [query, setQuery] = useState(row.ingredientName);
  const [results, setResults] = useState<IngredientSearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const runSearch = useCallback((term: string) => {
    if (term.trim().length < 2) { setResults([]); return; }
    searchIngredients(term)
      .then((res) => { setResults(res.slice(0, 8)); setShowDropdown(res.length > 0); })
      .catch(() => setResults([]));
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, runSearch]);

  // Close dropdown on outside click.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectIngredient = (item: IngredientSearchResult) => {
    setQuery(item.name);
    setShowDropdown(false);
    onChange(index, { ...row, ingredientId: item.id, ingredientName: item.name, unit: (item.default_unit as IngredientUnit) ?? row.unit });
  };

  return (
    <div className="flex gap-2 items-start pb-3" ref={containerRef}>
      {/* Ingredient search */}
      <div className="relative flex-1 min-w-0">
        <Input
          placeholder="Search ingredient…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(index, { ...row, ingredientId: null, ingredientName: e.target.value });
          }}
          className="text-sm"
          autoComplete="off"
        />
        {showDropdown && results.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-40 overflow-y-auto">
            {results.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onMouseDown={() => selectIngredient(item)}
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-accent"
                >
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Quantity */}
      <Input
        type="number"
        min="0"
        step="any"
        placeholder="Qty"
        value={row.quantity}
        onChange={(e) => onChange(index, { ...row, quantity: e.target.value })}
        className="w-16 text-sm shrink-0"
      />

      {/* Unit select */}
      <div className="relative shrink-0">
        <select
          value={row.unit}
          onChange={(e) => onChange(index, { ...row, unit: e.target.value as IngredientUnit })}
          className={cn(
            'h-9 appearance-none rounded-md border border-input bg-background pl-2 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-[#6ec257]/50'
          )}
        >
          {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={() => onRemove(index)}
        disabled={!canRemove}
        className="mt-0.5 shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-500 disabled:pointer-events-none disabled:opacity-30 dark:hover:bg-red-950/20"
        aria-label="Remove ingredient"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
});
