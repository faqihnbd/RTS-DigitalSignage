import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";
const API_URL = import.meta.env.VITE_API_URL;

export default function PlaylistManagement() {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/api/playlists`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => setPlaylists(Array.isArray(data) ? data : []))
      .catch(() => setPlaylists([]))
      .finally(() => setLoading(false));
  }, []);

  // Filter & search
  const filtered = playlists
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => !filterStatus || p.status === filterStatus);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manajemen Playlist</h1>
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => {
            // Export Excel
            const data = filtered.map((p) => ({
              "Nama Playlist": p.name,
              "Jumlah Konten": p.contentCount,
              Status: p.status,
            }));
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Playlist");
            const excelBuffer = XLSX.write(wb, {
              bookType: "xlsx",
              type: "array",
            });
            saveAs(
              new Blob([excelBuffer], { type: "application/octet-stream" }),
              "playlist.xlsx"
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
            doc.text("Data Playlist", 14, 14);
            doc.autoTable({
              head: [["Nama Playlist", "Jumlah Konten", "Status"]],
              body: filtered.map((p) => [p.name, p.contentCount, p.status]),
              startY: 22,
            });
            doc.save("playlist.pdf");
          }}
          className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700"
        >
          Export PDF
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          className="border px-3 py-2 rounded"
          placeholder="Cari nama playlist..."
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
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2 border">Nama Playlist</th>
              <th className="px-4 py-2 border">Jumlah Konten</th>
              <th className="px-4 py-2 border">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((playlist) => (
              <tr key={playlist.id}>
                <td className="px-4 py-2 border">{playlist.name}</td>
                <td className="px-4 py-2 border">{playlist.contentCount}</td>
                <td className="px-4 py-2 border">{playlist.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
