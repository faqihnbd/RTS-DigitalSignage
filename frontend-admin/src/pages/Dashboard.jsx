import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import {
  ChartBarIcon,
  ClockIcon,
  TvIcon,
  CreditCardIcon,
  ArrowTrendingUpIcon,
  CloudArrowUpIcon,
  PlayIcon,
  BoltIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalContent: 0,
    totalPlaylists: 0,
    activeDevices: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Quick login function for testing
  const quickLogin = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "test@dashboard.com",
          password: "testpass123",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("token", data.token);
        console.log("Quick login successful, token saved");
        // Refresh the page to fetch data with new token
        window.location.reload();
      } else {
        console.error("Quick login failed");
      }
    } catch (err) {
      console.error("Quick login error:", err);
    }
  };

  useEffect(() => {
    // Fetch dashboard data dari API
    const fetchDashboardStats = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log("=== Dashboard Data Fetch Debug ===");
        console.log("Token found:", !!token);
        console.log(
          "Token preview:",
          token ? token.substring(0, 50) + "..." : "none"
        );

        if (!token) {
          console.log("No token found, please login");
          setError("No authentication token found. Please login.");
          setLoading(false);
          return;
        }

        const response = await fetch(
          "http://localhost:3000/api/stats/dashboard",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Dashboard stats response status:", response.status);
        console.log("Dashboard stats response ok:", response.ok);

        if (!response.ok) {
          const errorText = await response.text();
          console.log("Error response text:", errorText);
          throw new Error(
            `HTTP error! status: ${response.status} - ${errorText}`
          );
        }

        const data = await response.json();
        console.log("Dashboard stats data received:", data);
        console.log("Revenue value:", data.totalRevenue);
        console.log("Revenue type:", typeof data.totalRevenue);

        setStats({
          totalContent: data.totalContent || 0,
          totalPlaylists: data.totalPlaylists || 0,
          activeDevices: data.activeDevices || 0,
          totalRevenue: data.totalRevenue || 0,
        });

        console.log("Stats state updated with:", {
          totalContent: data.totalContent || 0,
          totalPlaylists: data.totalPlaylists || 0,
          activeDevices: data.activeDevices || 0,
          totalRevenue: data.totalRevenue || 0,
        });

        setError(null);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        setError(`Failed to load dashboard data: ${err.message}`);
        // Fallback to default values if API fails
        setStats({
          totalContent: 0,
          totalPlaylists: 0,
          activeDevices: 0,
          totalRevenue: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const quickActions = [
    {
      title: "Upload Konten",
      description: "Tambah media baru",
      icon: CloudArrowUpIcon,
      color: "from-blue-500 to-blue-600",
      path: "/upload-content",
    },
    {
      title: "Buat Playlist",
      description: "Susun playlist baru",
      icon: PlayIcon,
      color: "from-green-500 to-green-600",
      path: "/playlist",
    },
    {
      title: "Monitor Device",
      description: "Pantau perangkat aktif",
      icon: TvIcon,
      color: "from-yellow-500 to-yellow-600",
      path: "/device",
    },
    {
      title: "Lihat Statistik",
      description: "Analisis performa",
      icon: ChartBarIcon,
      color: "from-purple-500 to-purple-600",
      path: "/stats",
    },
  ];

  const recentActivities = [
    {
      type: "upload",
      message: "Video promosi 'Summer Sale 2024' berhasil diupload",
      time: "2 menit yang lalu",
      icon: CloudArrowUpIcon,
      color: "text-blue-500",
    },
    {
      type: "playlist",
      message: "Playlist 'Morning Ads' telah diperbarui",
      time: "15 menit yang lalu",
      icon: PlayIcon,
      color: "text-green-500",
    },
    {
      type: "device",
      message: "Device TV-001 sedang offline",
      time: "1 jam yang lalu",
      icon: ExclamationTriangleIcon,
      color: "text-red-500",
    },
    {
      type: "payment",
      message: "Pembayaran paket Premium berhasil",
      time: "2 jam yang lalu",
      icon: CheckBadgeIcon,
      color: "text-emerald-500",
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                <div className="text-sm text-red-800">
                  <strong>Error loading dashboard data:</strong> {error}
                </div>
              </div>
              {error.includes("token") && (
                <button
                  onClick={quickLogin}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
                >
                  Quick Login (Test)
                </button>
              )}
            </div>
          </div>
        )}

        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Selamat Datang Kembali! 👋
              </h1>
              <p className="text-indigo-100 text-lg">
                Kelola konten digital signage Anda dengan mudah
              </p>
            </div>
            <div className="hidden md:block">
              <BoltIcon className="h-16 w-16 text-white/30" />
            </div>
          </div>

          {/* Mini Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    {loading ? "..." : stats.totalContent}
                  </p>
                  <p className="text-sm text-indigo-100">Total Konten</p>
                </div>
                <CloudArrowUpIcon className="h-8 w-8 text-white/60" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    {loading ? "..." : stats.totalPlaylists}
                  </p>
                  <p className="text-sm text-indigo-100">Playlist Aktif</p>
                </div>
                <PlayIcon className="h-8 w-8 text-white/60" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    {loading ? "..." : stats.activeDevices}
                  </p>
                  <p className="text-sm text-indigo-100">Device Online</p>
                </div>
                <TvIcon className="h-8 w-8 text-white/60" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-bold">
                    {loading
                      ? "..."
                      : stats.totalRevenue > 0
                      ? `Rp ${stats.totalRevenue.toLocaleString("id-ID")}`
                      : "Rp 0"}
                  </p>
                  <p className="text-sm text-indigo-100">Total Revenue</p>
                </div>
                <CurrencyDollarIcon className="h-8 w-8 text-white/60" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <BoltIcon className="h-6 w-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-800">Quick Actions</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <div
                key={index}
                className="group cursor-pointer bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-200"
              >
                <div
                  className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}
                >
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  {action.title}
                </h3>
                <p className="text-gray-600 text-sm">{action.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities & Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <ClockIcon className="h-6 w-6 text-blue-500" />
              <h2 className="text-xl font-bold text-gray-800">
                Aktivitas Terbaru
              </h2>
            </div>

            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className={`p-2 rounded-lg bg-white ${activity.color}`}>
                    <activity.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 font-medium">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Overview */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <ChartBarIcon className="h-6 w-6 text-purple-500" />
              <h2 className="text-xl font-bold text-gray-800">
                Performance Overview
              </h2>
            </div>

            <div className="space-y-6">
              {/* Content Performance */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    Content Engagement
                  </span>
                  <span className="text-sm text-gray-500">87%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full"
                    style={{ width: "87%" }}
                  ></div>
                </div>
              </div>

              {/* Device Uptime */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    Device Uptime
                  </span>
                  <span className="text-sm text-gray-500">94%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                    style={{ width: "94%" }}
                  ></div>
                </div>
              </div>

              {/* Playlist Completion */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    Playlist Completion
                  </span>
                  <span className="text-sm text-gray-500">76%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full"
                    style={{ width: "76%" }}
                  ></div>
                </div>
              </div>

              {/* Revenue Growth */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    Revenue Growth
                  </span>
                  <span className="text-sm text-green-600">+12%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                    style={{ width: "82%" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
