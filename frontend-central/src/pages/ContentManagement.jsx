import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";
import logger from "../utils/logger";
const API_URL = import.meta.env.VITE_API_URL;

function ContentForm({ initial, onSave, onClose }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [type, setType] = useState(initial?.type || "image");
  const [status, setStatus] = useState(initial?.status || "active");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) return setError("Judul wajib diisi");
    const formData = new FormData();
    formData.append("title", title);
    formData.append("type", type);
    formData.append("status", status);
    if (file) formData.append("file", file);
    onSave(formData);
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
          {initial ? "Edit Konten" : "Tambah Konten"}
        </h2>
        {error && <div className="text-red-500 mb-2 text-sm">{error}</div>}
        <input
          className="w-full border px-3 py-2 rounded mb-3"
          placeholder="Judul"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <select
          className="w-full border px-3 py-2 rounded mb-3"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="image">Gambar</option>
          <option value="video">Video</option>
          <option value="text">Teks</option>
        </select>
        <select
          className="w-full border px-3 py-2 rounded mb-3"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </select>
        <input
          type="file"
          className="mb-3"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button
          type="submit"
          className="w-full bg-blue-700 text-white py-2 rounded font-semibold hover:bg-blue-800"
        >
          {initial ? "Simpan" : "Tambah"}
        </button>
      </form>
    </div>
  );
}
export default function ContentManagement() {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editContent, setEditContent] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchContents = () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    fetch(`${API_URL}/api/contents`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => setContents(Array.isArray(data) ? data : []))
      .catch((err) => {
        logger.logApiError("/api/contents", err);
        setContents([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchContents();
  }, []);

  // CRUD handlers
  const handleAdd = () => {
    setEditContent(null);
    setShowForm(true);
  };
  const handleEdit = (content) => {
    setEditContent(content);
    setShowForm(true);
  };
  const handleDelete = (id) => {
    setDeleteId(id);
  };
  const doDelete = async () => {
    setActionLoading(true);
    await fetch(`${API_URL}/api/contents/${deleteId}`, {
      method: "DELETE",
      credentials: "include",
    });
    setDeleteId(null);
    setActionLoading(false);
    fetchContents();
  };
  const handleSave = async (formData) => {
    setActionLoading(true);
    let url = "/api/contents";
    let method = "POST";
    if (editContent) {
      url = `/api/contents/${editContent.id}`;
      method = "PUT";
    }
    await fetch(url.startsWith("http") ? url : `${API_URL}${url}`, {
      method,
      body: formData,
      credentials: "include",
    });
    setShowForm(false);
    setEditContent(null);
    setActionLoading(false);
    fetchContents();
  };

  // Search & filter
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const filtered = contents
    .filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
    .filter((c) => !filterStatus || c.status === filterStatus);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manajemen Konten</h1>
      <button
        onClick={handleAdd}
        className="mb-4 bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800"
      >
        Tambah Konten
      </button>
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => {
            // Export Excel
            const data = filtered.map((c) => ({
              Judul: c.title,
              Tipe: c.type,
              Status: c.status,
            }));
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Konten");
            const excelBuffer = XLSX.write(wb, {
              bookType: "xlsx",
              type: "array",
            });
            saveAs(
              new Blob([excelBuffer], { type: "application/octet-stream" }),
              "konten.xlsx"
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
            doc.text("Data Konten", 14, 14);
            doc.autoTable({
              head: [["Judul", "Tipe", "Status"]],
              body: filtered.map((c) => [c.title, c.type, c.status]),
              startY: 22,
            });
            doc.save("konten.pdf");
          }}
          className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700"
        >
          Export PDF
        </button>
        <input
          className="border px-3 py-2 rounded"
          placeholder="Cari judul konten..."
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
              <th className="px-4 py-2 border">Judul</th>
              <th className="px-4 py-2 border">Tipe</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((content) => (
              <tr key={content.id}>
                <td className="px-4 py-2 border">{content.title}</td>
                <td className="px-4 py-2 border">{content.type}</td>
                <td className="px-4 py-2 border">{content.status}</td>
                <td className="px-4 py-2 border flex gap-2">
                  <button
                    onClick={() => handleEdit(content)}
                    className="bg-yellow-400 text-white px-2 py-1 rounded hover:bg-yellow-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(content.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {showForm && (
        <ContentForm
          initial={editContent}
          onSave={handleSave}
          onClose={() => setShowForm(false)}
        />
      )}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-full max-w-sm">
            <div className="mb-4">Yakin ingin menghapus konten ini?</div>
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
    </div>
  );
}
