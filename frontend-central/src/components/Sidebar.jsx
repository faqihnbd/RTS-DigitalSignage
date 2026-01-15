import React from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside
      className="w-60 h-screen fixed left-0 top-0 z-30 flex flex-col py-8 px-5 shadow-2xl bg-gradient-to-b from-blue-800 via-blue-600 to-indigo-700 text-white transition-all duration-300"
      style={{
        boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
        borderRight: "1.5px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="text-3xl font-extrabold mb-10 tracking-widest drop-shadow-lg flex items-center gap-2">
        <span className="bg-white bg-opacity-20 rounded-full px-3 py-1 mr-2 shadow">
          Central
        </span>
        <span className="text-xs font-light tracking-wider text-blue-200">
          Wisse
        </span>
      </div>
      <nav
        className="flex-1 flex flex-col gap-2 pr-1"
        style={{
          maxHeight: "calc(100vh - 170px)",
          overflowY: "auto",
          overflowX: "hidden",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {/* Hide scrollbar for Chrome, Safari and Opera */}
        <style>{`
          nav::-webkit-scrollbar { display: none; }
        `}</style>
        {[
          { to: "/", label: "Dashboard" },
          { to: "/tenants", label: "Tenant" },
          { to: "/stats", label: "Statistik" },
          //{ to: "/payments", label: "History Pembayaran" },
          { to: "/users", label: "User" },
          //{ to: "/summary", label: "Ringkasan" },
          //{ to: "/notifications", label: "Notifikasi" },
          //{ to: "/export", label: "Export Laporan" },
          //{ to: "/audit", label: "Audit Log" },
          //{ to: "/user-tenant", label: "User Tenant" },
        ].map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-all duration-200 text-base shadow-sm ` +
              (isActive
                ? "bg-white bg-opacity-30 text-yellow-200 scale-105 shadow-lg"
                : "hover:bg-white hover:bg-opacity-10 hover:text-yellow-100")
            }
            style={{ letterSpacing: "0.02em" }}
          >
            <span className="text-lg">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-10 text-xs text-blue-200 opacity-70 text-center select-none">
        &copy; {new Date().getFullYear()} Wisse CMS
      </div>
    </aside>
  );
}
