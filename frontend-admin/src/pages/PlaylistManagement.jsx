import React, { useState, useEffect, useRef } from "react";
import {
  ListBulletIcon,
  ClockIcon,
  TrashIcon,
  Cog6ToothIcon,
  PlusIcon,
  ChartBarIcon,
  VideoCameraIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import PlaylistItems from "./PlaylistItems";
import { useNotification } from "../components/NotificationProvider";
import logger from "../utils/logger";
export default function PlaylistManagement() {
  const [playlists, setPlaylists] = useState([]);
  const [layouts, setLayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [selectedLayout, setSelectedLayout] = useState("");
  const [error, setError] = useState("");
  const [showItems, setShowItems] = useState(null); // playlistId
  const [showLayoutSelector, setShowLayoutSelector] = useState(null); // playlistId
  const nameInputRef = useRef();
  const { confirm, error: showError, info: showInfo } = useNotification();

  useEffect(() => {
    fetchPlaylists();
    fetchLayouts();
  }, []);

  function fetchLayouts() {
    const token =
      localStorage.getItem("admin_token") ||
      sessionStorage.getItem("admin_token");
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/layouts`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setLayouts(data);
      })
      .catch(() => {});
  }

  function fetchPlaylists() {
    setLoading(true);
    const token =
      localStorage.getItem("admin_token") ||
      sessionStorage.getItem("admin_token");
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/playlists`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setPlaylists(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  function handleAddPlaylist(e) {
    e.preventDefault();
    if (!playlistName.trim()) return;
    setAdding(true);
    const token =
      localStorage.getItem("admin_token") ||
      sessionStorage.getItem("admin_token");

    const requestBody = { name: playlistName };
    if (selectedLayout) {
      requestBody.layout_id = parseInt(selectedLayout);
    }

    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/playlists`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    })
      .then((res) => res.json())
      .then(() => {
        setAdding(false);
        setPlaylistName("");
        setSelectedLayout("");
        fetchPlaylists();
        nameInputRef.current.value = "";
        logger.logPlaylist("Playlist Created", {
          name: playlistName,
          layoutId: selectedLayout,
        });
        showInfo("Playlist berhasil dibuat!");
      })
      .catch(() => {
        setAdding(false);
        logger.logApiError(
          "/api/playlists (create)",
          new Error("Create failed")
        );
        showError("Gagal membuat playlist");
      });
  }

  async function handleDelete(id) {
    const isConfirmed = await confirm({
      title: "Hapus Playlist",
      message:
        "Apakah Anda yakin ingin menghapus playlist ini? Tindakan ini tidak dapat dibatalkan.",
      confirmText: "Hapus",
      cancelText: "Batal",
      type: "danger",
    });

    if (!isConfirmed) return;

    const token =
      localStorage.getItem("admin_token") ||
      sessionStorage.getItem("admin_token");
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/playlists/` + id, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }).then(() => {
      logger.logPlaylist("Playlist Deleted", { playlistId: id });
      fetchPlaylists();
    });
  }

  function handleTogglePlaylistStatus(playlistId, currentStatus) {
    const token =
      localStorage.getItem("admin_token") ||
      sessionStorage.getItem("admin_token");

    const newStatus = currentStatus === "active" ? "inactive" : "active";

    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/playlists/${playlistId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    })
      .then((res) => res.json())
      .then(() => {
        // Update status di state lokal
        setPlaylists(
          playlists.map((pl) =>
            pl.id === playlistId ? { ...pl, status: newStatus } : pl
          )
        );
      })
      .catch((error) => {
        console.error("Error updating playlist status:", error);
        showError("Gagal mengubah status playlist");
      });
  }

  async function handleAssignLayout(playlistId, layoutId) {
    const token =
      localStorage.getItem("admin_token") ||
      sessionStorage.getItem("admin_token");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/playlists/${playlistId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ layout_id: layoutId || null }),
        }
      );

      if (response.ok) {
        fetchPlaylists();
        setShowLayoutSelector(null);
        showInfo("Layout berhasil ditetapkan ke playlist");
      } else {
        throw new Error("Failed to assign layout");
      }
    } catch (error) {
      console.error("Error assigning layout:", error);
      showError("Gagal menetapkan layout ke playlist");
    }
  }

  function handlePreviewPlaylist(playlistId) {
    // Open preview modal or redirect to preview page
    showInfo(`Preview playlist dengan ID: ${playlistId}`);
  }

  function handlePlayPlaylist(playlistId) {
    // Start playing playlist on devices
    showInfo(`Memutar playlist dengan ID: ${playlistId}`);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-tr from-green-500 to-emerald-600 rounded-xl shadow-lg">
          <ListBulletIcon className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Playlist Manager</h1>
          <p className="text-gray-600">Buat dan kelola playlist konten Anda</p>
        </div>
      </div>

      {/* Add New Playlist */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <PlusIcon className="h-6 w-6 text-green-600" />
          <h2 className="text-xl font-bold text-gray-800">
            Buat Playlist Baru
          </h2>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAddPlaylist} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Playlist
              </label>
              <input
                type="text"
                placeholder="Masukkan nama playlist..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                ref={nameInputRef}
              />
            </div>
            <div className="w-1/3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Layout Template (Opsional)
              </label>
              <select
                value={selectedLayout}
                onChange={(e) => setSelectedLayout(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              >
                <option value="">-- Default (Fullscreen) --</option>
                {layouts.map((layout) => (
                  <option key={layout.id} value={layout.id}>
                    {layout.name} ({layout.type.replace("_", " ")})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={adding || !playlistName.trim()}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adding ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Membuat...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <PlusIcon className="h-5 w-5" />
                  <span>Buat Playlist</span>
                </div>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Playlists Grid */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <VideoCameraIcon className="h-6 w-6 text-gray-600" />
            <h2 className="text-xl font-bold text-gray-800">Daftar Playlist</h2>
          </div>
          <div className="text-sm text-gray-500">
            {playlists.length} playlist tersedia
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-3 text-gray-600">Memuat playlist...</span>
          </div>
        ) : playlists.length === 0 ? (
          <div className="text-center py-12">
            <ListBulletIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Belum ada playlist</p>
            <p className="text-gray-400 text-sm">
              Buat playlist pertama Anda untuk memulai
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map((pl) => (
              <div
                key={pl.id}
                className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200"
              >
                {/* Playlist Header */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                      <ListBulletIcon className="h-6 w-6 text-white flex-shrink-0" />
                      <h3
                        className="text-lg font-bold text-white truncate"
                        title={pl.name}
                      >
                        {pl.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() =>
                          handleTogglePlaylistStatus(pl.id, pl.status)
                        }
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          pl.status === "active"
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                        title={`${
                          pl.status === "active" ? "Nonaktifkan" : "Aktifkan"
                        } Playlist`}
                      >
                        {pl.status === "active" ? "Aktif" : "Nonaktif"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Playlist Stats */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <ChartBarIcon className="h-4 w-4" />
                      <span className="text-sm">
                        {pl.items?.length || 0} items
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <ClockIcon className="h-4 w-4" />
                      <span className="text-sm">
                        ~
                        {(() => {
                          if (!pl.items || pl.items.length === 0) return 0;

                          // Calculate total duration based on actual content
                          const totalSeconds = pl.items.reduce(
                            (total, item) => {
                              // For video: use content.duration_sec
                              if (item.content?.type === "video") {
                                return (
                                  total + (item.content.duration_sec || 30)
                                );
                              }
                              // For image: use item.duration_sec (custom duration set by user)
                              else if (item.content?.type === "image") {
                                return total + (item.duration_sec || 10);
                              }
                              // For other content types: default 15 seconds
                              else {
                                return total + 15;
                              }
                            },
                            0
                          );

                          return totalSeconds;
                        })()}{" "}
                        detik
                      </span>
                    </div>
                  </div>

                  {/* Layout Info */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Squares2X2Icon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">
                          Layout:
                        </span>
                        <span className="text-sm text-gray-600">
                          {pl.layout ? pl.layout.name : "Default (Fullscreen)"}
                        </span>
                      </div>
                      <button
                        onClick={() => setShowLayoutSelector(pl.id)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Ubah
                      </button>
                    </div>
                    {pl.layout && (
                      <div className="mt-1 text-xs text-gray-500">
                        {pl.layout.type.replace("_", " ")} •{" "}
                        {pl.layout.zones?.length || 0} zona
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowItems(pl.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
                    >
                      <Cog6ToothIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">Kelola</span>
                    </button>
                    <button
                      onClick={() => handleDelete(pl.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Hapus Playlist"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className="h-1 bg-gray-100">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500"
                    style={{
                      width: `${Math.min((pl.items?.length || 0) * 10, 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Playlist Items Modal */}
      {showItems && (
        <PlaylistItems
          playlistId={showItems}
          onClose={() => setShowItems(null)}
        />
      )}

      {/* Layout Selector Modal */}
      {showLayoutSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">
                  Pilih Layout untuk Playlist
                </h2>
                <button
                  onClick={() => setShowLayoutSelector(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Default Option */}
              <div
                onClick={() => handleAssignLayout(showLayoutSelector, null)}
                className="cursor-pointer p-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <VideoCameraIcon className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      Default (Fullscreen)
                    </h3>
                    <p className="text-sm text-gray-600">
                      Tampilan fullscreen tradisional
                    </p>
                  </div>
                </div>
              </div>

              {/* Layout Options */}
              {layouts.map((layout) => (
                <div
                  key={layout.id}
                  onClick={() =>
                    handleAssignLayout(showLayoutSelector, layout.id)
                  }
                  className="cursor-pointer p-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                      <Squares2X2Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">
                        {layout.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {layout.type.replace("_", " ")} •{" "}
                        {layout.zones?.length || 0} zona
                      </p>
                      {layout.description && (
                        <p className="text-xs text-gray-500 mt-1">
                          {layout.description}
                        </p>
                      )}
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        layout.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {layout.is_active ? "Aktif" : "Nonaktif"}
                    </div>
                  </div>
                </div>
              ))}

              {layouts.length === 0 && (
                <div className="text-center py-8">
                  <Squares2X2Icon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">
                    Belum ada layout yang tersedia
                  </p>
                  <button
                    onClick={() => window.open("/layouts", "_blank")}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Buat Layout Baru
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              💡 Tips Penggunaan Layout
            </h3>
            <div className="space-y-2 text-sm text-blue-800">
              <p>
                <span className="font-medium">
                  Layout Default (Fullscreen):
                </span>{" "}
                Akan menampilkan konten dari file di dalam playlist. Cocok untuk
                menampilkan video atau gambar tunggal yang memenuhi seluruh
                layar.
              </p>
              <p>
                <span className="font-medium">Layout Kustom:</span> Jika Anda
                memilih layout selain default, konten playlist akan ditampilkan
                sesuai dengan zona yang telah Anda atur di layout tersebut.
                Misalnya, layout dengan 2 zona akan membagi layar menjadi 2
                bagian. Dan file konten yang ada di dalam playlist tidak akan
                tampil.
              </p>
              <p className="pt-2 border-t border-blue-200">
                <span className="font-medium">Catatan:</span> Pastikan Anda
                sudah mengatur zona di halaman Layout sebelum menggunakan layout
                kustom untuk hasil tampilan yang optimal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
