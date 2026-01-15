import React, { Component } from "react";
import logger from "../utils/logger";

/**
 * ErrorBoundary Component
 * Catches JavaScript errors in child components and provides auto-recovery
 * Critical for production digital signage to prevent blank screens
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      countdown: 10,
    };
    this.countdownTimer = null;
    this.autoRetryTimer = null;
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console for debugging
    console.error("[ErrorBoundary] Caught error:", error);
    console.error(
      "[ErrorBoundary] Component stack:",
      errorInfo?.componentStack
    );

    this.setState({ errorInfo });

    // Log error to backend via logger
    logger.logException(error, "React ErrorBoundary");

    // Also log component stack
    logger.error("Component Stack Trace", {
      componentStack: errorInfo?.componentStack,
      errorMessage: error.message,
    });

    // Store error info for potential logging (backup in localStorage)
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
      };

      // Store in localStorage for debugging
      const existingLogs = JSON.parse(
        localStorage.getItem("error_logs") || "[]"
      );
      existingLogs.push(errorLog);
      // Keep only last 10 errors
      if (existingLogs.length > 10) {
        existingLogs.shift();
      }
      localStorage.setItem("error_logs", JSON.stringify(existingLogs));
    } catch (logError) {
      console.error("[ErrorBoundary] Failed to log error:", logError);
    }

    // Start countdown for auto-retry
    this.startCountdown();
  }

  componentWillUnmount() {
    // Clean up timers
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
    if (this.autoRetryTimer) {
      clearTimeout(this.autoRetryTimer);
    }
  }

  startCountdown = () => {
    // Clear existing timers
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
    if (this.autoRetryTimer) {
      clearTimeout(this.autoRetryTimer);
    }

    // Reset countdown
    this.setState({ countdown: 10 });

    // Start countdown timer
    this.countdownTimer = setInterval(() => {
      this.setState((prevState) => {
        if (prevState.countdown <= 1) {
          clearInterval(this.countdownTimer);
          return { countdown: 0 };
        }
        return { countdown: prevState.countdown - 1 };
      });
    }, 1000);

    // Auto retry after 10 seconds
    this.autoRetryTimer = setTimeout(() => {
      this.handleRetry();
    }, 10000);
  };

  handleRetry = () => {
    // Clear timers
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
    if (this.autoRetryTimer) {
      clearTimeout(this.autoRetryTimer);
    }

    const newRetryCount = this.state.retryCount + 1;

    // If we've retried too many times, do a full page reload
    if (newRetryCount > 3) {
      console.log("[ErrorBoundary] Too many retries, reloading page...");
      window.location.reload();
      return;
    }

    // Reset error state to retry rendering
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: newRetryCount,
      countdown: 10,
    });
  };

  handleForceReload = () => {
    // Clear timers
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
    if (this.autoRetryTimer) {
      clearTimeout(this.autoRetryTimer);
    }

    // Force reload the page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
            {/* Error Icon */}
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Error Title */}
            <h2 className="text-2xl font-bold text-white mb-2">
              Terjadi Kesalahan
            </h2>
            <p className="text-gray-400 mb-6">
              Aplikasi mengalami error. Akan me-retry otomatis dalam beberapa
              saat.
            </p>

            {/* Countdown */}
            <div className="mb-6">
              <div className="text-5xl font-bold text-blue-400 mb-2">
                {this.state.countdown}
              </div>
              <p className="text-gray-500 text-sm">
                detik sebelum retry otomatis
              </p>
            </div>

            {/* Retry Count */}
            {this.state.retryCount > 0 && (
              <p className="text-yellow-400 text-sm mb-4">
                Percobaan ke-{this.state.retryCount} dari 3
              </p>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Retry Sekarang
              </button>
              <button
                onClick={this.handleForceReload}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Reload Halaman
              </button>
            </div>

            {/* Error Details (collapsed by default in production) */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-gray-400 cursor-pointer text-sm">
                  Detail Error (Dev Mode)
                </summary>
                <pre className="mt-2 p-3 bg-gray-900 rounded-lg text-xs text-red-300 overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {"\n\n"}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
