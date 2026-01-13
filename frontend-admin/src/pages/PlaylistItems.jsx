import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Bars3Icon,
  TrashIcon,
  PencilSquareIcon,
  CloudArrowUpIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";
import { useNotification } from "../components/NotificationProvider";

export default function PlaylistItems({ playlistId, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [contents, setContents] = useState([]);
  const [adding, setAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedContent, setSelectedContent] = useState("");
  const [addOrientation, setAddOrientation] = useState("landscape");
  const [addTransition, setAddTransition] = useState("fade");
  const [addDuration, setAddDuration] = useState("10");
  const [editingItem, setEditingItem] = useState(null);
  const [editOrientation, setEditOrientation] = useState("");
  const [editTransition, setEditTransition] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef();
  const { confirm, error: showError, success: showSuccess } = useNotification();

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line
  }, [playlistId]);

  // Fetch all available contents for this tenant
  useEffect(() => {
    if (showAdd) {
      const token =
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("admin_token");
      fetch(`${import.meta.env.VITE_API_BASE_URL}/api/contents`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setContents(data));
    }
  }, [showAdd]);

  // Handle content selection change untuk auto-set duration
  function handleContentSelection(contentId) {
    setSelectedContent(contentId);
    if (contentId) {
      const selectedContentObj = contents.find(
        (c) => c.id === parseInt(contentId)
      );
      if (selectedContentObj) {
        if (selectedContentObj.duration_sec) {
          setAddDuration(selectedContentObj.duration_sec.toString());
        } else if (selectedContentObj.type === "video") {
          setAddDuration("30"); // default untuk video
        } else if (selectedContentObj.type === "image") {
          setAddDuration("10"); // default untuk gambar
        } else {
          setAddDuration("15"); // default untuk content lain
        }
      }
    }
  }

  function handleAddItem(e) {
    e.preventDefault();
    if (!selectedContent) return;
    setAdding(true);
    const token =
      localStorage.getItem("admin_token") ||
      sessionStorage.getItem("admin_token");
    fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/playlists/${playlistId}/items`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content_id: selectedContent,
          order: items.length + 1,
          orientation: addOrientation,
          transition: addTransition,
          duration_sec: parseInt(addDuration) || 10,
        }),
      }
    ).then(() => {
      setAdding(false);
      setShowAdd(false);
      setSelectedContent("");
      setAddOrientation("landscape");
      setAddTransition("fade");
      setAddDuration("10");
      setHasChanges(false); // Reset changes setelah add item
      fetchItems();
    });
  }

  // Fungsi upload video baru
  function handleUploadVideo(e) {
    e.preventDefault();
    const file = fileInputRef.current.files[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    const token =
      localStorage.getItem("admin_token") ||
      sessionStorage.getItem("admin_token");
    const formData = new FormData();
    formData.append("file", file);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/contents`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })
      .then(async (res) => {
        clearInterval(progressInterval);
        setUploadProgress(100);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || "Upload gagal");
        }
        return res.json();
      })
      .then((newContent) => {
        // Auto-add to playlist after upload
        return fetch(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/api/playlists/${playlistId}/items`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              content_id: newContent.id,
              order: items.length + 1,
            }),
          }
        );
      })
      .then(() => {
        setTimeout(() => {
          setUploading(false);
          setUploadProgress(0);
          setShowUpload(false);
          fetchItems();
          fileInputRef.current.value = "";
        }, 500);
      })
      .catch((err) => {
        clearInterval(progressInterval);
        showError(err.message);
        setUploading(false);
        setUploadProgress(0);
      });
  }

  function fetchItems() {
    setLoading(true);
    const token =
      localStorage.getItem("admin_token") ||
      sessionStorage.getItem("admin_token");
    fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/playlists/${playlistId}/items`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        setItems(data.sort((a, b) => a.order - b.order));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  async function handleDelete(itemId) {
    const isConfirmed = await confirm({
      title: "Hapus Item",
      message: "Apakah Anda yakin ingin menghapus item ini dari playlist?",
      confirmText: "Hapus",
      cancelText: "Batal",
      type: "danger",
    });

    if (!isConfirmed) return;

    const token =
      localStorage.getItem("admin_token") ||
      sessionStorage.getItem("admin_token");
    fetch(
      `${
        import.meta.env.VITE_API_BASE_URL
      }/api/playlists/${playlistId}/items/${itemId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    ).then(() => {
      setHasChanges(false); // Reset changes setelah delete item
      fetchItems();
    });
  }

  function handleEdit(item) {
    setEditingItem(item.id);
    setEditOrientation(item.orientation || "landscape");
    setEditTransition(item.transition || "fade");
    // Set durasi dari item atau default berdasarkan type
    if (item.duration_sec) {
      setEditDuration(item.duration_sec.toString());
    } else if (item.Content && item.Content.type === "video") {
      setEditDuration("30"); // default 30 detik untuk video
    } else if (item.Content && item.Content.type === "image") {
      setEditDuration("10"); // default 10 detik untuk gambar
    } else {
      setEditDuration("15"); // default 15 detik untuk content lain
    }
  }

  function handleSaveEdit(e) {
    e.preventDefault();
    const token =
      localStorage.getItem("admin_token") ||
      sessionStorage.getItem("admin_token");
    fetch(
      `${
        import.meta.env.VITE_API_BASE_URL
      }/api/playlists/${playlistId}/items/${editingItem}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orientation: editOrientation,
          transition: editTransition,
          duration_sec: parseInt(editDuration) || 10,
        }),
      }
    ).then(() => {
      setEditingItem(null);
      fetchItems();
    });
  }

  function handleCancelEdit() {
    setEditingItem(null);
    setEditOrientation("");
    setEditTransition("");
    setEditDuration("");
  }

  function handleDragStart(idx) {
    setDraggedIdx(idx);
  }
  function handleDragOver(e) {
    e.preventDefault();
  }
  function handleDrop(idx) {
    if (draggedIdx === null || draggedIdx === idx) return;
    const newItems = [...items];
    const [removed] = newItems.splice(draggedIdx, 1);
    newItems.splice(idx, 0, removed);

    // Update local state dan tandai ada perubahan
    setItems(newItems);
    setDraggedIdx(null);
    setHasChanges(true);
  }

  // Fungsi untuk menyimpan urutan ke backend
  async function handleSaveOrder() {
    if (!hasChanges) return;

    try {
      setSaving(true);
      const token =
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("admin_token");

      // Prepare batch update data
      const updateData = items.map((item, index) => ({
        id: item.id,
        order: index + 1,
      }));

      console.log("[SAVE-ORDER] Sending batch update:", updateData);

      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/playlists/${playlistId}/items/batch-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ items: updateData }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("[SAVE-ORDER] Batch update successful:", result);

        // Update local state with server response
        if (result.items) {
          setItems(result.items);
        }

        setHasChanges(false);
        showSuccess("Urutan playlist berhasil disimpan!");

        // Refresh data untuk memastikan sinkronisasi
        await fetchItems();
      } else {
        throw new Error("Failed to save order");
      }
    } catch (error) {
      console.error("Error saving order:", error);
      showError("Gagal menyimpan urutan playlist");
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg relative transition-all duration-300 max-h-[90vh] overflow-y-auto">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-4">Item Playlist</h2>

        <div className="flex gap-2 mb-4">
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition flex items-center gap-2"
            onClick={() => setShowAdd(true)}
          >
            <span>+ Tambah dari Konten</span>
          </button>

          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2"
            onClick={() => setShowUpload(true)}
          >
            <VideoCameraIcon className="h-4 w-4" />
            <span>Upload File Baru</span>
          </button>

          {hasChanges && (
            <button
              className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition flex items-center gap-2"
              onClick={handleSaveOrder}
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Simpan Urutan</span>
                </>
              )}
            </button>
          )}
        </div>

        {hasChanges && (
          <div className="mb-4 p-3 bg-orange-100 border border-orange-300 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-orange-600">⚠️</span>
              <span className="text-orange-800 text-sm font-medium">
                Ada perubahan urutan yang belum disimpan. Klik tombol "Simpan
                Urutan" untuk menyimpan perubahan.
              </span>
            </div>
          </div>
        )}

        {showAdd && (
          <form
            className="mb-4 space-y-3 bg-gray-50 p-4 rounded"
            onSubmit={handleAddItem}
          >
            <div>
              <label className="block text-sm font-medium mb-1">
                Pilih Konten
              </label>
              <select
                className="input input-bordered w-full"
                value={selectedContent}
                onChange={(e) => handleContentSelection(e.target.value)}
                required
              >
                <option value="">Pilih Konten...</option>
                {contents.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.filename} ({c.type})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium mb-1">
                  Orientasi
                </label>
                <select
                  value={addOrientation}
                  onChange={(e) => setAddOrientation(e.target.value)}
                  className="select select-bordered select-sm w-full"
                >
                  <option value="landscape">Landscape</option>
                  <option value="portrait">Portrait</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Transisi
                </label>
                <select
                  value={addTransition}
                  onChange={(e) => setAddTransition(e.target.value)}
                  className="select select-bordered select-sm w-full"
                >
                  <option value="fade">Fade</option>
                  <option value="slide">Slide</option>
                  <option value="zoom">Zoom</option>
                  <option value="none">None</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Durasi (detik)
                </label>
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={addDuration}
                  onChange={(e) => setAddDuration(e.target.value)}
                  className="input input-bordered input-sm w-full"
                  placeholder="10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                disabled={adding}
              >
                {adding ? "Menambah..." : "Tambah"}
              </button>
              <button
                type="button"
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition"
                onClick={() => setShowAdd(false)}
              >
                Batal
              </button>
            </div>
          </form>
        )}
        {loading ? (
          <div>Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-gray-400 text-center">Belum ada item.</div>
        ) : (
          <ul>
            {items.map((item, idx) => (
              <li
                key={item.id}
                className={`py-2 border-b last:border-b-0 ${
                  hasChanges ? "bg-orange-50 border-orange-200" : ""
                }`}
              >
                {editingItem === item.id ? (
                  // Edit form for this item
                  <form onSubmit={handleSaveEdit} className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Orientasi
                        </label>
                        <select
                          value={editOrientation}
                          onChange={(e) => setEditOrientation(e.target.value)}
                          className="select select-bordered select-sm w-full"
                        >
                          <option value="landscape">Landscape</option>
                          <option value="portrait">Portrait</option>
                          <option value="auto">Auto</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Transisi
                        </label>
                        <select
                          value={editTransition}
                          onChange={(e) => setEditTransition(e.target.value)}
                          className="select select-bordered select-sm w-full"
                        >
                          <option value="fade">Fade</option>
                          <option value="slide">Slide</option>
                          <option value="zoom">Zoom</option>
                          <option value="none">None</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Durasi (detik)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="300"
                          value={editDuration}
                          onChange={(e) => setEditDuration(e.target.value)}
                          className="input input-bordered input-sm w-full"
                          placeholder="10"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="btn btn-sm btn-ghost"
                      >
                        Batal
                      </button>
                      <button type="submit" className="btn btn-sm btn-primary">
                        Simpan
                      </button>
                    </div>
                  </form>
                ) : (
                  // Normal display
                  <div
                    className="flex items-center gap-3 cursor-move group"
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(idx)}
                  >
                    <Bars3Icon className="h-5 w-5 text-gray-400 mr-2" />
                    <div className="flex-1">
                      <div className="font-medium">
                        {item.content?.filename || "-"}
                      </div>
                      <div className="text-xs text-gray-500 flex gap-4">
                        <span>📐 {item.orientation || "landscape"}</span>
                        <span>✨ {item.transition || "fade"}</span>
                        <span>⏱️ {item.duration_sec || 10}s</span>
                      </div>
                    </div>
                    <button
                      className="text-blue-500 hover:text-blue-700 mr-2"
                      title="Edit Item"
                      onClick={() => handleEdit(item)}
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                    </button>
                    <button
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(item.id)}
                      title="Hapus"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal Upload Video */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
              onClick={() => setShowUpload(false)}
            >
              &times;
            </button>
            <h3 className="text-lg font-bold mb-4">Upload Video Baru</h3>

            {uploading ? (
              <div className="text-center">
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUploadVideo}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Pilih File Video
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format yang didukung: MP4, AVI, MOV, WMV (Maks. 500MB)
                  </p>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    onClick={() => setShowUpload(false)}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2"
                  >
                    <CloudArrowUpIcon className="h-4 w-4" />
                    Upload & Tambah ke Playlist
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
