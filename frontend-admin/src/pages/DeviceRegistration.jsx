import React, { useState, useEffect } from "react";
import {
  TvIcon,
  PlusIcon,
  SignalIcon,
  SignalSlashIcon,
  Cog6ToothIcon,
  TrashIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  XMarkIcon,
  PlayIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { useNotification } from "../components/NotificationProvider";
import logger from "../utils/logger";

export default function DeviceRegistration() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [deviceCode, setDeviceCode] = useState("");
  const [deviceType, setDeviceType] = useState("tv");
  const [location, setLocation] = useState("");
  const [resolution, setResolution] = useState("1920x1080");
  const [currentPackage, setCurrentPackage] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    offline: 0,
    uptime: 0,
  });
  const [error, setError] = useState("");
  const [managingDevice, setManagingDevice] = useState(null);
  const [showManageModal, setShowManageModal] = useState(false);
  // Tambahan untuk fitur assign playlist
  const [playlists, setPlaylists] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningDevice, setAssigningDevice] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  // Bulk assign states
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [selectedBulkPlaylist, setSelectedBulkPlaylist] = useState("");
  const [bulkAssignLoading, setBulkAssignLoading] = useState(false);
  const { confirm, error: showError } = useNotification();

  // Fetch playlists
  const fetchPlaylists = async () => {
    try {
      const token =
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("admin_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/playlists`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setPlaylists(data);
      }
    } catch (err) {
      console.error("Error fetching playlists:", err);
    }
  };

  useEffect(() => {
    fetchDevices();
    fetchCurrentPackage();
    fetchStats();
    fetchPlaylists();
  }, []);

  // Assign playlist to device
  const handleAssignPlaylist = async () => {
    if (!assigningDevice || !selectedPlaylist) return;
    setAssignLoading(true);
    try {
      const token =
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("admin_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/devices/${
          assigningDevice.id
        }/assign-playlist`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ playlist_id: selectedPlaylist }),
        }
      );
      if (response.ok) {
        setShowAssignModal(false);
        setAssigningDevice(null);
        setSelectedPlaylist("");
        await fetchDevices();
      } else {
        showError("Gagal assign playlist");
      }
    } catch (err) {
      showError("Gagal assign playlist");
    }
    setAssignLoading(false);
  };

  // Bulk assign playlist to multiple devices
  const handleBulkAssignPlaylist = async () => {
    if (selectedDevices.length === 0 || !selectedBulkPlaylist) return;

    setBulkAssignLoading(true);
    try {
      const token =
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("admin_token");

      // Assign playlist to each selected device
      const promises = selectedDevices.map((deviceId) =>
        fetch(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/api/devices/${deviceId}/assign-playlist`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ playlist_id: selectedBulkPlaylist }),
          }
        )
      );

      const results = await Promise.all(promises);
      const successCount = results.filter((r) => r.ok).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        await fetchDevices();
        setShowBulkAssignModal(false);
        setSelectedBulkPlaylist("");
        setSelectedDevices([]);

        if (failCount === 0) {
          // All successful - silently succeed
        } else {
          showError(
            `${successCount} device(s) berhasil, ${failCount} device(s) gagal`
          );
        }
      } else {
        showError("Gagal assign playlist ke semua devices");
      }
    } catch (err) {
      showError("Terjadi kesalahan saat assign playlist");
    }
    setBulkAssignLoading(false);
  };

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const token =
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("admin_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/devices`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDevices(data);
      }
    } catch (err) {
      console.error("Error fetching devices:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentPackage = async () => {
    try {
      const token =
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("admin_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/packages/current`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCurrentPackage(data);
      }
    } catch (err) {
      console.error("Error fetching current package:", err);
    }
  };

  const fetchStats = async () => {
    try {
      const token =
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("admin_token");

      if (!token) {
        console.error("No authentication token found");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/devices/stats`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error(
          "Stats fetch failed:",
          response.status,
          await response.text()
        );
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const handleAddDevice = async (e) => {
    e.preventDefault();
    if (!deviceName.trim() || !deviceCode.trim()) return;

    setAdding(true);
    setError("");

    try {
      const token =
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("admin_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/devices`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: deviceName,
            token: deviceCode,
            device_type: deviceType,
            location: location || "Not specified",
            resolution: resolution,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        logger.logDevice("Device Added", {
          name: deviceName,
          code: deviceCode,
          type: deviceType,
        });
        setDeviceName("");
        setDeviceCode("");
        setLocation("");
        setDeviceType("tv");
        setResolution("1920x1080");
        fetchDevices();
        fetchStats();
      } else {
        logger.logApiError("/api/devices (add)", new Error(data.message), {
          status: response.status,
        });
        console.error("Add device failed:", response.status, data);
        setError(data.message || `Failed to add device (${response.status})`);
      }
    } catch (err) {
      console.error("Network error:", err);
      setError("Network error occurred");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteDevice = async (deviceId) => {
    const isConfirmed = await confirm({
      title: "Hapus Device",
      message:
        "Apakah Anda yakin ingin menghapus device ini? Tindakan ini tidak dapat dibatalkan.",
      confirmText: "Hapus",
      cancelText: "Batal",
      type: "danger",
    });

    if (!isConfirmed) return;

    try {
      const token =
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("admin_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/devices/${deviceId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        fetchDevices();
        fetchStats();
      }
    } catch (err) {
      console.error("Error deleting device:", err);
    }
  };

  const handleManageDevice = (device) => {
    setManagingDevice(device);
    setShowManageModal(true);
  };

  const handleUpdateDevice = async (updatedData) => {
    try {
      const token =
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("admin_token");
      // Simpan data device (kecuali playlist)
      const { playlist_id, ...deviceData } = updatedData;
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/devices/${managingDevice.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(deviceData),
        }
      );

      // Jika playlist_id berubah, assign playlist
      const currentPlaylistId =
        managingDevice.DevicePlaylists &&
        managingDevice.DevicePlaylists.length > 0
          ? managingDevice.DevicePlaylists[0].playlist_id.toString()
          : "";

      if (playlist_id !== currentPlaylistId) {
        if (playlist_id) {
          // Assign new playlist
          await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/devices/${
              managingDevice.id
            }/assign-playlist`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ playlist_id }),
            }
          );
        } else {
          // Remove playlist assignment (assign empty)
          await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/devices/${
              managingDevice.id
            }/assign-playlist`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        }
      }

      if (response.ok) {
        setShowManageModal(false);
        setManagingDevice(null);
        fetchDevices();
        fetchStats();
      } else {
        const data = await response.json();
        showError(data.message || "Failed to update device");
      }
    } catch (err) {
      showError("Network error occurred");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "online":
        return "text-green-500 bg-green-50";
      case "offline":
        return "text-red-500 bg-red-50";
      default:
        return "text-gray-500 bg-gray-50";
    }
  };

  const getDeviceIcon = (type) => {
    switch (type) {
      case "tv":
        return TvIcon;
      case "display":
        return ComputerDesktopIcon;
      default:
        return DevicePhoneMobileIcon;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-tr from-yellow-500 to-orange-600 rounded-xl shadow-lg">
          <TvIcon className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Device Manager</h1>
          <p className="text-gray-600">
            Kelola dan pantau semua perangkat digital signage
          </p>
        </div>
      </div>

      {/* Device Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <TvIcon className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              <p className="text-sm text-gray-600">Total Devices</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <SignalIcon className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.online}</p>
              <p className="text-sm text-gray-600">Online</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <SignalSlashIcon className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {stats.offline}
              </p>
              <p className="text-sm text-gray-600">Offline</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <CheckBadgeIcon className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {stats.uptime}%
              </p>
              <p className="text-sm text-gray-600">Uptime</p>
            </div>
          </div>
        </div>
      </div>

      {/* Package Limit Info */}
      {currentPackage && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                Current Package: {currentPackage.name} (
                {currentPackage.storage_gb}GB Storage)
              </h3>
              <p className="text-sm text-blue-600">
                Device Limit: {stats.total}/{currentPackage.max_devices} devices
                used
              </p>
            </div>
            <div className="text-right">
              <div className="w-32 bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${
                      (stats.total / currentPackage.max_devices) * 100
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Device */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <PlusIcon className="h-6 w-6 text-yellow-600" />
          <h2 className="text-xl font-bold text-gray-800">
            Daftarkan Device Baru
          </h2>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <form
          onSubmit={handleAddDevice}
          className="grid grid-cols-1 md:grid-cols-6 gap-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Device
            </label>
            <input
              type="text"
              placeholder="e.g., TV Lobby Utama"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kode Device
            </label>
            <input
              type="text"
              placeholder="e.g., TV-001-LOBBY"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
              value={deviceCode}
              onChange={(e) => setDeviceCode(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipe Device
            </label>
            <select
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
            >
              <option value="tv">Smart TV</option>
              <option value="display">Display Monitor</option>
              <option value="tablet">Tablet/Mobile</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lokasi
            </label>
            <input
              type="text"
              placeholder="e.g., Lantai 1 - Lobby"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resolusi
            </label>
            <select
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
            >
              <option value="1920x1080">1920x1080 (Full HD)</option>
              <option value="1366x768">1366x768 (HD)</option>
              <option value="3840x2160">3840x2160 (4K)</option>
              <option value="2560x1440">2560x1440 (QHD)</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={
                adding ||
                !deviceName.trim() ||
                !deviceCode.trim() ||
                (currentPackage && stats.total >= currentPackage.max_devices)
              }
              className="w-full px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:from-yellow-700 hover:to-orange-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adding ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Mendaftarkan...</span>
                </div>
              ) : currentPackage &&
                stats.total >= currentPackage.max_devices ? (
                <span>Limit Reached</span>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <PlusIcon className="h-5 w-5" />
                  <span>Daftarkan</span>
                </div>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Devices List */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <TvIcon className="h-6 w-6 text-gray-600" />
            <h2 className="text-xl font-bold text-gray-800">
              Daftar Perangkat
            </h2>
            {/* Select All Checkbox */}
            {devices.length > 0 && (
              <label className="flex items-center gap-2 cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={selectedDevices.length === devices.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedDevices(devices.map((d) => d.id));
                    } else {
                      setSelectedDevices([]);
                    }
                  }}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Pilih Semua</span>
              </label>
            )}
          </div>
          <div className="flex items-center gap-3">
            {selectedDevices.length > 0 && (
              <button
                onClick={() => setShowBulkAssignModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all"
              >
                <PlayIcon className="h-5 w-5" />
                <span>
                  Assign Playlist ({selectedDevices.length}{" "}
                  {selectedDevices.length === 1 ? "device" : "devices"})
                </span>
              </button>
            )}
            <div className="text-sm text-gray-500">
              {devices.length} perangkat terdaftar
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
            <span className="ml-3 text-gray-600">Memuat perangkat...</span>
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-12">
            <TvIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              Belum ada perangkat terdaftar
            </p>
            <p className="text-gray-400 text-sm">
              Daftarkan perangkat pertama Anda
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {devices.map((device) => {
              const DeviceIcon = getDeviceIcon(device.device_type);
              const lastSeen = device.last_seen
                ? new Date(device.last_seen).toLocaleString("id-ID")
                : "Never";

              return (
                <div
                  key={device.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200"
                >
                  {/* Device Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Checkbox untuk select device */}
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedDevices.includes(device.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDevices([
                                  ...selectedDevices,
                                  device.id,
                                ]);
                              } else {
                                setSelectedDevices(
                                  selectedDevices.filter(
                                    (id) => id !== device.id
                                  )
                                );
                              }
                            }}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </label>
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <DeviceIcon className="h-6 w-6 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800">
                            {device.name}
                          </h3>
                          <p className="text-xs text-gray-500">
                            ID TV: {device.device_id}
                          </p>
                          <p className="text-sm text-gray-500">
                            Token: {device.token}
                          </p>
                          <p className="text-xs text-blue-600 break-all">
                            License Key: {device.license_key}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          device.status
                        )}`}
                      >
                        {device.status === "online" ? "Online" : "Offline"}
                      </div>
                    </div>
                  </div>

                  {/* Device Details */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Type:</span>
                      <span className="text-gray-800 font-medium capitalize">
                        {device.device_type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Last Seen:</span>
                      <span className="text-gray-800 font-medium">
                        {lastSeen}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Location:</span>
                      <span className="text-gray-800 font-medium">
                        {device.location || "Not specified"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Resolution:</span>
                      <span className="text-gray-800 font-medium">
                        {device.resolution || "Unknown"}
                      </span>
                    </div>
                    {/* Playlist Info */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Playlist:</span>
                      <span className="text-gray-800 font-medium">
                        {device.DevicePlaylists &&
                        device.DevicePlaylists.length > 0 &&
                        device.DevicePlaylists[0].Playlist
                          ? device.DevicePlaylists[0].Playlist.name
                          : "-"}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="p-4 pt-0 flex gap-2">
                    <button
                      onClick={() => handleManageDevice(device)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
                    >
                      <Cog6ToothIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">Kelola</span>
                    </button>
                    <button
                      onClick={() => {
                        setAssigningDevice(device);
                        setShowAssignModal(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all"
                    >
                      <PlayIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Assign Playlist
                      </span>
                    </button>
                    <button
                      onClick={() => handleDeleteDevice(device.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                  {/* Assign Playlist Modal */}
                  {showAssignModal && assigningDevice && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                      <div className="bg-white rounded-lg shadow-lg p-6 min-w-[320px]">
                        <h2 className="text-lg font-bold mb-4">
                          Assign Playlist ke {assigningDevice.name}
                        </h2>
                        <select
                          className="w-full border rounded p-2 mb-4"
                          value={selectedPlaylist}
                          onChange={(e) => setSelectedPlaylist(e.target.value)}
                        >
                          <option value="">Pilih Playlist</option>
                          {playlists.map((pl) => (
                            <option key={pl.id} value={pl.id}>
                              {pl.name}
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2 justify-end">
                          <button
                            className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                            onClick={() => {
                              setShowAssignModal(false);
                              setAssigningDevice(null);
                              setSelectedPlaylist("");
                            }}
                            disabled={assignLoading}
                          >
                            Batal
                          </button>
                          <button
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            onClick={handleAssignPlaylist}
                            disabled={!selectedPlaylist || assignLoading}
                          >
                            {assignLoading ? "Assigning..." : "Assign"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Device Management Modal */}
      {showManageModal && managingDevice && (
        <DeviceManageModal
          device={managingDevice}
          onClose={() => {
            setShowManageModal(false);
            setManagingDevice(null);
          }}
          onUpdate={handleUpdateDevice}
        />
      )}

      {/* Bulk Assign Playlist Modal */}
      {showBulkAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 min-w-[400px] max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Assign Playlist ke Multiple Devices
              </h2>
              <button
                onClick={() => {
                  setShowBulkAssignModal(false);
                  setSelectedBulkPlaylist("");
                }}
                disabled={bulkAssignLoading}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Anda akan assign playlist ke{" "}
                <span className="font-bold text-blue-600">
                  {selectedDevices.length} device(s)
                </span>
                :
              </p>
              <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                <ul className="space-y-1 text-sm text-gray-700">
                  {devices
                    .filter((d) => selectedDevices.includes(d.id))
                    .map((d) => (
                      <li key={d.id} className="flex items-center gap-2">
                        <CheckIcon className="h-4 w-4 text-green-500" />
                        {d.name}
                      </li>
                    ))}
                </ul>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Playlist
              </label>
              <select
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                value={selectedBulkPlaylist}
                onChange={(e) => setSelectedBulkPlaylist(e.target.value)}
                disabled={bulkAssignLoading}
              >
                <option value="">-- Pilih Playlist --</option>
                {playlists.map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    {pl.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                className="flex-1 px-4 py-3 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
                onClick={() => {
                  setShowBulkAssignModal(false);
                  setSelectedBulkPlaylist("");
                }}
                disabled={bulkAssignLoading}
              >
                Batal
              </button>
              <button
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleBulkAssignPlaylist}
                disabled={!selectedBulkPlaylist || bulkAssignLoading}
              >
                {bulkAssignLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Assigning...</span>
                  </div>
                ) : (
                  "Assign Playlist"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Device Management Modal Component
function DeviceManageModal({ device, onClose, onUpdate }) {
  const [name, setName] = useState(device.name);
  const [location, setLocation] = useState(device.location || "");
  const [deviceType, setDeviceType] = useState(device.device_type);
  const [resolution, setResolution] = useState(
    device.resolution || "1920x1080"
  );
  const [updating, setUpdating] = useState(false);
  // Playlist state - get from DevicePlaylists association
  const currentPlaylistId =
    device.DevicePlaylists && device.DevicePlaylists.length > 0
      ? device.DevicePlaylists[0].playlist_id
      : "";
  const [playlistId, setPlaylistId] = useState(currentPlaylistId);
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    // Fetch playlists for dropdown
    const fetchPlaylists = async () => {
      try {
        const token =
          localStorage.getItem("admin_token") ||
          sessionStorage.getItem("admin_token");
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/playlists`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setPlaylists(data);
        }
      } catch (err) {
        // ignore
      }
    };
    fetchPlaylists();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    await onUpdate({
      name,
      location,
      device_type: deviceType,
      resolution,
      playlist_id: playlistId,
    });
    setUpdating(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Kelola Device</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Device
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lokasi
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Lantai 1 - Lobby"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipe Device
            </label>
            <select
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="tv">Smart TV</option>
              <option value="display">Display Monitor</option>
              <option value="tablet">Tablet/Mobile</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resolusi
            </label>
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="1920x1080">1920x1080 (Full HD)</option>
              <option value="1366x768">1366x768 (HD)</option>
              <option value="3840x2160">3840x2160 (4K)</option>
              <option value="2560x1440">2560x1440 (QHD)</option>
            </select>
          </div>

          {/* Playlist Edit Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Playlist
            </label>
            <select
              value={playlistId}
              onChange={(e) => setPlaylistId(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">- Tidak ada -</option>
              {playlists.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={updating}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Updating...</span>
                </div>
              ) : (
                "Update Device"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
