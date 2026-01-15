import React, { useEffect, useState } from "react";
import logger from "../utils/logger";
const API_URL = import.meta.env.VITE_API_URL;

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/api/notifications`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => setNotifications(Array.isArray(data) ? data : []))
      .catch((err) => {
        logger.logApiError("/api/notifications", err);
        setNotifications([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Pusat Notifikasi</h1>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`p-3 rounded shadow text-sm ${
                n.type === "warning"
                  ? "bg-yellow-100 text-yellow-800"
                  : n.type === "danger"
                  ? "bg-red-100 text-red-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              <div className="font-semibold">{n.title}</div>
              <div>{n.message}</div>
              <div className="text-xs text-gray-500 mt-1">{n.time}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
