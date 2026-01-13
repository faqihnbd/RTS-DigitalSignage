import React, { useEffect, useState } from "react";
import {
  ChartBarIcon,
  TvIcon,
  ListBulletIcon,
  CreditCardIcon,
  CloudArrowUpIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  SignalIcon,
  SignalSlashIcon,
} from "@heroicons/react/24/outline";

export default function Dashboard() {
  const [tenant, setTenant] = useState(null);
  const [packageInfo, setPackageInfo] = useState(null);
  const [stats, setStats] = useState({
    devices: { total: 0, online: 0, offline: 0 },
    content: { total: 0, active: 0 },
    playlists: { total: 0, active: 0 },
    payments: { pending: 0, completed: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format file size helper function
  function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  useEffect(() => {
    const token =
      localStorage.getItem("admin_token") ||
      sessionStorage.getItem("admin_token");

    if (!token) {
      setError("Token tidak ditemukan");
      setLoading(false);
      return;
    }

    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tenants/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Gagal mengambil data tenant");
        return res.json();
      })
      .then((data) => {
        setTenant(data);
        return fetchDashboardStats(token);
      })
      .then(() => setLoading(false))
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const fetchDashboardStats = async (token) => {
    try {
      // Fetch device stats
      const deviceRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/devices`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const deviceData = deviceRes.ok ? await deviceRes.json() : [];

      // Process device stats - handle both array and object responses
      let deviceStats;
      if (Array.isArray(deviceData)) {
        deviceStats = {
          total: deviceData.length,
          online: deviceData.filter((d) => d.status === "online").length,
          offline: deviceData.filter((d) => d.status === "offline").length,
        };
      } else {
        deviceStats = deviceData || { total: 0, online: 0, offline: 0 };
      }

      // Fetch content stats
      const contentRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/contents`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const contentData = contentRes.ok ? await contentRes.json() : [];

      // Fetch playlist stats
      const playlistRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/playlists`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const playlistData = playlistRes.ok ? await playlistRes.json() : [];

      // Fetch payment stats
      const paymentRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/payments`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const paymentData = paymentRes.ok ? await paymentRes.json() : [];

      // Fetch package info using contents/storage-info endpoint
      const packageRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/contents/storage-info`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const packageData = packageRes.ok ? await packageRes.json() : null;

      setStats({
        devices: deviceStats,
        content: {
          total: contentData.length,
          active: contentData.length, // Show all content as active by default
        },
        playlists: {
          total: playlistData.length,
          active: playlistData.length, // Show all playlists as active by default
        },
        payments: {
          pending: paymentData.filter((p) => p.status === "pending").length,
          completed: paymentData.filter((p) => p.status === "paid").length, // Fixed: use "paid" instead of "completed"
        },
      });

      setPackageInfo(packageData);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-700 font-medium">
              Memuat dashboard...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
          <div className="flex items-center space-x-4 text-red-600">
            <ExclamationTriangleIcon className="h-8 w-8" />
            <div>
              <h3 className="font-semibold">Terjadi Kesalahan</h3>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Dashboard Overview */}
        <div className="mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center space-x-3 mb-6">
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800">
                Dashboard Overview
              </h2>
            </div>
            <p className="text-gray-600 mb-6">
              Welcome back! Here's what's happening with your digital signage
            </p>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Current Package */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">
                      Current Package
                    </p>
                    <p className="text-2xl font-bold">
                      {packageInfo?.packageName ||
                        tenant?.Package?.name ||
                        "No Package"}
                    </p>
                    {tenant?.Package?.price && (
                      <p className="text-blue-100 text-sm">
                        Rp{" "}
                        {Math.floor(tenant.Package.price).toLocaleString(
                          "id-ID"
                        )}
                        /bulan
                      </p>
                    )}
                  </div>
                  <UserGroupIcon className="h-12 w-12 text-blue-200" />
                </div>
              </div>

              {/* Storage Usage */}
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-green-100 text-sm font-medium">
                      Storage Usage
                    </p>
                    {packageInfo ? (
                      <div>
                        <p className="text-lg font-bold text-green-100">
                          {formatFileSize(packageInfo.usedStorage)} /{" "}
                          {formatFileSize(packageInfo.storageLimit)}
                        </p>
                        <div className="w-full bg-green-400/30 rounded-full h-2 mt-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              packageInfo.usagePercentage > 90
                                ? "bg-red-300"
                                : packageInfo.usagePercentage > 70
                                ? "bg-yellow-300"
                                : "bg-white"
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                packageInfo.usagePercentage
                              )}%`,
                            }}
                          ></div>
                        </div>
                        <p className="text-green-100 text-xs mt-1">
                          {packageInfo.usagePercentage.toFixed(1)}% used
                        </p>
                      </div>
                    ) : (
                      <p className="text-lg font-bold">Loading...</p>
                    )}
                  </div>
                  <CloudArrowUpIcon className="h-12 w-12 text-green-200 ml-4" />
                </div>
              </div>

              {/* Package Expires */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">
                      Package Expires
                    </p>
                    <p className="text-2xl font-bold">
                      {tenant?.expired_at
                        ? new Date(tenant.expired_at).toLocaleDateString(
                            "id-ID",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            }
                          )
                        : "Never"}
                    </p>
                  </div>
                  <CalendarDaysIcon className="h-12 w-12 text-purple-200" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Devices */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <TvIcon className="h-6 w-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    {stats.devices.total}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 font-medium">
                  Total Devices
                </p>
                <div className="flex items-center space-x-4 mt-2 text-xs">
                  <div className="flex items-center space-x-1">
                    <SignalIcon className="h-4 w-4 text-green-500" />
                    <span className="text-green-600 font-medium">
                      {stats.devices.online} Online
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <SignalSlashIcon className="h-4 w-4 text-red-500" />
                    <span className="text-red-600 font-medium">
                      {stats.devices.offline} Offline
                    </span>
                  </div>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TvIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <CloudArrowUpIcon className="h-6 w-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    {stats.content.total}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 font-medium">
                  Total Content
                </p>
                <div className="flex items-center space-x-4 mt-2 text-xs">
                  <span className="text-green-600 font-medium">
                    {stats.content.active} Active
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CloudArrowUpIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Playlists */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <ListBulletIcon className="h-6 w-6 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    {stats.playlists.total}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 font-medium">
                  Total Playlists
                </p>
                <div className="flex items-center space-x-4 mt-2 text-xs">
                  <span className="text-purple-600 font-medium">
                    {stats.playlists.active} Active
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <ListBulletIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Payments */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <CreditCardIcon className="h-6 w-6 text-yellow-600" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    {stats.payments.pending + stats.payments.completed}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 font-medium">
                  Total Payments
                </p>
                <div className="flex items-center space-x-4 mt-2 text-xs">
                  <span className="text-green-600 font-medium">
                    {stats.payments.completed} Paid
                  </span>
                  <span className="text-yellow-600 font-medium">
                    {stats.payments.pending} Pending
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <CreditCardIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
