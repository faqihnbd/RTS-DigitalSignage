import React from "react";

export default function Layout({ children, user, onLogout }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-gradient-to-r from-blue-900 via-blue-700 to-indigo-800 text-white px-8 py-4 flex items-center justify-between shadow-lg sticky top-0 z-20 border-b border-blue-800">
        <div className="flex items-center gap-4">
          <span className="text-2xl font-extrabold tracking-widest drop-shadow-lg">
            RunToStart Digital Signage Central
          </span>
          <span className="ml-2 px-2 py-1 rounded bg-white bg-opacity-20 text-blue-200 text-xs font-semibold tracking-wide shadow">
            Super Admin
          </span>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <>
              <span className="text-sm font-medium text-white bg-blue-800 bg-opacity-40 px-3 py-1 rounded-full shadow-sm">
                {user.email}
              </span>
              <button
                onClick={onLogout}
                title="Logout"
                className="ml-2 p-2 rounded-full bg-red-600 hover:bg-red-700 transition-colors shadow text-white flex items-center justify-center"
                style={{ minWidth: 36, minHeight: 36 }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M18 12H9m0 0l3-3m-3 3l3 3"
                  />
                </svg>
              </button>
            </>
          )}
        </div>
      </header>
      <main className="flex-1 p-6 w-full max-w-7xl mx-auto">{children}</main>
      <footer className="bg-gray-100 text-gray-500 text-xs text-center py-2 border-t">
        &copy; {new Date().getFullYear()} RunToStart CMS
      </footer>
    </div>
  );
}
