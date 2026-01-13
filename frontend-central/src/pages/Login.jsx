import React, { useState } from "react";
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
      onLogin(data.token, data.user);
      showNotif && showNotif("success", "Login berhasil!");
    } catch (err) {
      setError(err.message);
      showNotif && showNotif("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900 relative overflow-hidden">
      {/* Animated background shapes */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 opacity-30 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-400 via-blue-400 to-purple-500 opacity-40 rounded-full blur-2xl animate-pulse-fast" />
        <div
          className="absolute top-1/2 left-1/2 w-40 h-40 bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400 opacity-30 rounded-full blur-2xl animate-spin-slow"
          style={{ transform: "translate(-50%, -50%)" }}
        />
      </div>
      <form
        onSubmit={handleSubmit}
        className="relative z-10 bg-white bg-opacity-90 p-10 rounded-3xl shadow-2xl w-full max-w-md flex flex-col items-center backdrop-blur-md border border-blue-100 animate-fade-in"
        style={{
          boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
        }}
      >
        <div className="mb-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg animate-bounce-slow">
            <svg
              width="36"
              height="36"
              fill="none"
              viewBox="0 0 24 24"
              stroke="white"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold mt-4 text-blue-900 tracking-widest drop-shadow-lg animate-fade-in">
            RTS Central Login
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
          className="w-full bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:scale-105 hover:from-blue-800 hover:to-purple-800 transition-all duration-200 flex items-center justify-center gap-2 animate-fade-in"
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
