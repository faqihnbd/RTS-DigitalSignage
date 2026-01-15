import React, { useState } from "react";
import logger from "../utils/logger";
const API_URL = import.meta.env.VITE_API_URL;

export default function Login({ onLogin, showNotif }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login gagal");
      logger.logAuth("Login Success", true, {
        email,
        userId: data.user?.id,
        role: data.user?.role,
      });
      onLogin(data.token, data.user);
      showNotif && showNotif("success", "Login berhasil!");
    } catch (err) {
      logger.logAuth("Login Failed", false, { email, error: err.message });
      setError(err.message);
      showNotif && showNotif("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Image with Blur */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("/central/bg-login2.png")',
        }}
      >
        <div className="absolute inset-0 backdrop-blur-sm bg-black/20"></div>
      </div>
      <form
        onSubmit={handleSubmit}
        className="relative z-10 bg-white bg-opacity-90 p-10 rounded-3xl shadow-2xl w-full max-w-md flex flex-col items-center backdrop-blur-md border border-blue-100 animate-fade-in"
        style={{
          boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
        }}
      >
        <div className="mb-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center shadow-lg animate-bounce-slow overflow-hidden">
            <img
              src="/central/Wisse_logo1.png"
              alt="Wisse"
              className="w-9 h-9 object-contain"
            />
          </div>
          <h2 className="text-3xl font-extrabold mt-4 text-gray-800 tracking-widest drop-shadow-lg animate-fade-in">
            Wisse Central Login
          </h2>
        </div>
        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm w-full text-center animate-shake">
            {error}
          </div>
        )}
        <input
          type="email"
          className="w-full border-2 border-blue-200 focus:border-blue-500 px-4 py-3 rounded-xl mb-4 bg-white bg-opacity-80 shadow-inner transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
        <input
          type="password"
          className="w-full border-2 border-blue-200 focus:border-blue-500 px-4 py-3 rounded-xl mb-6 bg-white bg-opacity-80 shadow-inner transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:scale-105 hover:from-blue-800 hover:to-purple-800 transition-all duration-200 flex items-center justify-center gap-2 animate-fade-in"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="loader ease-linear rounded-full border-4 border-t-4 border-blue-500 h-5 w-5 animate-spin"></span>{" "}
              Loading...
            </span>
          ) : (
            <>
              <svg
                width="22"
                height="22"
                fill="none"
                viewBox="0 0 24 24"
                stroke="white"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 12h14M12 5l7 7-7 7"
                />
              </svg>
              Login
            </>
          )}
        </button>
      </form>
      {/* Animations */}
      <style>{`
        @keyframes pulse-slow { 0%,100%{opacity:.3} 50%{opacity:.6} }
        .animate-pulse-slow { animation: pulse-slow 4s infinite; }
        @keyframes pulse-fast { 0%,100%{opacity:.4} 50%{opacity:.7} }
        .animate-pulse-fast { animation: pulse-fast 2s infinite; }
        @keyframes spin-slow { 100% { transform: rotate(360deg) translate(-50%, -50%); } }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }
        @keyframes fade-in { from{opacity:0;transform:translateY(30px);} to{opacity:1;transform:translateY(0);} }
        .animate-fade-in { animation: fade-in 1s cubic-bezier(.4,0,.2,1) both; }
        @keyframes bounce-slow { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-10px);} }
        .animate-bounce-slow { animation: bounce-slow 2.5s infinite; }
        @keyframes shake { 10%, 90% { transform: translateX(-1px); } 20%, 80% { transform: translateX(2px); } 30%, 50%, 70% { transform: translateX(-4px); } 40%, 60% { transform: translateX(4px); } }
        .animate-shake { animation: shake 0.5s; }
        .loader { border-top-color: #6366f1; border-right-color: #6366f1; border-bottom-color: #6366f1; border-left-color: #fff; }
      `}</style>
    </div>
  );
}
