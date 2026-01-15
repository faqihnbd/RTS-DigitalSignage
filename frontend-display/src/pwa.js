/**
 * PWA Service Worker Registration
 * Handles SW registration, updates, and offline functionality
 */

import { registerSW } from "virtual:pwa-register";

// Update check interval (every 1 hour)
const UPDATE_INTERVAL = 60 * 60 * 1000;

let updateSW = null;

/**
 * Show update notification to user
 */
function showUpdateNotification() {
  // For digital signage, we auto-update without user interaction
  // But we can show a brief notification
  const notification = document.createElement("div");
  notification.className = "pwa-update-available";
  notification.innerHTML = `
    <span>🔄 Update tersedia</span>
    <button id="pwa-update-btn">Update Sekarang</button>
  `;
  document.body.appendChild(notification);

  const updateBtn = document.getElementById("pwa-update-btn");
  if (updateBtn) {
    updateBtn.addEventListener("click", () => {
      if (updateSW) {
        updateSW(true);
      }
      notification.remove();
    });
  }

  // Auto-update after 10 seconds for digital signage (unattended)
  setTimeout(() => {
    if (updateSW) {
      updateSW(true);
    }
    notification.remove();
  }, 10000);
}

/**
 * Show offline notification
 */
function showOfflineNotification() {
  const notification = document.createElement("div");
  notification.id = "offline-notification";
  notification.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #ff6b6b;
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    z-index: 10001;
    font-family: Arial, sans-serif;
    font-size: 14px;
  `;
  notification.textContent = "📡 Mode Offline";
  document.body.appendChild(notification);
}

/**
 * Hide offline notification
 */
function hideOfflineNotification() {
  const notification = document.getElementById("offline-notification");
  if (notification) {
    notification.remove();
  }
}

/**
 * Register the service worker
 */
export function registerServiceWorker() {
  // Only register in production or if explicitly enabled in dev
  if ("serviceWorker" in navigator) {
    updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        console.log("[PWA] New content available, showing update notification");
        showUpdateNotification();
      },
      onOfflineReady() {
        console.log("[PWA] App ready to work offline");
        // Optional: show a toast notification
      },
      onRegistered(registration) {
        console.log("[PWA] Service Worker registered:", registration);

        // Check for updates periodically
        if (registration) {
          setInterval(() => {
            console.log("[PWA] Checking for updates...");
            registration.update();
          }, UPDATE_INTERVAL);
        }
      },
      onRegisterError(error) {
        console.error("[PWA] Service Worker registration failed:", error);
      },
    });

    // Listen for online/offline events
    window.addEventListener("online", () => {
      console.log("[PWA] Back online");
      hideOfflineNotification();
    });

    window.addEventListener("offline", () => {
      console.log("[PWA] Gone offline");
      showOfflineNotification();
    });

    // Check initial online status
    if (!navigator.onLine) {
      showOfflineNotification();
    }
  } else {
    console.warn("[PWA] Service Workers not supported in this browser");
  }
}

/**
 * Check if app is running as installed PWA
 */
export function isPWAInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true ||
    document.referrer.includes("android-app://")
  );
}

/**
 * Get PWA display mode
 */
export function getDisplayMode() {
  if (window.matchMedia("(display-mode: fullscreen)").matches) {
    return "fullscreen";
  }
  if (window.matchMedia("(display-mode: standalone)").matches) {
    return "standalone";
  }
  if (window.matchMedia("(display-mode: minimal-ui)").matches) {
    return "minimal-ui";
  }
  return "browser";
}

export default registerServiceWorker;
