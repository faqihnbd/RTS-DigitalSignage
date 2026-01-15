import React, { useEffect, useState } from "react";
import logger from "../utils/logger";
const API_URL = import.meta.env.VITE_API_URL;

export default function DashboardRingkasan() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const tenantId = user.tenant_id || 1; // Default to 1 for demo purposes

    fetch(`${API_URL}/api/stats/summary?tenant_id=${tenantId}`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => setSummary(data))
      .catch((err) => {
        logger.logApiError("/api/stats/summary", err);
        setSummary(null);
        setError("Failed to load summary");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard Ringkasan</h1>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : summary ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded shadow p-4">
            <div className="text-lg font-semibold">Total Tenant</div>
            <div className="text-2xl">{summary.totalTenants}</div>
          </div>
          <div className="bg-white rounded shadow p-4">
            <div className="text-lg font-semibold">Total Device</div>
            <div className="text-2xl">{summary.totalDevices}</div>
          </div>
          <div className="bg-white rounded shadow p-4">
            <div className="text-lg font-semibold">Total User</div>
            <div className="text-2xl">{summary.totalUsers}</div>
          </div>
          <div className="bg-white rounded shadow p-4">
            <div className="text-lg font-semibold">Total Konten</div>
            <div className="text-2xl">{summary.totalContents}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
