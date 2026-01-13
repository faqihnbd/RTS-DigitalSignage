import React, { useEffect, useState } from "react";
const API_URL = import.meta.env.VITE_API_URL;

export default function UserTenantManagement() {
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/api/tenants`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => setTenants(data));
  }, []);

  const handleSelectTenant = (tenant) => {
    setSelectedTenant(tenant);
    setLoading(true);
    fetch(`${API_URL}/api/tenants/${tenant.id}/users`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Gagal memuat user tenant");
        setLoading(false);
      });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manajemen User Tenant</h1>
      <div className="mb-4">
        <label className="block mb-1">Pilih Tenant:</label>
        <select
          className="border px-3 py-2 rounded"
          onChange={(e) =>
            handleSelectTenant(tenants.find((t) => t.id == e.target.value))
          }
        >
          <option value="">-- Pilih Tenant --</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        selectedTenant && (
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Nama</th>
                <th className="px-4 py-2 border">Email</th>
                <th className="px-4 py-2 border">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-2 border">{user.name}</td>
                  <td className="px-4 py-2 border">{user.email}</td>
                  <td className="px-4 py-2 border">{user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </div>
  );
}
