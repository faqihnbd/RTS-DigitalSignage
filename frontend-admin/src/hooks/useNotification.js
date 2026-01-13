import { useState } from "react";

// Hook untuk mengelola confirmation dialog
export const useConfirmation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({});
  const [resolvePromise, setResolvePromise] = useState(null);

  const confirm = ({
    title = "Konfirmasi",
    message = "Apakah Anda yakin?",
    confirmText = "Ya",
    cancelText = "Batal",
    type = "danger",
  }) => {
    return new Promise((resolve) => {
      setConfig({ title, message, confirmText, cancelText, type });
      setIsOpen(true);
      setResolvePromise(() => resolve);
    });
  };

  const handleConfirm = () => {
    if (resolvePromise) {
      resolvePromise(true);
    }
    setIsOpen(false);
    setResolvePromise(null);
  };

  const handleCancel = () => {
    if (resolvePromise) {
      resolvePromise(false);
    }
    setIsOpen(false);
    setResolvePromise(null);
  };

  return {
    isOpen,
    config,
    confirm,
    handleConfirm,
    handleCancel,
  };
};

// Hook untuk mengelola toast notifications
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return {
    toasts,
    showToast,
    removeToast,
    success: (message, duration) => showToast(message, "success", duration),
    error: (message, duration) => showToast(message, "error", duration),
    warning: (message, duration) => showToast(message, "warning", duration),
    info: (message, duration) => showToast(message, "info", duration),
  };
};

// Utility functions untuk global access
export const showAlert = (message, type = "info") => {
  if (window.showToast) {
    window.showToast(message, type);
  } else {
    alert(message); // fallback
  }
};

export const showConfirm = async (message, title = "Konfirmasi") => {
  if (window.showConfirm) {
    return await window.showConfirm({ message, title });
  } else {
    return window.confirm(message); // fallback
  }
};
