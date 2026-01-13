import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Layout from "./components/Layout";
import NotificationProvider from "./components/NotificationProvider";
import Login from "./pages/Login";
// import Dashboard from "./pages/Dashboard";
import DashboardTenant from "./pages/DashboardTenant";
import UploadContent from "./pages/UploadContent";
import PlaylistManagement from "./pages/PlaylistManagement";
import LayoutManagement from "./pages/LayoutManagement";
import DeviceRegistration from "./pages/DeviceRegistration";
import Payment from "./pages/Payment";
import PackageManagement from "./pages/PackageManagement";
import PaymentCallback from "./pages/PaymentCallback";

function isAuthenticated() {
  const token =
    localStorage.getItem("admin_token") ||
    sessionStorage.getItem("admin_token");
  const tenantId =
    localStorage.getItem("tenant_id") || sessionStorage.getItem("tenant_id");
  const role = localStorage.getItem("role") || sessionStorage.getItem("role");
  return !!token && !!tenantId && role === "tenant_admin";
}

function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" />;
}

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  if (isLoginPage) {
    return <Login />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard-tenant" />} />
        <Route
          path="/dashboard-tenant"
          element={
            <ProtectedRoute>
              <DashboardTenant />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <UploadContent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/playlist"
          element={
            <ProtectedRoute>
              <PlaylistManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/layouts"
          element={
            <ProtectedRoute>
              <LayoutManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/devices"
          element={
            <ProtectedRoute>
              <DeviceRegistration />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          }
        />
        <Route path="/payment/success" element={<PaymentCallback />} />
        <Route path="/payment/error" element={<PaymentCallback />} />
        <Route path="/payment/pending" element={<PaymentCallback />} />
        <Route
          path="/upgrade"
          element={
            <ProtectedRoute>
              <PackageManagement />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <Router>
      <NotificationProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </NotificationProvider>
    </Router>
  );
}

export default App;
