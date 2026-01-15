// Extend Package Modal Component untuk TenantManagement
import React, { useState } from "react";

const ExtendPackageModal = ({ tenant, onExtend, onClose, loading }) => {
  const [months, setMonths] = useState(1);

  const handleSubmit = () => {
    if (months && months >= 1) {
      onExtend(tenant.id, months);
    }
  };

  // Calculate days until expiry
  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysUntilExpiry(tenant.expired_at);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          🔄 Perpanjang Paket Tenant
        </h3>

        {/* Tenant Info */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-600">Tenant:</div>
            <div className="font-semibold text-gray-800">{tenant.name}</div>

            <div className="text-gray-600">Email:</div>
            <div className="text-gray-800">{tenant.email}</div>

            <div className="text-gray-600">Status:</div>
            <div>
              {tenant.status === "expired" ? (
                <span className="px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded">
                  ⚠️ EXPIRED
                </span>
              ) : (
                <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded">
                  ✓ ACTIVE
                </span>
              )}
            </div>

            {tenant.expired_at && (
              <>
                <div className="text-gray-600">Expired At:</div>
                <div className="text-gray-800">
                  {new Date(tenant.expired_at).toLocaleDateString("id-ID")}
                  {daysRemaining !== null && (
                    <span
                      className={`ml-2 text-xs ${
                        daysRemaining < 0
                          ? "text-red-600"
                          : daysRemaining <= 7
                          ? "text-orange-600"
                          : "text-green-600"
                      }`}
                    >
                      {daysRemaining < 0
                        ? `(${Math.abs(daysRemaining)} hari lalu)`
                        : `(${daysRemaining} hari lagi)`}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Duration Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Durasi Perpanjangan (bulan):
          </label>
          <input
            type="number"
            min="1"
            value={months}
            onChange={(e) => setMonths(parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Masukkan jumlah bulan"
          />
          <p className="text-xs text-gray-500 mt-2">
            💡 Paket akan diperpanjang <strong>{months} bulan</strong> dari
            tanggal expiry saat ini
            {tenant.expired_at && (
              <> ({new Date(tenant.expired_at).toLocaleDateString("id-ID")})</>
            )}
            .
          </p>
        </div>

        {/* Calculation Preview */}
        {tenant.expired_at && months > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>📅 Expiry Baru:</strong>{" "}
              {(() => {
                const current = new Date(tenant.expired_at);
                const newDate = new Date(current);
                newDate.setMonth(newDate.getMonth() + months);
                return newDate.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                });
              })()}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition-colors"
            disabled={loading}
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !months || months < 1}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                Memproses...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>✓</span>
                Perpanjang Paket
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExtendPackageModal;
