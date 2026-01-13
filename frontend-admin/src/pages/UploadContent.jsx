import React, { useEffect, useState, useRef } from "react";
import {
  CloudArrowUpIcon,
  TrashIcon,
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { useNotification } from "../components/NotificationProvider";

export default function UploadContent() {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [storageInfo, setStorageInfo] = useState(null);
  const fileInputRef = useRef();
  const { success, error: showError, confirm } = useNotification();

  useEffect(() => {
    fetchContents();
    fetchStorageInfo();
  }, []);

  function fetchStorageInfo() {
    const token =
      localStorage.getItem("admin_token") ||
      sessionStorage.getItem("admin_token");
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/contents/storage-info`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setStorageInfo(data);
      })
      .catch((err) => {
        console.error("Error fetching storage info:", err);
      });
  }

  function fetchContents() {
    setLoading(true);
    const token =
      localStorage.getItem("admin_token") ||
      sessionStorage.getItem("admin_token");
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/contents`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setContents(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  function handleUpload(e) {
    e.preventDefault();
    const file = fileInputRef.current.files[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    setError("");

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
      .then(() => {
        setTimeout(() => {
          setUploading(false);
          setUploadProgress(0);
          fetchContents();
          fetchStorageInfo(); // Update storage info after upload
          fileInputRef.current.value = "";
          success("File berhasil diupload!");
        }, 500);
      })
      .catch((err) => {
        clearInterval(progressInterval);
        setError(err.message);
        setUploading(false);
        setUploadProgress(0);
        showError(err.message || "Upload gagal");
      });
  }

  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      fileInputRef.current.files = e.dataTransfer.files;
      handleUpload(e);
    }
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  function getFileIcon(type) {
    if (type === "image")
      return <PhotoIcon className="h-8 w-8 text-green-500" />;
    if (type === "video")
      return <VideoCameraIcon className="h-8 w-8 text-purple-500" />;
    return <DocumentIcon className="h-8 w-8 text-blue-500" />;
  }

  const stats = {
    total: contents.length,
    images: contents.filter((c) => c.type === "image").length,
    videos: contents.filter((c) => c.type === "video").length,
    texts: contents.filter((c) => c.type === "text").length,
    totalSize: contents.reduce((sum, c) => sum + (c.size || 0), 0),
  };

  async function handleDelete(id) {
    const isConfirmed = await confirm({
      title: "Hapus Konten",
      message:
        "Apakah Anda yakin ingin menghapus konten ini? Tindakan ini tidak dapat dibatalkan.",
      confirmText: "Hapus",
      cancelText: "Batal",
      type: "danger",
    });

    if (!isConfirmed) return;

    const token =
      localStorage.getItem("admin_token") ||
      sessionStorage.getItem("admin_token");
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/contents/` + id, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => {
        fetchContents();
        fetchStorageInfo(); // Update storage info after deletion
        success("Konten berhasil dihapus!");
      })
      .catch(() => {
        showError("Gagal menghapus konten!");
      });
  }

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <CloudArrowUpIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Media Center</h1>
              <p className="text-gray-600">
                Upload dan kelola konten digital Anda
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-gray-600">Total</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2">
              <PhotoIcon className="h-5 w-5 text-green-500" />
              <span className="text-sm text-gray-600">Images</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.images}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2">
              <VideoCameraIcon className="h-5 w-5 text-purple-500" />
              <span className="text-sm text-gray-600">Videos</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.videos}</p>
          </div>
          {storageInfo && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Storage</span>
              </div>
              <p className="text-sm font-bold text-gray-800">
                {formatFileSize(storageInfo.usedStorage)} /{" "}
                {formatFileSize(storageInfo.storageLimit)}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full ${
                    storageInfo.usagePercentage > 90
                      ? "bg-red-500"
                      : storageInfo.usagePercentage > 70
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                  style={{
                    width: `${Math.min(storageInfo.usagePercentage, 100)}%`,
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {storageInfo.packageName} Package
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Upload Konten Baru
          </h2>
          <p className="text-gray-600">
            Drag & drop file atau klik untuk memilih
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-6">
          {/* Drag & Drop Area */}
          <div
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 ${
              dragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <CloudArrowUpIcon
              className={`h-16 w-16 mx-auto mb-4 ${
                dragActive ? "text-blue-500 animate-bounce" : "text-gray-400"
              }`}
            />
            <p className="text-lg font-semibold text-gray-700 mb-2">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Supports: Images, Videos, Documents (Max: 500MB per file)
            </p>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUpload}
              className="hidden"
              accept="image/*,video/*,text/*,.pdf"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
            >
              Choose Files
            </button>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800">
                  Uploading...
                </span>
                <span className="text-sm text-blue-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Content Grid */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Media Library</h2>
          <div className="text-sm text-gray-500">
            {stats.total} files • {formatFileSize(stats.totalSize)}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading media...</span>
          </div>
        ) : contents.length === 0 ? (
          <div className="text-center py-12">
            <PhotoIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No media files yet</p>
            <p className="text-gray-400 text-sm">
              Upload your first file to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {contents.map((c) => {
              let url = c.url || "";
              if (url && !/^https?:\/\//.test(url)) {
                url = `${import.meta.env.VITE_API_BASE_URL}${url}`;
              }
              return (
                <div
                  key={c.id}
                  className="group relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200"
                >
                  {/* Media Preview */}
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    {c.type === "image" ? (
                      <img
                        src={url}
                        alt={c.filename}
                        className="w-full h-full object-cover"
                      />
                    ) : c.type === "video" ? (
                      <div className="relative w-full h-full bg-gray-800 flex items-center justify-center">
                        <VideoCameraIcon className="h-12 w-12 text-white/70" />
                        <video
                          src={url}
                          className="absolute inset-0 w-full h-full object-cover opacity-50"
                          muted
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        {getFileIcon(c.type)}
                        <span className="text-xs text-gray-500 mt-2">
                          Document
                        </span>
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="p-3">
                    <p
                      className="text-sm font-medium text-gray-800 truncate"
                      title={c.filename}
                    >
                      {c.filename}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500 uppercase font-medium">
                        {c.type}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatFileSize(c.size || 0)}
                      </span>
                    </div>
                    {c.duration_sec && (
                      <div className="mt-1">
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {Math.floor(c.duration_sec / 60)}:
                          {(c.duration_sec % 60).toString().padStart(2, "0")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Delete Button */}
                  <button
                    className="absolute top-2 right-2 p-2 bg-red-500/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600"
                    title="Delete file"
                    onClick={() => handleDelete(c.id)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
