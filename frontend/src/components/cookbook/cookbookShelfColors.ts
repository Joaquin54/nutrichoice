import type { Cookbook } from '../../types/recipe';

/** Deterministic palette so each cookbook keeps a stable “binding” color. No yellow / orange / brown. */
const SPINE_PALETTE: { bg: string; fg: string; coverFrom: string; coverTo: string }[] = [
  { bg: '#047857', fg: '#ecfdf5', coverFrom: '#a7f3d0', coverTo: '#10b981' },
  { bg: '#1d4ed8', fg: '#eff6ff', coverFrom: '#bfdbfe', coverTo: '#3b82f6' },
  { bg: '#14532d', fg: '#f0fdf4', coverFrom: '#bbf7d0', coverTo: '#22c55e' },
  { bg: '#0f766e', fg: '#f0fdfa', coverFrom: '#99f6e4', coverTo: '#14b8a6' },
  { bg: '#164e63', fg: '#ecfeff', coverFrom: '#a5f3fc', coverTo: '#06b6d4' },
  { bg: '#5b21b6', fg: '#faf5ff', coverFrom: '#ddd6fe', coverTo: '#8b5cf6' },
  { bg: '#9d174d', fg: '#fdf2f8', coverFrom: '#fbcfe8', coverTo: '#ec4899' },
  { bg: '#3730a3', fg: '#eef2ff', coverFrom: '#c7d2fe', coverTo: '#6366f1' },
];

function hashId(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getCookbookShelfTheme(cb: Cookbook) {
  return SPINE_PALETTE[hashId(cb.id) % SPINE_PALETTE.length];
}
