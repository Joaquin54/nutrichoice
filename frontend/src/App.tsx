import { useEffect, useState } from "react";
import { ping, getFoods, type FoodEntry } from "./api";

export default function App() {
    const [health, setHealth] = useState<string>("loading...");
    const [foods, setFoods] = useState<FoodEntry[]>([]);

    useEffect(() => {
        ping().then(d => setHealth(d.status)).catch(() => setHealth("error"));
        getFoods().then(setFoods).catch(() => setFoods([]));
    }, []);

    return (
        <div style={{ padding: 24 }}>
            <h1>Nutrition App (TS)</h1>
            <p>Backend health: {health}</p>
            <ul>
                {foods.map(f => (
                    <li key={f.id}>
                        {f.name} — {f.calories} kcal (P{f.protein}/C{f.carbs}/F{f.fat})
                    </li>
                ))}
            </ul>
        </div>
    );
}
