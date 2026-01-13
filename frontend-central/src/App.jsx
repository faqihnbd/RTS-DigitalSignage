import ExportLaporan from "./pages/ExportLaporan";
import AuditLog from "./pages/AuditLog";
import NotificationCenter from "./pages/NotificationCenter";
import DashboardRingkasan from "./pages/DashboardRingkasan";
import UserTenantManagement from "./pages/UserTenantManagement";
import React, { useState, useRef, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import TenantManagement from "./pages/TenantManagement";
import StatistikGlobal from "./pages/StatistikGlobal";
import PaymentMonitoring from "./pages/PaymentMonitoring";
import UserManagement from "./pages/UserManagement";
import Notification from "./components/Notification";

function Dashboard() {
  const [stats, setStats] = React.useState({
    totalTenants: 0,
    activeTenants: 0,
    suspendedTenants: 0,
    totalDevices: 0,
    onlineDevices: 0,
    totalPayments: 0,
    paidPayments: 0,
    pendingPayments: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = React.useState(true);
  const [tenants, setTenants] = React.useState([]);

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");

      // Fetch tenants
      const tenantsRes = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tenants`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const tenantsData = await tenantsRes.json();
      setTenants(Array.isArray(tenantsData) ? tenantsData : []);

      // Fetch payments for revenue calculation
      const paymentsRes = await fetch(
        `${import.meta.env.VITE_API_URL}/api/payments`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const paymentsData = await paymentsRes.json();
      const payments = Array.isArray(paymentsData) ? paymentsData : [];

      // Calculate stats
      const activeTenants = tenantsData.filter(
        (t) => t.status === "active"
      ).length;
      const suspendedTenants = tenantsData.filter(
        (t) => t.suspended || t.status === "suspended"
      ).length;
      const paidPayments = payments.filter((p) => p.status === "paid").length;
      const pendingPayments = payments.filter(
        (p) => p.status === "pending"
      ).length;
      const totalRevenue = payments
        .filter((p) => p.status === "paid")
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      setStats({
        totalTenants: tenantsData.length,
        activeTenants,
        suspendedTenants,
        totalDevices: 0, // Will be updated if needed
        onlineDevices: 0, // Will be updated if needed
        totalPayments: payments.length,
        paidPayments,
        pendingPayments,
        totalRevenue,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-2xl font-semibold mb-4">Dashboard Central</div>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="text-2xl font-semibold mb-6">Dashboard Central</div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800">
                Total Tenant
              </h3>
              <p className="text-3xl font-bold text-blue-600">
                {stats.totalTenants}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.activeTenants} aktif, {stats.suspendedTenants} suspended
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800">
                Total Pembayaran
              </h3>
              <p className="text-3xl font-bold text-green-600">
                {stats.totalPayments}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.paidPayments} lunas, {stats.pendingPayments} pending
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💳</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800">
                Total Revenue
              </h3>
              <p className="text-3xl font-bold text-purple-600">
                Rp {Math.floor(stats.totalRevenue).toLocaleString("id-ID")}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Dari pembayaran yang lunas
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800">
                Statistik Global
              </h3>
              <p className="text-3xl font-bold text-indigo-600">📊</p>
              <p className="text-sm text-gray-500 mt-1">Analisis mendalam</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tenants Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Tenant Terbaru
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal Dibuat
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tenants.slice(0, 5).map((tenant) => (
                <tr key={tenant.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {tenant.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{tenant.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        tenant.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {tenant.status === "active" ? "Aktif" : "Suspended"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(tenant.created_at).toLocaleDateString("id-ID")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notif, setNotif] = useState({
    show: false,
    type: "info",
    message: "",
  });
  const dropdownRef = useRef(null);

  // Fungsi global untuk menampilkan notifikasi
  const showNotif = (type, message, duration = 3000) => {
    setNotif({ show: true, type, message, duration });
  };

  const handleLogin = (token, user) => {
    setToken(token);
    setUser(user);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    showNotif("success", "Login berhasil!");
  };
  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    showNotif("success", "Logout berhasil!");
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!token || !user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <Notification
        type={notif.type}
        message={notif.message}
        show={notif.show}
        duration={notif.duration}
        onClose={() => setNotif({ ...notif, show: false })}
      />
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col ml-60">
          <Layout user={user} onLogout={handleLogout}>
            {/* Untuk menampilkan notifikasi dari halaman lain, showNotif bisa diteruskan via props */}
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route
                path="/tenants"
                element={<TenantManagement showNotif={showNotif} />}
              />
              <Route
                path="/stats"
                element={<StatistikGlobal showNotif={showNotif} />}
              />
              <Route
                path="/payments"
                element={<PaymentMonitoring showNotif={showNotif} />}
              />
              <Route
                path="/export"
                element={<ExportLaporan showNotif={showNotif} />}
              />
              <Route
                path="/audit"
                element={<AuditLog showNotif={showNotif} />}
              />
              <Route
                path="/notifications"
                element={<NotificationCenter showNotif={showNotif} />}
              />
              <Route
                path="/summary"
                element={<DashboardRingkasan showNotif={showNotif} />}
              />
              <Route
                path="/user-tenant"
                element={<UserTenantManagement showNotif={showNotif} />}
              />
              <Route
                path="/users"
                element={<UserManagement showNotif={showNotif} />}
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Layout>
        </div>
      </div>
    </BrowserRouter>
  );
}
