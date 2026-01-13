import React, { useEffect, useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Notification from "../components/Notification";
const API_URL = import.meta.env.VITE_API_URL;

// Helper: generate subdomain from name
function toSubdomain(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function TenantForm({ initial, onSave, onClose, loading, packages }) {
  // Calculate duration from dates if editing - only once on mount
  const initialDuration = useMemo(() => {
    if (initial?.created_at && initial?.expired_at) {
      const start = new Date(initial.created_at);
      const end = new Date(initial.expired_at);
      const months =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());
      return months > 0 ? months : 1;
    }
    return 1;
  }, [initial?.created_at, initial?.expired_at]);

  const [name, setName] = useState(initial?.name || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [packageId, setPackageId] = useState(initial?.package_id || "");
  const [duration, setDuration] = useState(initialDuration);
  const [customMaxDevices, setCustomMaxDevices] = useState(
    initial?.custom_max_devices || ""
  );
  const [customStorageGb, setCustomStorageGb] = useState(
    initial?.custom_storage_gb || ""
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Reset custom fields when package changes from/to Custom
  useEffect(() => {
    const selectedPackage = packages.find((p) => p.id === parseInt(packageId));
    if (selectedPackage && selectedPackage.name !== "Custom") {
      setCustomMaxDevices("");
      setCustomStorageGb("");
    }
  }, [packageId, packages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!name || !email) return setError("Nama dan email wajib diisi");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return setError("Format email tidak valid");
    if (!packageId) return setError("Pilih paket");
    if (duration < 1) return setError("Durasi minimal 1 bulan");

    // Check if custom package selected
    const selectedPackage = packages.find((p) => p.id === parseInt(packageId));
    if (selectedPackage?.name === "Custom") {
      if (!customMaxDevices || customMaxDevices < 1)
        return setError("Jumlah layar minimal 1 untuk paket Custom");
      if (!customStorageGb || customStorageGb < 1)
        return setError("Storage minimal 1GB untuk paket Custom");
    }

    // expired_at calculation
    // For edit: calculate from today + duration
    // For new: calculate from today + duration
    const now = new Date();
    const expired_at = new Date(now);
    expired_at.setMonth(expired_at.getMonth() + Number(duration));

    const data = {
      name,
      email,
      subdomain: toSubdomain(name),
      package_id: packageId,
      expired_at: expired_at.toISOString(),
      duration_months: Number(duration),
    };

    // Add custom fields if Custom package, otherwise set to null to clear them
    if (selectedPackage?.name === "Custom") {
      data.custom_max_devices = parseInt(customMaxDevices);
      data.custom_storage_gb = parseInt(customStorageGb);
    } else {
      data.custom_max_devices = null;
      data.custom_storage_gb = null;
    }

    onSave(data);
    setSuccess("Data valid, menyimpan...");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow w-full max-w-md relative"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-black"
        >
          ✕
        </button>
        <h2 className="text-xl font-bold mb-4">
          {initial ? "Edit Tenant" : "Tambah Tenant"}
        </h2>
        {error && <div className="text-red-500 mb-2 text-sm">{error}</div>}
        <input
          className="w-full border px-3 py-2 rounded mb-3"
          placeholder="Nama Tenant"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="w-full border px-3 py-2 rounded mb-3"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
        />
        <label className="block mb-1 font-semibold">Paket</label>
        <select
          className="w-full border px-3 py-2 rounded mb-3"
          value={packageId}
          onChange={(e) => setPackageId(e.target.value)}
        >
          <option value="">Pilih Paket</option>
          {packages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.max_devices} layar, {p.storage_gb}GB,{" "}
              {p.duration_month} bln)
            </option>
          ))}
        </select>

        {/* Custom fields for Custom package */}
        {packages.find((p) => p.id === parseInt(packageId))?.name ===
          "Custom" && (
          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-3">
            <h3 className="font-semibold mb-3 text-blue-900">
              Pengaturan Custom
            </h3>
            <label className="block mb-1 font-semibold text-sm">
              Jumlah Layar
            </label>
            <input
              className="w-full border px-3 py-2 rounded mb-3"
              type="number"
              min="1"
              placeholder="Contoh: 5"
              value={customMaxDevices}
              onChange={(e) => setCustomMaxDevices(e.target.value)}
            />
            <label className="block mb-1 font-semibold text-sm">
              Storage (GB)
            </label>
            <input
              className="w-full border px-3 py-2 rounded mb-3"
              type="number"
              min="1"
              placeholder="Contoh: 100"
              value={customStorageGb}
              onChange={(e) => setCustomStorageGb(e.target.value)}
            />
          </div>
        )}

        <label className="block mb-1 font-semibold">Durasi (bulan)</label>
        <input
          className="w-full border px-3 py-2 rounded mb-3"
          type="number"
          min="1"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />
        <button
          type="submit"
          className="w-full bg-blue-700 text-white py-2 rounded font-semibold hover:bg-blue-800"
          disabled={loading}
        >
          {loading ? "Menyimpan..." : initial ? "Simpan" : "Tambah"}
        </button>
      </form>
    </div>
  );
}

export default function TenantManagement({ showNotif }) {
  const [tenants, setTenants] = useState([]);
  const [packages, setPackages] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editTenant, setEditTenant] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [suspendId, setSuspendId] = useState(null);

  // Fetch packages
  const fetchPackages = () => {
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/api/packages`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => setPackages(data))
      .catch(() => setPackages([]));
  };

  const fetchTenants = () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/api/tenants`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data))
          throw new Error("Unauthorized or invalid response");
        setTenants(data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Gagal memuat data tenant");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPackages();
    fetchTenants();
  }, []);

  // CRUD handlers
  const handleAdd = () => {
    setEditTenant(null);
    setShowForm(true);
  };
  const handleEdit = (tenant) => {
    setEditTenant(tenant);
    setShowForm(true);
  };
  const handleDelete = (id) => {
    setDeleteId(id);
  };
  const doDelete = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/tenants/${deleteId}`, {
        method: "DELETE",
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      showNotif && showNotif("success", "Tenant berhasil dihapus");
    } catch {
      showNotif && showNotif("error", "Gagal menghapus tenant");
    }
    setDeleteId(null);
    setActionLoading(false);
    fetchTenants();
  };
  const handleSave = async (data) => {
    setActionLoading(true);
    let url = `${API_URL}/api/tenants`;
    let method = "POST";
    if (editTenant) {
      url = `${API_URL}/api/tenants/${editTenant.id}`;
      method = "PUT";
    }
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      showNotif &&
        showNotif(
          "success",
          editTenant ? "Tenant berhasil diupdate" : "Tenant berhasil ditambah"
        );
      setShowForm(false);
      setEditTenant(null);
    } catch {
      showNotif && showNotif("error", "Gagal menyimpan tenant");
    }
    setActionLoading(false);
    fetchTenants();
  };
  const handleSuspend = (id) => {
    setSuspendId(id);
  };
  const doSuspend = async (id, suspend) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/tenants/${id}/suspend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ suspend }),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      showNotif &&
        showNotif(
          "success",
          suspend ? "Tenant disuspend" : "Tenant diaktifkan"
        );
    } catch {
      showNotif && showNotif("error", "Gagal update status tenant");
    }
    setSuspendId(null);
    setActionLoading(false);
    fetchTenants();
  };

  // Search, filter, sort
  const filtered = tenants
    .filter(
      (t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.email.toLowerCase().includes(search.toLowerCase())
    )
    .filter((t) => !filterStatus || t.status === filterStatus)
    .sort((a, b) => {
      let v1 = a[sortBy],
        v2 = b[sortBy];
      if (typeof v1 === "string") v1 = v1.toLowerCase();
      if (typeof v2 === "string") v2 = v2.toLowerCase();
      if (v1 < v2) return sortDir === "asc" ? -1 : 1;
      if (v1 > v2) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manajemen Tenant</h1>
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => {
            // Export Excel
            const data = filtered.map((tenant) => {
              const pkg =
                packages.find((p) => p.id === tenant.package_id) || {};
              let durasiBulan = tenant.duration_months || 1;
              if (
                !tenant.duration_months &&
                tenant.created_at &&
                tenant.expired_at
              ) {
                const start = new Date(tenant.created_at);
                const end = new Date(tenant.expired_at);
                durasiBulan =
                  (end.getFullYear() - start.getFullYear()) * 12 +
                  (end.getMonth() - start.getMonth());
                if (durasiBulan < 1) durasiBulan = 1;
              }
              const displayMaxDevices =
                tenant.custom_max_devices || pkg.max_devices || "-";
              return {
                Nama: tenant.name,
                Email: tenant.email,
                Paket: pkg.name || "-",
                Layar: displayMaxDevices,
                Durasi: durasiBulan + " bulan",
                Status:
                  tenant.status + (tenant.suspended ? " (Suspended)" : ""),
              };
            });
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Tenant");
            const excelBuffer = XLSX.write(wb, {
              bookType: "xlsx",
              type: "array",
            });
            saveAs(
              new Blob([excelBuffer], { type: "application/octet-stream" }),
              "tenant.xlsx"
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
            doc.text("Data Tenant", 14, 14);
            doc.autoTable({
              head: [["Nama", "Email", "Paket", "Layar", "Durasi", "Status"]],
              body: filtered.map((tenant) => {
                const pkg =
                  packages.find((p) => p.id === tenant.package_id) || {};
                let durasiBulan = tenant.duration_months || 1;
                if (
                  !tenant.duration_months &&
                  tenant.created_at &&
                  tenant.expired_at
                ) {
                  const start = new Date(tenant.created_at);
                  const end = new Date(tenant.expired_at);
                  durasiBulan =
                    (end.getFullYear() - start.getFullYear()) * 12 +
                    (end.getMonth() - start.getMonth());
                  if (durasiBulan < 1) durasiBulan = 1;
                }
                const displayMaxDevices =
                  tenant.custom_max_devices || pkg.max_devices || "-";
                return [
                  tenant.name,
                  tenant.email,
                  pkg.name || "-",
                  displayMaxDevices,
                  durasiBulan + " bulan",
                  tenant.status + (tenant.suspended ? " (Suspended)" : ""),
                ];
              }),
              startY: 22,
            });
            doc.save("tenant.pdf");
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
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </select>
        <select
          className="border px-3 py-2 rounded"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="name">Nama</option>
          <option value="email">Email</option>
          <option value="packageType">Paket</option>
        </select>
        <select
          className="border px-3 py-2 rounded"
          value={sortDir}
          onChange={(e) => setSortDir(e.target.value)}
        >
          <option value="asc">Asc</option>
          <option value="desc">Desc</option>
        </select>
        <button
          onClick={handleAdd}
          className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800"
        >
          Tambah Tenant
        </button>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th
                className="px-4 py-2 border cursor-pointer"
                onClick={() => setSortBy("name")}
              >
                Nama Tenant
              </th>
              <th
                className="px-4 py-2 border cursor-pointer"
                onClick={() => setSortBy("email")}
              >
                Email
              </th>
              <th
                className="px-4 py-2 border cursor-pointer"
                onClick={() => setSortBy("packageType")}
              >
                Paket
              </th>
              <th className="px-4 py-2 border">Layar</th>
              <th className="px-4 py-2 border">Durasi</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((tenant) => {
              // Find package info
              const pkg =
                packages.find((p) => p.id === tenant.package_id) || {};
              // Use stored duration_months if available, otherwise calculate
              let durasiBulan = tenant.duration_months || 1;
              if (
                !tenant.duration_months &&
                tenant.created_at &&
                tenant.expired_at
              ) {
                const start = new Date(tenant.created_at);
                const end = new Date(tenant.expired_at);
                durasiBulan =
                  (end.getFullYear() - start.getFullYear()) * 12 +
                  (end.getMonth() - start.getMonth());
                if (durasiBulan < 1) durasiBulan = 1;
              }
              // Determine display values for custom packages
              const displayMaxDevices =
                tenant.custom_max_devices || pkg.max_devices || "-";
              const displayStorageGb =
                tenant.custom_storage_gb || pkg.storage_gb || "-";

              return (
                <tr key={tenant.id}>
                  <td className="px-4 py-2 border">{tenant.name}</td>
                  <td className="px-4 py-2 border">{tenant.email || "-"}</td>
                  <td className="px-4 py-2 border">{pkg.name || "-"}</td>
                  <td className="px-4 py-2 border">{displayMaxDevices}</td>
                  <td className="px-4 py-2 border">{durasiBulan} bulan</td>
                  <td className="px-4 py-2 border">
                    {tenant.status}
                    {tenant.suspended && (
                      <span className="ml-2 text-xs bg-red-200 text-red-700 px-2 py-1 rounded">
                        Suspended
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 border flex gap-2">
                    <button
                      onClick={() => handleEdit(tenant)}
                      className="bg-yellow-400 text-white px-2 py-1 rounded hover:bg-yellow-500"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(tenant.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                    >
                      Hapus
                    </button>
                    {tenant.suspended ? (
                      <button
                        onClick={() => handleSuspend(tenant.id)}
                        className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                      >
                        Aktifkan
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSuspend(tenant.id)}
                        className="bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-700"
                      >
                        Suspend
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {showForm && (
        <TenantForm
          initial={editTenant}
          onSave={handleSave}
          onClose={() => setShowForm(false)}
          loading={actionLoading}
          packages={packages}
        />
      )}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-full max-w-sm">
            <div className="mb-4">Yakin ingin menghapus tenant ini?</div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded bg-gray-200"
              >
                Batal
              </button>
              <button
                onClick={doDelete}
                className="px-4 py-2 rounded bg-red-500 text-white"
                disabled={actionLoading}
              >
                {actionLoading ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
      {suspendId && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-full max-w-sm">
            <div className="mb-4">
              {tenants.find((t) => t.id === suspendId)?.suspended
                ? "Aktifkan tenant ini?"
                : "Suspend tenant ini?"}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setSuspendId(null)}
                className="px-4 py-2 rounded bg-gray-200"
              >
                Batal
              </button>
              <button
                onClick={() =>
                  doSuspend(
                    suspendId,
                    !tenants.find((t) => t.id === suspendId)?.suspended
                  )
                }
                className="px-4 py-2 rounded bg-gray-700 text-white"
                disabled={actionLoading}
              >
                {actionLoading
                  ? "Memproses..."
                  : tenants.find((t) => t.id === suspendId)?.suspended
                  ? "Aktifkan"
                  : "Suspend"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
