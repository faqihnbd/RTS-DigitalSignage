import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";
import logger from "../utils/logger";
const API_URL = import.meta.env.VITE_API_URL;

export default function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  const fetchPayments = () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    fetch(`${API_URL}/api/payments`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => {
        const paymentsArray = Array.isArray(data) ? data : [];
        // Sort by date descending by default
        const sortedPayments = paymentsArray.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setPayments(sortedPayments);
      })
      .catch((err) => {
        logger.logApiError("/api/payments", err);
        setError(err.message);
        setPayments([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Filter & search function
  const getFilteredPayments = () => {
    let filtered = payments;

    // Text search
    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.Tenant?.name?.toLowerCase().includes(search.toLowerCase()) ||
          p.Package?.name?.toLowerCase().includes(search.toLowerCase()) ||
          p.invoice_number?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus) {
      filtered = filtered.filter((p) => p.status === filterStatus);
    }

    // Date range filter
    if (dateRange.startDate || dateRange.endDate) {
      filtered = filtered.filter((p) => {
        const paymentDate = new Date(p.created_at);
        const start = dateRange.startDate
          ? new Date(dateRange.startDate)
          : null;
        const end = dateRange.endDate ? new Date(dateRange.endDate) : null;

        if (start && end) {
          return paymentDate >= start && paymentDate <= end;
        } else if (start) {
          return paymentDate >= start;
        } else if (end) {
          return paymentDate <= end;
        }
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case "tenant_name":
          aVal = a.Tenant?.name || "";
          bVal = b.Tenant?.name || "";
          break;
        case "amount":
          aVal = parseFloat(a.amount || 0);
          bVal = parseFloat(b.amount || 0);
          break;
        case "status":
          aVal = a.status || "";
          bVal = b.status || "";
          break;
        default:
          aVal = new Date(a.created_at);
          bVal = new Date(b.created_at);
      }

      if (sortDir === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  };

  const filtered = getFilteredPayments();

  // Export Excel
  const handleExportExcel = () => {
    const data = filtered.map((p) => ({
      Tanggal: new Date(p.created_at).toLocaleDateString("id-ID"),
      Invoice: p.invoice_number || "-",
      Tenant: p.Tenant?.name || "-",
      Paket: p.Package?.name || "-",
      Jumlah: `Rp ${Math.floor(parseFloat(p.amount || 0)).toLocaleString(
        "id-ID"
      )}`,
      Metode: p.payment_method || "-",
      Status:
        p.status === "paid"
          ? "Lunas"
          : p.status === "pending"
          ? "Pending"
          : "Gagal",
      "Tanggal Bayar": p.paid_at
        ? new Date(p.paid_at).toLocaleDateString("id-ID")
        : "-",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "History Pembayaran");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([excelBuffer], { type: "application/octet-stream" }),
      "history-pembayaran.xlsx"
    );
  };

  // Export PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("History Pembayaran Tenant", 14, 14);
    doc.autoTable({
      head: [["Tanggal", "Tenant", "Paket", "Jumlah", "Status"]],
      body: filtered.map((p) => [
        new Date(p.created_at).toLocaleDateString("id-ID"),
        p.Tenant?.name || "-",
        p.Package?.name || "-",
        `Rp ${Math.floor(parseFloat(p.amount || 0)).toLocaleString("id-ID")}`,
        p.status === "paid"
          ? "Lunas"
          : p.status === "pending"
          ? "Pending"
          : "Gagal",
      ]),
      startY: 22,
    });
    doc.save("history-pembayaran.pdf");
  };

  // Calculate statistics
  const stats = {
    total: filtered.length,
    paid: filtered.filter((p) => p.status === "paid").length,
    pending: filtered.filter((p) => p.status === "pending").length,
    failed: filtered.filter((p) => p.status === "failed").length,
    totalRevenue: filtered
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">History Pembayaran Tenant</h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-lg font-semibold text-gray-800">
            Total Transaksi
          </div>
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-lg font-semibold text-gray-800">Lunas</div>
          <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-lg font-semibold text-gray-800">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">
            {stats.pending}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-lg font-semibold text-gray-800">Gagal</div>
          <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-lg font-semibold text-gray-800">
            Total Revenue
          </div>
          <div className="text-xl font-bold text-purple-600">
            Rp {Math.floor(stats.totalRevenue).toLocaleString("id-ID")}
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={handleExportExcel}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
        >
          📊 Export Excel
        </button>
        <button
          onClick={handleExportPDF}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center gap-2"
        >
          📄 Export PDF
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <input
            className="border px-3 py-2 rounded"
            placeholder="Cari tenant/invoice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border px-3 py-2 rounded"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="paid">Lunas</option>
            <option value="pending">Pending</option>
            <option value="failed">Gagal</option>
          </select>
          <input
            type="date"
            className="border px-3 py-2 rounded"
            placeholder="Tanggal Mulai"
            value={dateRange.startDate}
            onChange={(e) =>
              setDateRange({ ...dateRange, startDate: e.target.value })
            }
          />
          <input
            type="date"
            className="border px-3 py-2 rounded"
            placeholder="Tanggal Akhir"
            value={dateRange.endDate}
            onChange={(e) =>
              setDateRange({ ...dateRange, endDate: e.target.value })
            }
          />
          <select
            className="border px-3 py-2 rounded"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="created_at">Tanggal</option>
            <option value="tenant_name">Tenant</option>
            <option value="amount">Jumlah</option>
            <option value="status">Status</option>
          </select>
          <select
            className="border px-3 py-2 rounded"
            value={sortDir}
            onChange={(e) => setSortDir(e.target.value)}
          >
            <option value="desc">Terbaru</option>
            <option value="asc">Terlama</option>
          </select>
        </div>
      </div>

      {/* Payment History Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-500">Loading history pembayaran...</div>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-red-500">{error}</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jumlah
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Metode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tgl Bayar
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      Tidak ada data pembayaran
                    </td>
                  </tr>
                ) : (
                  filtered.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(payment.created_at).toLocaleDateString(
                          "id-ID"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {payment.invoice_number || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.Tenant?.name || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.Package?.name || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Rp{" "}
                        {Math.floor(
                          parseFloat(payment.amount || 0)
                        ).toLocaleString("id-ID")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.payment_method || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            payment.status === "paid"
                              ? "bg-green-100 text-green-800"
                              : payment.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {payment.status === "paid"
                            ? "Lunas"
                            : payment.status === "pending"
                            ? "Pending"
                            : "Gagal"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.paid_at
                          ? new Date(payment.paid_at).toLocaleDateString(
                              "id-ID"
                            )
                          : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
