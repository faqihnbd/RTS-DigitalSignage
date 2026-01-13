import React, { createContext, useContext } from "react";
import { useConfirmation, useToast } from "../hooks/useNotification";
import ConfirmationDialog from "./ConfirmationDialog";
import Toast from "./Toast";

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const confirmation = useConfirmation();
  const toast = useToast();

  // Global functions
  React.useEffect(() => {
    window.showToast = toast.showToast;
    window.showConfirm = confirmation.confirm;

    return () => {
      delete window.showToast;
      delete window.showConfirm;
    };
  }, [toast.showToast, confirmation.confirm]);

  const value = {
    // Toast functions
    showToast: toast.showToast,
    success: toast.success,
    error: toast.error,
    warning: toast.warning,
    info: toast.info,

    // Confirmation function
    confirm: confirmation.confirm,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmation.isOpen}
        onClose={confirmation.handleCancel}
        onConfirm={confirmation.handleConfirm}
        {...confirmation.config}
      />

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[10001] space-y-2">
        {toast.toasts.map((toastItem) => (
          <Toast
            key={toastItem.id}
            message={toastItem.message}
            type={toastItem.type}
            isVisible={true}
            duration={0} // Duration handled by hook
            onClose={() => toast.removeToast(toastItem.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
