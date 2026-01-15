import React, { useEffect, useState } from "react";
import logger from "../utils/logger";
const API_URL = import.meta.env.VITE_API_URL;

export default function ExportLaporan({ showNotif }) {
  const [downloading, setDownloading] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [tenantId, setTenantId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    // Fetch tenant list
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
        setTenants(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) setTenantId(data[0].id);
      })
      .catch((err) => {
        logger.logApiError("/api/tenants", err);
        setTenants([]);
      });
  }, []);

  const handleExport = async (type) => {
    setDownloading(true);
    try {
      const token = localStorage.getItem("token");
      let endpoint = "";
      let ext = "";
      // Compose params
      let params = [];
      if (tenantId) params.push(`tenant_id=${tenantId}`);
      if (from) params.push(`from=${from}`);
      if (to) params.push(`to=${to}`);
      let paramStr = params.length > 0 ? `?${params.join("&")}` : "";
      if (type === "pdf") {
        endpoint = `/api/export/pdf${paramStr}`;
        ext = "pdf";
      } else if (type === "xlsx") {
        endpoint = `/api/export/excel${paramStr}`;
        ext = "xlsx";
      } else {
        throw new Error("Tipe export tidak didukung");
      }
      const res = await fetch(`${API_URL}${endpoint}`, {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        let errMsg = "Gagal export";
        try {
          errMsg = await res.text();
        } catch {}
        throw new Error(errMsg);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `laporan_wisse.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showNotif &&
        showNotif("success", `Export ${ext.toUpperCase()} berhasil!`);
    } catch (e) {
      showNotif && showNotif("error", e.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Export Laporan Global</h1>
      <div className="flex flex-col md:flex-row gap-4 mb-4 items-center">
        <div>
          <label className="mr-2 font-semibold">Tenant:</label>
          <select
            className="border px-3 py-2 rounded"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mr-2 font-semibold">Dari:</label>
          <input
            type="date"
            className="border px-3 py-2 rounded"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="mr-2 font-semibold">Sampai:</label>
          <input
            type="date"
            className="border px-3 py-2 rounded"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <button
          onClick={() => handleExport("pdf")}
          className="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800"
          disabled={downloading || !tenantId}
        >
          Export PDF
        </button>
        <button
          onClick={() => handleExport("xlsx")}
          className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800"
          disabled={downloading || !tenantId}
        >
          Export Excel
        </button>
      </div>
    </div>
  );
}
