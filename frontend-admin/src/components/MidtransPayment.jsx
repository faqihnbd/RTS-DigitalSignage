import React, { useState } from "react";
import { useNotification } from "./NotificationProvider";

const MidtransPayment = ({ packageData, onSuccess, onError, onPending }) => {
  const [loading, setLoading] = useState(false);
  const { success, error } = useNotification();

  const createMidtransPayment = async () => {
    if (!packageData) {
      error("Package data tidak tersedia");
      return;
    }

    setLoading(true);

    try {
      const token =
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("admin_token");

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/payments/midtrans`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            package_id: packageData.id,
            amount: packageData.price,
            description: `Payment for ${packageData.name} package`,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create payment");
      }

      const paymentData = await response.json();

      // Load Midtrans Snap script if not already loaded
      if (!window.snap) {
        const script = document.createElement("script");
        script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
        script.setAttribute(
          "data-client-key",
          "SB-Mid-client-8kYYBKZaVQgNnLXP"
        );
        script.onload = () => {
          proceedWithPayment(paymentData.token, paymentData.order_id);
        };
        script.onerror = () => {
          error("Failed to load Midtrans payment gateway");
          setLoading(false);
        };
        document.head.appendChild(script);
      } else {
        proceedWithPayment(paymentData.token, paymentData.order_id);
      }
    } catch (err) {
      console.error("Midtrans payment error:", err);
      error(err.message || "Terjadi kesalahan saat memproses pembayaran");
      setLoading(false);
    }
  };

  const proceedWithPayment = (token, orderId) => {
    window.snap.pay(token, {
      onSuccess: function (result) {
        console.log("Payment success:", result);
        success("Pembayaran berhasil!");
        setLoading(false);
        if (onSuccess) onSuccess(result);
      },
      onPending: function (result) {
        console.log("Payment pending:", result);
        success("Pembayaran sedang diproses. Silakan tunggu konfirmasi.");
        setLoading(false);
        if (onPending) onPending(result);
      },
      onError: function (result) {
        console.log("Payment error:", result);
        error("Pembayaran gagal. Silakan coba lagi.");
        setLoading(false);
        if (onError) onError(result);
      },
      onClose: function () {
        console.log("Payment popup closed");
        setLoading(false);
      },
    });
  };

  const checkPaymentStatus = async (orderId) => {
    try {
      const token =
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("admin_token");

      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/payments/midtrans/status/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (err) {
      console.error("Check payment status error:", err);
    }
    return null;
  };

  if (!packageData) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-500">Package information not available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-2">
          Pembayaran Package: {packageData.name}
        </h3>
        <div className="text-3xl font-bold text-blue-600 mb-4">
          {new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
          }).format(packageData.price)}
        </div>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• Kapasitas: {packageData.max_devices} device</p>
          <p>• Storage: {packageData.storage_limit} GB</p>
          <p>• Durasi: 30 hari</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span className="font-medium text-blue-800">
              Metode Pembayaran Tersedia:
            </span>
          </div>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• Transfer Bank (BCA, BNI, BRI, Mandiri)</p>
            <p>• E-Wallet (GoPay, OVO, DANA, LinkAja)</p>
            <p>• Virtual Account</p>
            <p>• Kartu Kredit/Debit</p>
          </div>
        </div>

        <button
          onClick={createMidtransPayment}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Memproses...</span>
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              <span>Bayar Sekarang</span>
            </>
          )}
        </button>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Pembayaran diproses dengan aman oleh Midtrans
          </p>
        </div>
      </div>
    </div>
  );
};

export default MidtransPayment;
