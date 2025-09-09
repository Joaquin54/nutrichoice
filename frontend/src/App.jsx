import { useEffect, useState } from "react";
import { ping, getTasks, createTask } from "./api";

export default function App() {
    const [health, setHealth] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [title, setTitle] = useState("");

    useEffect(() => {
        ping().then(setHealth);
        getTasks().then(setTasks);
    }, []);

    const add = async () => {
        if (!title.trim()) return;
        await createTask(title.trim());
        setTitle("");
        setTasks(await getTasks());
    };

    return (
        <div style={{ padding: 24, fontFamily: "sans-serif" }}>
            <h1>Capstone Frontend</h1>
            <pre>Health: {health ? JSON.stringify(health) : "loading..."}</pre>

            <h2>Tasks</h2>
            <div style={{ display: "flex", gap: 8 }}>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="New task..." />
                <button onClick={add}>Add</button>
            </div>
            <ul>
                {tasks.map(t => <li key={t.id}>{t.title}</li>)}
            </ul>
        </div>
    );
}
