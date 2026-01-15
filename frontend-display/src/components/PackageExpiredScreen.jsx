import React from "react";

const PackageExpiredScreen = ({ message, onBackToAuth }) => {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-red-900 via-red-800 to-orange-900">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-2000"></div>
      </div>

      {/* Warning Card - Wider Layout */}
      <div className="relative max-w-5xl mx-auto px-6 w-full">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 text-center border-4 border-red-500">
          {/* Flex Container for Icon and Text Side by Side */}
          <div className="flex items-center gap-8 mb-6">
            {/* Warning Icon */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                <svg
                  className="w-14 h-14 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            {/* Title and Message */}
            <div className="flex-1 text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Paket Telah Habis
              </h1>
              <p className="text-base text-gray-700">
                {message ||
                  "Durasi paket telah habis. Silakan hubungi administrator untuk memperpanjang paket."}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-gray-200 my-6"></div>

          {/* Two Column Layout for Contact and Instructions */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Contact Information */}
            <div className="bg-red-50 rounded-xl p-5">
              <h3 className="text-base font-semibold text-red-900 mb-2">
                📞 Hubungi Administrator
              </h3>
              <p className="text-sm text-gray-700">
                Untuk memperpanjang paket layanan, silakan hubungi administrator
                sistem atau tim support.
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                📋 Langkah Selanjutnya
              </h3>
              <div className="space-y-2 text-left">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <p className="text-sm text-gray-700 pt-0.5">
                    Hubungi administrator untuk memperpanjang paket layanan
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <p className="text-sm text-gray-700 pt-0.5">
                    Tunggu hingga administrator memperbarui paket Anda
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <p className="text-sm text-gray-700 pt-0.5">
                    Refresh halaman atau login ulang setelah paket diperpanjang
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Back to Auth Button */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={onBackToAuth}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-lg transition-colors duration-200 flex items-center gap-2"
            >
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Kembali ke Login
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Wisse Digital Signage System
            </p>
          </div>
        </div>

        {/* Pulsing effect around card */}
        <div className="absolute inset-0 -z-10 rounded-3xl bg-red-500 opacity-20 blur-2xl animate-pulse"></div>
      </div>
    </div>
  );
};

export default PackageExpiredScreen;
