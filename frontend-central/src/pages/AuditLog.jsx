import React, { useEffect, useState } from "react";
const API_URL = import.meta.env.VITE_API_URL;

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/api/audit`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => setLogs(Array.isArray(data) ? data : []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Audit Log Aktivitas</h1>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <table className="min-w-full bg-white border border-gray-200 text-xs">
          <thead>
            <tr>
              <th className="px-2 py-1 border">Waktu</th>
              <th className="px-2 py-1 border">User</th>
              <th className="px-2 py-1 border">Aksi</th>
              <th className="px-2 py-1 border">Detail</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="px-2 py-1 border">{log.time}</td>
                <td className="px-2 py-1 border">{log.user}</td>
                <td className="px-2 py-1 border">{log.action}</td>
                <td className="px-2 py-1 border">{log.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
