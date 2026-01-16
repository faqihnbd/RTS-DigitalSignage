import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ChartBarIcon,
  CloudArrowUpIcon,
  ListBulletIcon,
  ComputerDesktopIcon,
  CreditCardIcon,
  ArrowUpCircleIcon,
  Bars3Icon,
  XMarkIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import ExpiredModal from "./ExpiredModal";
import { isTokenExpired, getTokenTimeRemaining } from "../utils/tokenUtils";

export default function Layout({ children }) {
  const [tenant, setTenant] = useState(null);
  const [packageInfo, setPackageInfo] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [expiredMessage, setExpiredMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token =
      localStorage.getItem("admin_token") ||
      sessionStorage.getItem("admin_token");
    if (token) {
      // Fetch tenant info with user data
      fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tenants/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.status === 401 || res.status === 403) {
            // Token invalid or forbidden - force logout
            handleLogout();
            return null;
          }
          return res.json();
        })
        .then((data) => {
          if (data) {
            setTenant(data);

            // Check tenant status
            if (data.status === "expired") {
              setExpiredMessage(
                "Paket Anda telah habis. Silakan hubungi administrator untuk memperpanjang paket atau melakukan upgrade."
              );
              setShowExpiredModal(true);
            } else if (data.status === "suspended") {
              setExpiredMessage(
                "Akun Anda telah ditangguhkan oleh administrator. Silakan hubungi support untuk informasi lebih lanjut."
              );
              setShowExpiredModal(true);
            }
          }
        })
        .catch(console.error);

      // Fetch package info
      fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tenants/storage-info`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.status === 401 || res.status === 403) {
            return null;
          }
          return res.json();
        })
        .then((data) => {
          if (data) {
            setPackageInfo(data);
          }
        })
        .catch(console.error);
    }
  }, []);

  // Periodic status check every 5 minutes
  useEffect(() => {
    const token =
      localStorage.getItem("admin_token") ||
      sessionStorage.getItem("admin_token");

    if (!token) return;

    const checkStatus = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/tenants/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.status === 401 || res.status === 403) {
          handleLogout();
          return;
        }

        const data = await res.json();
        if (data) {
          if (data.status === "expired") {
            setExpiredMessage(
              "Paket Anda telah habis. Silakan hubungi administrator untuk memperpanjang paket atau melakukan upgrade."
            );
            setShowExpiredModal(true);
          } else if (data.status === "suspended") {
            setExpiredMessage(
              "Akun Anda telah ditangguhkan oleh administrator. Silakan hubungi support untuk informasi lebih lanjut."
            );
            setShowExpiredModal(true);
          }
        }
      } catch (error) {
        console.error("Status check error:", error);
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkStatus, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Check token expiry every minute
  useEffect(() => {
    const token =
      localStorage.getItem("admin_token") ||
      sessionStorage.getItem("admin_token");

    if (!token) return;

    const checkTokenExpiry = () => {
      if (isTokenExpired(token)) {
        setExpiredMessage(
          "Sesi Anda telah berakhir (24 jam). Silakan login kembali untuk melanjutkan."
        );
        setShowExpiredModal(true);
      }
    };

    // Check immediately
    checkTokenExpiry();

    // Check every minute
    const interval = setInterval(checkTokenExpiry, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    sessionStorage.removeItem("admin_token");
    localStorage.removeItem("tenant_id");
    sessionStorage.removeItem("tenant_id");
    localStorage.removeItem("role");
    sessionStorage.removeItem("role");
    window.location.href = "/login";
  };

  const handleExpiredConfirm = () => {
    setShowExpiredModal(false);
    handleLogout();
  };

  const menuItems = [
    {
      href: "/dashboard-tenant",
      icon: ChartBarIcon,
      label: "Dashboard",
      desc: "Ringkasan & Analytics",
    },
    {
      href: "/upload",
      icon: CloudArrowUpIcon,
      label: "Konten",
      desc: "Upload Media",
    },
    {
      href: "/playlist",
      icon: ListBulletIcon,
      label: "Playlist",
      desc: "Atur Jadwal Tayang",
    },
    {
      href: "/layouts",
      icon: Squares2X2Icon,
      label: "Layout",
      desc: "Template & Builder",
    },
    {
      href: "/devices",
      icon: ComputerDesktopIcon,
      label: "Perangkat",
      desc: "Monitor TV/Display",
    },
    //{
    //href: "/payment",
    //icon: CreditCardIcon,
    //label: "Pembayaran",
    //desc: "Riwayat & Status",
    //},
    //{
    //href: "/upgrade",
    //icon: ArrowUpCircleIcon,
    //label: "Upgrade",
    //desc: "Tingkatkan Paket",
    //},
  ];

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
      >
        {sidebarOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <Bars3Icon className="h-6 w-6" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed md:sticky md:top-0 z-40 w-80 h-screen bg-white/95 backdrop-blur-sm shadow-2xl transition-transform duration-200 ease-out flex flex-col overflow-y-auto`}
      >
        {/* Logo & Tenant Info */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg overflow-hidden bg-white/0">
              <img
                src="/admin/Wisse_logo1.png"
                alt="Wisse Logo"
                className="w-8 h-8 object-contain"
              />
            </div>
            <div>
              <h1 className="font-bold text-xl text-gray-800">Wisse Signage</h1>
              <p className="text-sm text-gray-500">Digital Signage Platform</p>
            </div>
          </div>
          {tenant && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold shadow">
                  {tenant.name?.[0] || "T"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">
                    {tenant.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {tenant.User?.email || tenant.email}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  if (navigating || isActive) return;

                  // Add visual feedback immediately
                  setNavigating(true);

                  // Close mobile sidebar first with slight delay
                  if (sidebarOpen) {
                    setSidebarOpen(false);
                  }

                  // Navigate with gentle delay for smooth transition
                  setTimeout(() => {
                    navigate(item.href);
                    setTimeout(() => setNavigating(false), 300);
                  }, 150);
                }}
                disabled={navigating || isActive}
                className={`w-full group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ease-in-out ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
                    : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                } ${
                  navigating && !isActive
                    ? "opacity-50 scale-95 pointer-events-none"
                    : ""
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-colors duration-200 ${
                    isActive
                      ? "text-white"
                      : "text-gray-400 group-hover:text-blue-500"
                  }`}
                />
                <div className="flex-1">
                  <div
                    className={`font-semibold transition-colors duration-200 ${
                      isActive ? "text-white" : ""
                    }`}
                  >
                    {item.label}
                  </div>
                  <div
                    className={`text-xs transition-colors duration-200 ${
                      isActive ? "text-blue-100" : "text-gray-400"
                    }`}
                  >
                    {item.desc}
                  </div>
                </div>
                {navigating && !isActive && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Actions */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="hidden md:block">
                <h2 className="text-xl font-bold text-gray-800">
                  Welcome Back!
                </h2>
                <p className="text-sm text-gray-500">
                  Manage your digital signage content
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Online
              </div>
              {tenant && (
                <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1">
                  <div className="w-6 h-6 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {tenant.name?.[0] || "T"}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {tenant.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6">{children}</div>
      </main>

      {/* Expired/Suspended Modal */}
      <ExpiredModal
        isOpen={showExpiredModal}
        message={expiredMessage}
        onConfirm={handleExpiredConfirm}
      />
    </div>
  );
}
