import { useState, useEffect } from "react";
import StorageService from "../services/StorageService";
import logger from "../utils/logger";

const AuthScreen = ({
  onAuthentication,
  authError,
  isAuthenticating,
  deviceId: initialDeviceId,
  onClearError,
}) => {
  const [deviceId, setDeviceId] = useState(initialDeviceId || "");
  const [licenseKey, setLicenseKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showLicenseInUseModal, setShowLicenseInUseModal] = useState(false);
  const [previousAuthError, setPreviousAuthError] = useState(null);

  // Check if authError is about license in use - only show modal when error CHANGES (new error)
  useEffect(() => {
    // Only show modal if error changed from previous state (not on initial mount with existing error)
    if (authError && authError !== previousAuthError) {
      if (authError.includes("🔒") || authError.includes("sedang digunakan")) {
        setShowLicenseInUseModal(true);
      }
      setPreviousAuthError(authError);
    } else if (!authError && previousAuthError) {
      // Reset previous error when error is cleared
      setPreviousAuthError(null);
    }
  }, [authError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!deviceId.trim()) {
      return;
    }
    if (!licenseKey.trim()) {
      return;
    }

    // Clear previous error before new authentication attempt
    if (onClearError) {
      onClearError();
    }

    logger.logDevice("Authentication Attempt", { deviceId });
    await onAuthentication(deviceId, licenseKey);
  };

  const handleModalOkClick = async () => {
    setShowLicenseInUseModal(false);

    try {
      // Clear all browser storage
      const storage = new StorageService();

      // Clear IndexedDB (localforage)
      await storage.clearCache();

      // Clear localStorage
      localStorage.clear();

      // Clear sessionStorage
      sessionStorage.clear();

      // Clear cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      // Reload page to fresh state
      window.location.reload();
    } catch (error) {
      console.error("[DEBUG] Error clearing storage:", error);
      // Reload anyway
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Image with Blur */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("/display/bg-login2.png")',
        }}
      >
        <div className="absolute inset-0 backdrop-blur-sm bg-black/20"></div>
      </div>

      {/* Auth Card */}
      <div className="relative w-full max-w-xs">
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-600 rounded-2xl blur-xl opacity-30 scale-105"></div>

        {/* Main Card */}
        <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-2xl">
          {/* Logo/Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-white rounded-2xl mx-auto mb-3 flex items-center justify-center overflow-hidden">
              <img
                src="/display/Wisse_logo1.png"
                alt="Wisse Logo"
                className="w-7 h-7 object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">
              Wisse Digital Signage
            </h1>
            <p className="text-sm text-blue-200/80">
              Connect your display device
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Device ID Input */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-blue-100">
                Device ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-blue-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  placeholder="TV001, DISPLAY-LOBBY, etc."
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm placeholder-blue-200/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* License Key Input */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-blue-100">
                License Key
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-blue-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  placeholder="Enter your license key"
                  className="w-full pl-10 pr-12 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm placeholder-blue-200/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-300 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message - Only show for non-license-in-use errors */}
            {authError &&
              !authError.includes("🔒") &&
              !authError.includes("sedang digunakan") && (
                <div className="border rounded-xl p-4 bg-red-500/20 border-red-500/50">
                  <div className="flex items-start space-x-2">
                    <svg
                      className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="text-red-200 text-sm">{authError}</p>
                    </div>
                  </div>
                </div>
              )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                isAuthenticating || !deviceId.trim() || !licenseKey.trim()
              }
              className="w-full bg-blue-500 text-white font-semibold py-2 px-5 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed shadow-lg text-sm"
            >
              {isAuthenticating ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Connecting...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span>Activate Device</span>
                </div>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-white/10 space-y-3">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <svg
                  className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-blue-200/80 text-xs">
                  🔐 <strong>Penting:</strong> Setiap license hanya dapat
                  digunakan untuk <strong>1 sesi aktif</strong>. Tidak dapat
                  digunakan di 2 browser atau perangkat secara bersamaan.
                </p>
              </div>
            </div>
            <p className="text-center text-blue-200/60 text-xs">
              Need help? Contact your system administrator
            </p>
          </div>
        </div>
      </div>

      {/* License In Use Modal */}
      {showLicenseInUseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md">
            {/* Glow Effect for Modal */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl blur-xl opacity-30 scale-105"></div>

            {/* Modal Card */}
            <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
              {/* Icon */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>

                <h2 className="text-2xl font-bold text-white mb-3">
                  License Sedang Digunakan
                </h2>

                <div className="space-y-3">
                  <p className="text-orange-200 text-base leading-relaxed">
                    License ini sedang digunakan di browser/aplikasi lain.
                    Setiap license hanya dapat digunakan untuk{" "}
                    <strong>1 sesi aktif</strong>.
                  </p>

                  <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-4">
                    <p className="text-orange-100 text-sm">
                      Anda akan dialihkan ke halaman registrasi untuk mencoba
                      lagi.
                    </p>
                  </div>
                </div>
              </div>

              {/* OK Button */}
              <button
                onClick={handleModalOkClick}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
              >
                <div className="flex items-center justify-center space-x-2">
                  <span>OK, Mengerti</span>
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthScreen;
