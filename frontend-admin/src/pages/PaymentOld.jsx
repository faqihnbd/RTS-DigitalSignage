import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import {
  CreditCardIcon,
  BanknotesIcon,
  CheckBadgeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  PlusIcon,
  EyeIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { useNotification } from "../components/NotificationProvider";

export default function Payment() {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
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
        // Separate paid/pending payments from unpaid invoices
        const paidPayments = data.filter(
          (p) =>
            p.status === "paid" ||
            p.status === "pending" ||
            p.status === "failed"
        );
        const unpaidInvoices = data.filter((p) => p.status === "pending");

        setPayments(paidPayments);
        setInvoices(unpaidInvoices);
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
      case "unpaid":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "overdue":
        return "text-red-600 bg-red-50 border-red-200";
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
      case "unpaid":
        return DocumentTextIcon;
      case "overdue":
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

  const totalPaid = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalUnpaid = invoices
    .filter((i) => i.status === "unpaid" || i.status === "overdue")
    .reduce((sum, i) => sum + i.amount, 0);

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
                  {formatCurrency(totalPaid)}
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
                  {formatCurrency(totalPending)}
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
                  {formatCurrency(totalUnpaid)}
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
                  {payments.length + invoices.length}
                </p>
                <p className="text-sm text-gray-600">Total Transaksi</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab("payments")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "payments"
                    ? "border-pink-500 text-pink-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <BanknotesIcon className="h-5 w-5" />
                  <span>Riwayat Pembayaran</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("invoices")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "invoices"
                    ? "border-pink-500 text-pink-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="h-5 w-5" />
                  <span>Invoice & Tagihan</span>
                </div>
              </button>
            </nav>
          </div>

          <div className="p-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                <span className="ml-3 text-gray-600">Memuat data...</span>
              </div>
            ) : activeTab === "payments" ? (
              /* Payment History */
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">
                    Riwayat Pembayaran
                  </h2>
                  <button className="flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition-all">
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">Export</span>
                  </button>
                </div>

                {payments.length === 0 ? (
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
                                  {payment.invoice}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {payment.description}
                                </p>
                                <div className="flex items-center gap-4 mt-2">
                                  <span className="text-sm text-gray-500">
                                    {new Date(payment.date).toLocaleDateString(
                                      "id-ID"
                                    )}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    •
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    {payment.method}
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
            ) : (
              /* Invoices */
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">
                    Invoice & Tagihan
                  </h2>
                  <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 transition-all">
                    <PlusIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">Buat Invoice</span>
                  </button>
                </div>

                {invoices.length === 0 ? (
                  <div className="text-center py-12">
                    <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Belum ada invoice</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invoices.map((invoice) => {
                      const StatusIcon = getStatusIcon(invoice.status);
                      return (
                        <div
                          key={invoice.id}
                          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-gray-50 rounded-lg">
                                <StatusIcon className="h-6 w-6 text-gray-600" />
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-800">
                                  {invoice.number}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {invoice.package}
                                </p>
                                <div className="flex items-center gap-4 mt-2">
                                  <span className="text-sm text-gray-500">
                                    Due:{" "}
                                    {new Date(
                                      invoice.dueDate
                                    ).toLocaleDateString("id-ID")}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    •
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    {invoice.items.length} item(s)
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-gray-800">
                                {formatCurrency(invoice.amount)}
                              </p>
                              <div
                                className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                  invoice.status
                                )} mb-2`}
                              >
                                {invoice.status === "unpaid"
                                  ? "Belum Bayar"
                                  : invoice.status === "overdue"
                                  ? "Jatuh Tempo"
                                  : invoice.status.charAt(0).toUpperCase() +
                                    invoice.status.slice(1)}
                              </div>
                              <div className="flex gap-2">
                                <button className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-all">
                                  <EyeIcon className="h-4 w-4" />
                                </button>
                                <button className="p-1 text-green-500 hover:bg-green-50 rounded transition-all">
                                  <CreditCardIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
