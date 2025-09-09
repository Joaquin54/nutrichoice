// Minimal API helper

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function ping() {
    const res = await fetch(`${API_BASE}/api/health/`);
    return res.json();
}

export async function getTasks() {
    const res = await fetch(`${API_BASE}/api/tasks/`);
    return res.json();
}

export async function createTask(title) {
    const res = await fetch(`${API_BASE}/api/tasks/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title })
    });
    return res.json();
}
