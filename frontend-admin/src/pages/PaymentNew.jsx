import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import {
  CreditCardIcon,
  BanknotesIcon,
  CheckBadgeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ChartBarIcon,
  PlusIcon,
  EyeIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { useNotification } from "../components/NotificationProvider";

export default function Payment() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("payments");
  const [stats, setStats] = useState({
    totalPaid: 0,
    totalPending: 0,
    totalUnpaid: 0,
    totalTransactions: 0,
  });
  const { success, error: showError } = useNotification();

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const token =
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("admin_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/payments`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (err) {
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token =
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("admin_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/payments/stats`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Error fetching payment stats:", err);
    }
  };

  const createPayment = async (packageData) => {
    try {
      const token =
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("admin_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/payments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            package_id: packageData.id,
            amount: packageData.price,
            payment_method: "manual",
            description: `Payment for ${packageData.name} package`,
          }),
        }
      );

      if (response.ok) {
        fetchPayments();
        fetchStats();
        success("Payment invoice created successfully!");
      } else {
        const error = await response.json();
        showError(`Failed to create payment: ${error.message}`);
      }
    } catch (err) {
      showError("Network error occurred");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "text-green-600 bg-green-50 border-green-200";
      case "pending":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "failed":
        return "text-red-600 bg-red-50 border-red-200";
      case "expired":
        return "text-gray-600 bg-gray-50 border-gray-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "paid":
        return CheckBadgeIcon;
      case "pending":
        return ClockIcon;
      case "failed":
        return ExclamationTriangleIcon;
      case "expired":
        return ExclamationTriangleIcon;
      default:
        return DocumentTextIcon;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-tr from-pink-500 to-rose-600 rounded-xl shadow-lg">
            <CreditCardIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Payment Center</h1>
            <p className="text-gray-600">Kelola pembayaran dan invoice Anda</p>
          </div>
        </div>

        {/* Payment Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckBadgeIcon className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-800">
                  {formatCurrency(stats.totalPaid)}
                </p>
                <p className="text-sm text-gray-600">Total Terbayar</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <ClockIcon className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-800">
                  {formatCurrency(stats.totalPending)}
                </p>
                <p className="text-sm text-gray-600">Menunggu</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-800">
                  {formatCurrency(stats.totalUnpaid)}
                </p>
                <p className="text-sm text-gray-600">Belum Bayar</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-800">
                  {stats.totalTransactions}
                </p>
                <p className="text-sm text-gray-600">Total Transaksi</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BanknotesIcon className="h-6 w-6 text-pink-600" />
              <h2 className="text-xl font-bold text-gray-800">
                Riwayat Pembayaran
              </h2>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition-all">
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Export</span>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
              <span className="ml-3 text-gray-600">Memuat data...</span>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCardIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                Belum ada riwayat pembayaran
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => {
                const StatusIcon = getStatusIcon(payment.status);
                return (
                  <div
                    key={payment.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <StatusIcon className="h-6 w-6 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800">
                            {payment.invoice_number || `INV-${payment.id}`}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {payment.description || "Package payment"}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm text-gray-500">
                              {new Date(payment.created_at).toLocaleDateString(
                                "id-ID"
                              )}
                            </span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500 capitalize">
                              {payment.payment_method?.replace("_", " ") ||
                                "Manual"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-800">
                          {formatCurrency(payment.amount)}
                        </p>
                        <div
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            payment.status
                          )}`}
                        >
                          {payment.status.charAt(0).toUpperCase() +
                            payment.status.slice(1)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
