import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
const API_URL = import.meta.env.VITE_API_URL;

// Komponen daftar tenant
function TenantList({ tenants }) {
  if (!tenants || tenants.length === 0) return <div>Tidak ada tenant.</div>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 mt-6">
        <thead>
          <tr>
            <th className="px-4 py-2 border">Nama Tenant</th>
            <th className="px-4 py-2 border">Email</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((tenant) => (
            <tr key={tenant.id}>
              <td className="px-4 py-2 border">{tenant.name}</td>
              <td className="px-4 py-2 border">{tenant.email || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function StatistikGlobal() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("7");
  const [daily, setDaily] = useState([]);

  // State untuk daftar tenant
  const [tenants, setTenants] = useState([]);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [tenantError, setTenantError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/api/stats/global`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => setStats(data))
      .catch((err) => {
        setStats(null);
        setError("Failed to load statistics");
      })
      .finally(() => setLoading(false));
    // Fetch tenant list
    setTenantLoading(true);
    fetch(`${API_URL}/api/tenants`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => setTenants(Array.isArray(data) ? data : []))
      .catch(() => setTenantError("Gagal memuat daftar tenant"))
      .finally(() => setTenantLoading(false));
  }, []);

  useEffect(() => {
    // Fetch daily stats for chart
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/api/stats/daily-global?days=${filter}`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => setDaily(data || []))
      .catch(() => setDaily([]));
  }, [filter]);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Statistik Global</h1>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded shadow p-4">
              <div className="text-lg font-semibold">Total Tenant</div>
              <div className="text-2xl">
                {stats.overview?.total_tenants || 0}
              </div>
            </div>
            <div className="bg-white rounded shadow p-4">
              <div className="text-lg font-semibold">Total Device</div>
              <div className="text-2xl">
                {stats.overview?.total_devices || 0}
              </div>
            </div>
            <div className="bg-white rounded shadow p-4">
              <div className="text-lg font-semibold">Total Konten</div>
              <div className="text-2xl">
                {stats.overview?.total_contents || 0}
              </div>
            </div>
            <div className="bg-white rounded shadow p-4">
              <div className="text-lg font-semibold">Device Aktif</div>
              <div className="text-2xl">
                {stats.overview?.active_devices || 0}
              </div>
            </div>
          </div>
          <div className="bg-white rounded shadow p-4 mb-8">
            <h2 className="text-xl font-semibold mb-4">Daftar Tenant</h2>
            {tenantLoading ? (
              <div>Loading daftar tenant...</div>
            ) : tenantError ? (
              <div className="text-red-500">{tenantError}</div>
            ) : (
              <TenantList tenants={tenants} />
            )}
          </div>
          <div className="mb-4">
            <label className="mr-2">Filter hari:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="7">7 Hari</option>
              <option value="30">30 Hari</option>
              <option value="90">90 Hari</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded shadow p-4">
              <div className="font-semibold mb-2">Grafik Jam Tayang Harian</div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart
                  data={daily}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total_duration"
                    stroke="#8884d8"
                    name="Jam Tayang"
                  />
                  <Line
                    type="monotone"
                    dataKey="active_devices"
                    stroke="#82ca9d"
                    name="Device Aktif"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded shadow p-4">
              <div className="font-semibold mb-2">
                Top 5 Tenant (Konten Terbanyak)
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.top_tenants || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="content_count"
                    fill="#8884d8"
                    name="Jumlah Konten"
                  >
                    {(stats.top_tenants || []).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded shadow p-4">
            <h2 className="text-xl font-semibold mb-4">System Health</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600">Status</div>
                <div className="font-semibold">
                  {stats.system_health?.status || "Unknown"}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Uptime</div>
                <div className="font-semibold">
                  {stats.system_health?.uptime || "N/A"}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Last Backup</div>
                <div className="font-semibold">
                  {stats.system_health?.last_backup || "N/A"}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
