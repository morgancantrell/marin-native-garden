"use client";

import { useEffect, useState } from "react";

type Submission = {
  id: string;
  createdAt: string;
  address: string;
  email: string;
  region: string;
  waterDistrict: string;
  pdfUrl?: string | null;
};

export default function AdminPage() {
  const [items, setItems] = useState<Submission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/submissions", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setItems(data);
    } catch (e: any) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // no auto load without token
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold">Submissions</h1>
      <div className="mt-4 flex gap-2">
        <input
          type="password"
          placeholder="Admin token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="h-10 rounded-md border border-neutral-300 px-3"
        />
        <button onClick={load} className="h-10 px-4 rounded-md bg-blue-600 text-white">Load</button>
      </div>
      {loading && <p className="mt-4 text-neutral-600">Loading…</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}
      <div className="mt-6 grid gap-3">
        {items.map((s) => (
          <div key={s.id} className="border rounded-lg p-4">
            <div className="text-sm text-neutral-600">{new Date(s.createdAt).toLocaleString()}</div>
            <div className="font-medium">{s.address}</div>
            <div className="text-sm">{s.email} — {s.region} — {s.waterDistrict}</div>
            {s.pdfUrl && (
              <a className="text-blue-600 underline text-sm" href={s.pdfUrl} target="_blank" rel="noreferrer">Download PDF</a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


