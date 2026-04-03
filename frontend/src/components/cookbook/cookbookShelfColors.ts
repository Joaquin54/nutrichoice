import type { Cookbook } from '../../types/recipe';

/** Deterministic palette so each cookbook keeps a stable “binding” color. */
const SPINE_PALETTE: { bg: string; fg: string; coverFrom: string; coverTo: string }[] = [
  { bg: '#9a3412', fg: '#fafaf9', coverFrom: '#fef3c7', coverTo: '#fcd34d' },
  { bg: '#1e40af', fg: '#f8fafc', coverFrom: '#dbeafe', coverTo: '#93c5fd' },
  { bg: '#3f6212', fg: '#f7fee7', coverFrom: '#ecfccb', coverTo: '#a3e635' },
  { bg: '#713f12', fg: '#fffbeb', coverFrom: '#fde68a', coverTo: '#d97706' },
  { bg: '#134e4a', fg: '#f0fdfa', coverFrom: '#ccfbf1', coverTo: '#5eead4' },
  { bg: '#4c1d95', fg: '#faf5ff', coverFrom: '#ede9fe', coverTo: '#a78bfa' },
  { bg: '#831843', fg: '#fdf2f8', coverFrom: '#fce7f3', coverTo: '#f472b6' },
  { bg: '#0c4a6e', fg: '#f0f9ff', coverFrom: '#e0f2fe', coverTo: '#38bdf8' },
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
