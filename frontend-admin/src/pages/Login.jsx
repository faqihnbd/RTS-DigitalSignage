// Halaman Login Admin Tenant
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useNotification } from "../components/NotificationProvider";
import logger from "../utils/logger";

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { success, error: showError } = useNotification();

  // Load remembered credentials on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("remembered_email");
    const isRemembered = localStorage.getItem("remember_me") === "true";

    if (rememberedEmail && isRemembered) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }

    // Check if already logged in
    const token =
      localStorage.getItem("admin_token") ||
      sessionStorage.getItem("admin_token");
    if (token) {
      navigate("/dashboard-tenant");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    let valid = true;
    let fe = {};
    if (!validateEmail(email)) {
      fe.email = "Format email tidak valid.";
      valid = false;
    }
    if (!password || password.length < 6) {
      fe.password = "Password minimal 6 karakter.";
      valid = false;
    }
    setFieldError(fe);
    if (!valid) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );
      const data = await res.json();

      // Handle 403 Forbidden (suspended account)
      if (res.status === 403) {
        showError(data.message || "Akun Anda telah ditangguhkan.");
        setLoading(false);
        return;
      }

      if (res.ok && data.token && data.user) {
        if (data.user.role !== "tenant_admin") {
          showError(
            "Akses ditolak. Hanya Admin Tenant yang dapat login di sini."
          );
        } else {
          // Check if tenant is suspended
          if (data.warning && data.warning.type === "tenant_suspended") {
            showError(
              data.message || "Akun Anda telah ditangguhkan oleh administrator."
            );
            setLoading(false);
            return;
          }

          // Check if package is expired
          if (data.warning && data.warning.type === "package_expired") {
            showError(data.warning.message);
            setLoading(false);
            return;
          }

          // Save credentials based on remember me
          if (rememberMe) {
            localStorage.setItem("admin_token", data.token);
            localStorage.setItem("tenant_id", data.user.tenant_id);
            localStorage.setItem("role", data.user.role);
            localStorage.setItem("user_email", data.user.email);
            localStorage.setItem("remembered_email", email);
            localStorage.setItem("remember_me", "true");
          } else {
            sessionStorage.setItem("admin_token", data.token);
            sessionStorage.setItem("tenant_id", data.user.tenant_id);
            sessionStorage.setItem("role", data.user.role);
            sessionStorage.setItem("user_email", data.user.email);
            // Clear remembered credentials if unchecked
            localStorage.removeItem("remembered_email");
            localStorage.removeItem("remember_me");
          }
          success("Login berhasil!");
          logger.logAuth("Login Success", true, {
            email,
            tenantId: data.user.tenant_id,
          });
          navigate("/dashboard-tenant");
        }
      } else {
        logger.logAuth("Login Failed", false, { email, reason: data.message });
        showError(data.message || "Login gagal. Email atau password salah.");
      }
    } catch (err) {
      logger.logAuth("Login Error", false, { email, error: err.message });
      showError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative p-4 lg:p-8">
      {/* Background Image with Blur */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("/public/bg-login2.png")',
        }}
      >
        <div className="absolute inset-0 backdrop-blur-sm bg-black/10"></div>
      </div>

      <div className="relative w-full max-w-6xl flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
        {/* Marketing Section - Kiri */}
        <div className="hidden lg:block lg:flex-1 text-white space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold drop-shadow-lg">
              Wisse Digital Signage
            </h1>
            <p className="text-xl text-white/90 drop-shadow">
              Platform Digital Signage Modern untuk Bisnis Anda
            </p>
          </div>

          <div className="space-y-6 bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20">
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-500/80 backdrop-blur rounded-xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">
                    Kelola Konten dengan Mudah
                  </h4>
                  <p className="text-white/80 text-sm">
                    Upload dan atur konten video, gambar, dan teks dengan
                    interface yang intuitif
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-indigo-500/80 backdrop-blur rounded-xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">
                    Playlist & Scheduling
                  </h4>
                  <p className="text-white/80 text-sm">
                    Atur jadwal tampilan konten secara otomatis dengan sistem
                    playlist yang fleksibel
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-500/80 backdrop-blur rounded-xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">
                    Multi-Device Management
                  </h4>
                  <p className="text-white/80 text-sm">
                    Kontrol dan monitor semua display Anda dari satu dashboard
                    terpusat
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-pink-500/80 backdrop-blur rounded-xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">
                    Real-time Analytics
                  </h4>
                  <p className="text-white/80 text-sm">
                    Pantau performa konten dengan laporan dan analytics yang
                    detail
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-cyan-500/80 backdrop-blur rounded-xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">
                    Keamanan Terjamin
                  </h4>
                  <p className="text-white/80 text-sm">
                    Data Anda aman dengan enkripsi dan sistem keamanan berlapis
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Login Section - Kanan */}
        <div className="w-full lg:w-auto lg:flex-shrink-0 lg:max-w-md">
          {/* Logo & Brand - Mobile Only */}
          <div className="text-center mb-8 lg:hidden">
            <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-2">
              Wisse Signage
            </h1>
            <p className="text-white/90 drop-shadow">
              Digital Signage Platform
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/30">
            <div className="text-center mb-6">
              <img
                src="/Wisse_logo1.png"
                alt="Wisse Logo"
                className="w-12 h-12 mx-auto mb-4 object-contain"
              />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Welcome Back
              </h2>
              <p className="text-gray-600">Sign in to your tenant account</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                <div className="flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:bg-white ${
                    fieldError.email
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-200 focus:border-blue-500"
                  }`}
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {fieldError.email && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <span>❌</span> {fieldError.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`w-full px-4 py-3 pr-12 bg-gray-50 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:bg-white ${
                      fieldError.password
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-200 focus:border-blue-500"
                    }`}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {fieldError.password && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <span>❌</span> {fieldError.password}
                  </p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                  />
                  <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900">
                    Remember me
                  </span>
                </label>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-semibold text-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Sign In</span>
                  </div>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                Don't have an account?{" "}
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Contact Admin
                </a>
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center">
            <p className="text-sm text-white/70 drop-shadow lg:text-gray-500 lg:drop-shadow-none">
              Secure login • Powered by Wisse Digital Signage
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
