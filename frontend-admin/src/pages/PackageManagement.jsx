import React, { useState, useEffect } from "react";
import {
  CubeIcon,
  CheckIcon,
  StarIcon,
  BoltIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { useNotification } from "../components/NotificationProvider";
import MidtransPayment from "../components/MidtransPayment";

export default function PackageManagement() {
  const [packages, setPackages] = useState([]);
  const [currentPackage, setCurrentPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPackageForUpgrade, setSelectedPackageForUpgrade] =
    useState(null);
  const [showMidtransPayment, setShowMidtransPayment] = useState(false);
  const { confirm, success, error: showError } = useNotification();

  useEffect(() => {
    fetchPackages();
    fetchCurrentPackage();
  }, []);

  const fetchPackages = async () => {
    try {
      const token =
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("admin_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/packages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPackages(data);
      }
    } catch (err) {
      console.error("Error fetching packages:", err);
      setError("Gagal memuat paket");
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

  const handleUpgrade = async (packageData) => {
    const isConfirmed = await confirm({
      title: "Upgrade Paket",
      message: `Apakah Anda yakin ingin upgrade ke paket ${packageData.name}?`,
      confirmText: "Ya, Lanjutkan ke Pembayaran",
      cancelText: "Batal",
      type: "warning",
    });

    if (!isConfirmed) return;

    // Set the selected package and show Midtrans payment
    setSelectedPackageForUpgrade(packageData);
    setShowMidtransPayment(true);
  };

  const handleMidtransSuccess = async (result) => {
    console.log("Midtrans payment success:", result);
    setShowMidtransPayment(false);
    setSelectedPackageForUpgrade(null);

    // Add delay to allow webhook processing
    setTimeout(async () => {
      try {
        // Check payment status to ensure it's processed
        const token =
          localStorage.getItem("admin_token") ||
          sessionStorage.getItem("admin_token");

        if (result.order_id) {
          const statusResponse = await fetch(
            `${
              import.meta.env.VITE_API_BASE_URL
            }/api/payments/midtrans/status/${result.order_id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log("Payment status check:", statusData);

            // If payment is confirmed as paid, trigger manual upgrade
            if (statusData.payment && statusData.payment.status === "paid") {
              await manualUpgradePackage(statusData.payment.package_id);
            }
          }
        }

        // Refresh current package data
        fetchCurrentPackage();
      } catch (error) {
        console.error("Error checking payment status:", error);
      }
    }, 2000); // 2 second delay

    success("Pembayaran berhasil! Package akan diaktifkan segera.");
  };

  const manualUpgradePackage = async (packageId) => {
    try {
      const token =
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("admin_token");

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/packages/upgrade`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ package_id: packageId }),
        }
      );

      if (response.ok) {
        console.log("Manual package upgrade successful");
        fetchCurrentPackage();
      } else {
        console.error("Manual package upgrade failed");
      }
    } catch (error) {
      console.error("Error during manual package upgrade:", error);
    }
  };

  const handleMidtransError = (result) => {
    console.log("Midtrans payment error:", result);
    showError("Pembayaran gagal. Silakan coba lagi.");
  };

  const handleMidtransPending = (result) => {
    console.log("Midtrans payment pending:", result);
    setShowMidtransPayment(false);
    setSelectedPackageForUpgrade(null);
    success("Pembayaran sedang diproses. Kami akan mengonfirmasi segera.");
  };

  const handleBackFromPayment = () => {
    setShowMidtransPayment(false);
    setSelectedPackageForUpgrade(null);
  };

  const getPackageIcon = (name) => {
    switch (name.toLowerCase()) {
      case "starter":
        return StarIcon;
      case "premium":
        return BoltIcon;
      case "business":
        return BuildingOfficeIcon;
      case "custom":
        return PhoneIcon;
      default:
        return CubeIcon;
    }
  };

  const getPackageColor = (name) => {
    switch (name.toLowerCase()) {
      case "starter":
        return "from-green-500 to-emerald-600";
      case "premium":
        return "from-blue-500 to-indigo-600";
      case "business":
        return "from-purple-500 to-violet-600";
      case "custom":
        return "from-orange-500 to-red-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const formatPrice = (price) => {
    if (price === 0) return "Hubungi Kami";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Memuat paket...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-xl shadow-lg">
          <CubeIcon className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Package Manager</h1>
          <p className="text-gray-600">Kelola paket dan upgrade akun Anda</p>
        </div>
      </div>

      {/* Current Package Info */}
      {currentPackage && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-xl">
              <CubeIcon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-blue-800">
                Paket Saat Ini: {currentPackage.name}
              </h3>
              <div className="grid grid-cols-3 gap-4 mt-2 text-sm text-blue-700">
                <div>
                  <span className="font-medium">Perangkat:</span>{" "}
                  {currentPackage.max_devices} unit
                </div>
                <div>
                  <span className="font-medium">Storage:</span>{" "}
                  {currentPackage.storage_gb} GB
                </div>
                <div>
                  <span className="font-medium">Harga:</span>{" "}
                  {formatPrice(currentPackage.price)}/bulan
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
          <span>{error}</span>
        </div>
      )}

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {packages.map((pkg) => {
          const PackageIcon = getPackageIcon(pkg.name);
          const isCurrentPackage = currentPackage?.id === pkg.id;
          const isCustom = pkg.name.toLowerCase() === "custom";

          return (
            <div
              key={pkg.id}
              className={`relative bg-white rounded-2xl shadow-xl border-2 overflow-hidden transition-all duration-200 hover:shadow-2xl ${
                isCurrentPackage
                  ? "border-blue-500 ring-2 ring-blue-200"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {isCurrentPackage && (
                <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                  Current
                </div>
              )}

              {/* Package Header */}
              <div
                className={`bg-gradient-to-r ${getPackageColor(
                  pkg.name
                )} p-6 text-white`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <PackageIcon className="h-8 w-8" />
                  <h3 className="text-xl font-bold">{pkg.name}</h3>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1">
                    {formatPrice(pkg.price)}
                  </div>
                  {!isCustom && (
                    <div className="text-sm opacity-90">per bulan</div>
                  )}
                </div>
              </div>

              {/* Package Features */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <CheckIcon className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">
                    {pkg.max_devices === 999 ? "Unlimited" : pkg.max_devices}{" "}
                    Perangkat
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckIcon className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">
                    {pkg.storage_gb === 999 ? "Unlimited" : pkg.storage_gb} GB
                    Storage
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckIcon className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Support 24/7</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckIcon className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Cloud Backup</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-6 pt-0">
                {isCurrentPackage ? (
                  <button
                    className="w-full py-3 bg-gray-100 text-gray-500 rounded-xl font-semibold cursor-not-allowed"
                    disabled
                  >
                    Paket Aktif
                  </button>
                ) : isCustom ? (
                  <a
                    href="mailto:runtostart@gmail.com?subject=Paket Custom - Digital Signage&body=Halo, saya ingin bertanya tentang paket custom untuk Digital Signage."
                    className="block w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white text-center rounded-xl font-semibold hover:from-orange-600 hover:to-red-700 transition-all"
                  >
                    Hubungi Kami
                  </a>
                ) : (
                  <button
                    onClick={() => handleUpgrade(pkg)}
                    disabled={upgrading}
                    className={`w-full py-3 bg-gradient-to-r ${getPackageColor(
                      pkg.name
                    )} text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50`}
                  >
                    {upgrading ? "Processing..." : "Upgrade"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          Informasi Tambahan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">
              Fitur yang Tersedia:
            </h4>
            <ul className="space-y-1">
              <li>• Manajemen konten video dan gambar</li>
              <li>• Penjadwalan otomatis</li>
              <li>• Monitoring real-time</li>
              <li>• Multi-device support</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">
              Metode Pembayaran:
            </h4>
            <ul className="space-y-1">
              <li>• Transfer Bank</li>
              <li>• E-Wallet (GoPay, OVO, Dana)</li>
              <li>• Virtual Account</li>
              <li>• Kartu Kredit/Debit</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Midtrans Payment Modal */}
      {showMidtransPayment && selectedPackageForUpgrade && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Upgrade ke {selectedPackageForUpgrade.name}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Lanjutkan pembayaran untuk mengaktifkan paket baru
                  </p>
                </div>
                <button
                  onClick={handleBackFromPayment}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-bold text-blue-800 mb-2">Detail Paket:</h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
                  <div>
                    <span className="font-medium">Nama:</span>{" "}
                    {selectedPackageForUpgrade.name}
                  </div>
                  <div>
                    <span className="font-medium">Harga:</span>{" "}
                    {formatPrice(selectedPackageForUpgrade.price)}
                  </div>
                  <div>
                    <span className="font-medium">Perangkat:</span>{" "}
                    {selectedPackageForUpgrade.max_devices} unit
                  </div>
                  <div>
                    <span className="font-medium">Storage:</span>{" "}
                    {selectedPackageForUpgrade.storage_gb} GB
                  </div>
                </div>
              </div>

              <MidtransPayment
                packageData={selectedPackageForUpgrade}
                onSuccess={handleMidtransSuccess}
                onError={handleMidtransError}
                onPending={handleMidtransPending}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
