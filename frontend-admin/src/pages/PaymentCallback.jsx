import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const PaymentCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const statusCode = urlParams.get("status_code");
    const transactionStatus = urlParams.get("transaction_status");
    const orderId = urlParams.get("order_id");

    console.log("Payment callback params:", {
      statusCode,
      transactionStatus,
      orderId,
    });

    // Determine payment status based on parameters
    if (transactionStatus === "settlement" || transactionStatus === "capture") {
      setStatus("success");
      setMessage("Pembayaran berhasil! Package Anda telah diaktifkan.");
    } else if (transactionStatus === "pending") {
      setStatus("pending");
      setMessage("Pembayaran sedang diproses. Silakan tunggu konfirmasi.");
    } else if (
      transactionStatus === "deny" ||
      transactionStatus === "cancel" ||
      transactionStatus === "expire"
    ) {
      setStatus("error");
      setMessage("Pembayaran gagal atau dibatalkan. Silakan coba lagi.");
    } else {
      setStatus("error");
      setMessage("Status pembayaran tidak diketahui.");
    }

    // Auto redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate("/admin/payment");
    }, 5000);

    return () => clearTimeout(timer);
  }, [location, navigate]);

  const getIcon = () => {
    switch (status) {
      case "success":
        return (
          <CheckBadgeIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
        );
      case "pending":
        return <ClockIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />;
      case "error":
        return (
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
        );
      default:
        return (
          <div className="h-16 w-16 mx-auto mb-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          </div>
        );
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "success":
        return "bg-green-50 border-green-200";
      case "pending":
        return "bg-yellow-50 border-yellow-200";
      case "error":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div
        className={`max-w-md w-full rounded-xl shadow-xl border-2 p-8 text-center ${getStatusColor()}`}
      >
        {getIcon()}

        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          {status === "loading" && "Memproses..."}
          {status === "success" && "Pembayaran Berhasil!"}
          {status === "pending" && "Pembayaran Sedang Diproses"}
          {status === "error" && "Pembayaran Gagal"}
        </h1>

        <p className="text-gray-600 mb-6">{message}</p>

        <div className="space-y-3">
          <button
            onClick={() => navigate("/admin/payment")}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Kembali ke Halaman Pembayaran
          </button>

          <button
            onClick={() => navigate("/admin/dashboard")}
            className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            Ke Dashboard
          </button>
        </div>

        {status === "loading" && (
          <p className="text-sm text-gray-500 mt-4">
            Anda akan diarahkan otomatis dalam 5 detik...
          </p>
        )}
      </div>
    </div>
  );
};

export default PaymentCallback;
