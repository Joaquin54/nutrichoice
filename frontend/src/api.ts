// src/api.ts
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export type FoodEntry = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  created_at?: string;
};

export async function ping(): Promise<{ status: string }> {
  const r = await fetch(`${API_BASE}/api/health/`);
  return r.json();
}

export async function getFoods(): Promise<FoodEntry[]> {
  const r = await fetch(`${API_BASE}/api/foods/`);
  return r.json();
}

