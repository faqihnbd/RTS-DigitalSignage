import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";
import logger from "../utils/logger";
const API_URL = import.meta.env.VITE_API_URL;

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "tenant_admin",
    tenant_id: "",
  });
  const [tenants, setTenants] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/api/users`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  const fetchTenants = () => {
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/api/tenants`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => setTenants(Array.isArray(data) ? data : []))
      .catch(() => setTenants([]));
  };

  useEffect(() => {
    fetchUsers();
    fetchTenants();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "tenant_admin",
      tenant_id: "",
    });
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      tenant_id: user.tenant_id || "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "tenant_admin",
      tenant_id: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const token = localStorage.getItem("token");

    try {
      const url = editingUser
        ? `${API_URL}/api/users/${editingUser.id}`
        : `${API_URL}/api/users`;
      const method = editingUser ? "PUT" : "POST";

      // Only send password if it's filled
      const payload = { ...formData };
      if (!payload.password && editingUser) {
        delete payload.password;
      }

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      logger.logUser(editingUser ? "User Updated" : "User Created", {
        userId: editingUser?.id,
        email: formData.email,
      });
      alert(editingUser ? "User berhasil diupdate!" : "User berhasil dibuat!");
      closeModal();
      fetchUsers();
    } catch (err) {
      logger.logApiError("/api/users (save)", err);
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId, userName) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus user "${userName}"?`)) {
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      logger.logUser("User Deleted", { userId, userName });
      alert("User berhasil dihapus!");
      fetchUsers();
    } catch (err) {
      logger.logApiError("/api/users (delete)", err, { userId });
      alert("Error: " + err.message);
    }
  };

  // Filter & search
  const filtered = users
    .filter(
      (u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    )
    .filter((u) => !filterRole || u.role === filterRole);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manajemen User</h1>
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold"
        >
          + Tambah User
        </button>
        <button
          onClick={() => {
            // Export Excel
            const data = filtered.map((u) => ({
              Nama: u.name,
              Email: u.email,
              Role: u.role,
            }));
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "User");
            const excelBuffer = XLSX.write(wb, {
              bookType: "xlsx",
              type: "array",
            });
            saveAs(
              new Blob([excelBuffer], { type: "application/octet-stream" }),
              "user.xlsx"
            );
          }}
          className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
        >
          Export Excel
        </button>
        <button
          onClick={() => {
            // Export PDF
            const doc = new jsPDF();
            doc.text("Data User", 14, 14);
            doc.autoTable({
              head: [["Nama", "Email", "Role"]],
              body: filtered.map((u) => [u.name, u.email, u.role]),
              startY: 22,
            });
            doc.save("user.pdf");
          }}
          className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700"
        >
          Export PDF
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          className="border px-3 py-2 rounded"
          placeholder="Cari nama/email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border px-3 py-2 rounded"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="">Semua Role</option>
          <option value="super_admin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border">Nama</th>
              <th className="px-4 py-2 border">Email</th>
              <th className="px-4 py-2 border">Role</th>
              <th className="px-4 py-2 border">Tenant</th>
              <th className="px-4 py-2 border">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border">{user.name}</td>
                <td className="px-4 py-2 border">{user.email}</td>
                <td className="px-4 py-2 border">{user.role}</td>
                <td className="px-4 py-2 border">{user.Tenant?.name || "-"}</td>
                <td className="px-4 py-2 border">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => openEditModal(user)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(user.id, user.name)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingUser ? "Edit User" : "Tambah User Baru"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Nama <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="border px-3 py-2 rounded w-full"
                  placeholder="Nama lengkap"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="border px-3 py-2 rounded w-full"
                  placeholder="email@example.com"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Password{" "}
                  {editingUser && "(Kosongkan jika tidak ingin mengubah)"}
                  {!editingUser && <span className="text-red-500"> *</span>}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="border px-3 py-2 rounded w-full"
                  placeholder="Minimal 6 karakter"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="border px-3 py-2 rounded w-full"
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="tenant_admin">Tenant Admin</option>
                  <option value="user">User</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Tenant <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.tenant_id}
                  onChange={(e) =>
                    setFormData({ ...formData, tenant_id: e.target.value })
                  }
                  className="border px-3 py-2 rounded w-full"
                >
                  <option value="">-- Pilih Tenant --</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                  disabled={submitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
                  disabled={submitting}
                >
                  {submitting
                    ? "Menyimpan..."
                    : editingUser
                    ? "Update"
                    : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
