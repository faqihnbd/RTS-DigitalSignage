import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";
const API_URL = import.meta.env.VITE_API_URL;

export default function DeviceMonitoring() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/api/devices`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => setDevices(Array.isArray(data) ? data : []))
      .catch(() => setDevices([]))
      .finally(() => setLoading(false));
  }, []);

  // Filter & search
  const filtered = devices
    .filter((d) => d.name.toLowerCase().includes(search.toLowerCase()))
    .filter((d) => !filterStatus || d.status === filterStatus);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Monitoring Device</h1>
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => {
            // Export Excel
            const data = filtered.map((d) => ({
              "Nama Device": d.name,
              Status: d.status,
              "Terakhir Online": d.lastOnline,
            }));
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Device");
            const excelBuffer = XLSX.write(wb, {
              bookType: "xlsx",
              type: "array",
            });
            saveAs(
              new Blob([excelBuffer], { type: "application/octet-stream" }),
              "device.xlsx"
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
            doc.text("Data Device", 14, 14);
            doc.autoTable({
              head: [["Nama Device", "Status", "Terakhir Online"]],
              body: filtered.map((d) => [d.name, d.status, d.lastOnline]),
              startY: 22,
            });
            doc.save("device.pdf");
          }}
          className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700"
        >
          Export PDF
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          className="border px-3 py-2 rounded"
          placeholder="Cari nama device..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border px-3 py-2 rounded"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Semua Status</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2 border">Nama Device</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Terakhir Online</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((device) => (
              <tr key={device.id}>
                <td className="px-4 py-2 border">{device.name}</td>
                <td className="px-4 py-2 border">{device.status}</td>
                <td className="px-4 py-2 border">{device.lastOnline}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
