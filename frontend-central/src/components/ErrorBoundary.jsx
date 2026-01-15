import React, { Component } from "react";
import logger from "../utils/logger";

/**
 * ErrorBoundary Component
 * Catches JavaScript errors in child components and provides auto-recovery
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
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
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

    // Start countdown for auto-retry
    this.startCountdown();
  }

  componentWillUnmount() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
    if (this.autoRetryTimer) {
      clearTimeout(this.autoRetryTimer);
    }
  }

  startCountdown = () => {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }

    const countdownDuration = Math.min(10 + this.state.retryCount * 5, 30);
    this.setState({ countdown: countdownDuration });

    this.countdownTimer = setInterval(() => {
      this.setState((prevState) => {
        const newCountdown = prevState.countdown - 1;
        if (newCountdown <= 0) {
          clearInterval(this.countdownTimer);
          this.handleRetry();
          return { countdown: 0 };
        }
        return { countdown: newCountdown };
      });
    }, 1000);
  };

  handleRetry = () => {
    const { retryCount } = this.state;
    const maxRetries = this.props.maxRetries || 3;

    if (retryCount >= maxRetries) {
      console.error("[ErrorBoundary] Max retries reached, reloading page...");
      logger.error("ErrorBoundary: Max retries reached, reloading page", {
        retryCount,
        maxRetries,
      });
      window.location.reload();
      return;
    }

    logger.info("ErrorBoundary: Retrying after error", {
      retryCount: retryCount + 1,
    });

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: retryCount + 1,
    });
  };

  handleManualRetry = () => {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
    this.handleRetry();
  };

  handleReload = () => {
    logger.info("ErrorBoundary: Manual page reload requested");
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, countdown, retryCount } = this.state;
      const maxRetries = this.props.maxRetries || 3;

      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full text-center">
            {/* Error Icon */}
            <div className="mb-6">
              <svg
                className="w-20 h-20 mx-auto text-red-500"
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

            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Terjadi Kesalahan
            </h1>

            <p className="text-gray-600 mb-4">
              Aplikasi mengalami error yang tidak terduga. Sistem akan otomatis
              mencoba memulihkan.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-red-800 font-mono break-words">
                  {error.message || "Unknown error"}
                </p>
              </div>
            )}

            <div className="mb-6">
              <p className="text-gray-500 text-sm">
                Percobaan ulang otomatis dalam{" "}
                <span className="font-bold text-blue-600">{countdown}</span>{" "}
                detik
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Percobaan: {retryCount + 1}/{maxRetries + 1}
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                style={{
                  width: `${(countdown / (10 + retryCount * 5)) * 100}%`,
                }}
              />
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleManualRetry}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Coba Sekarang
              </button>
              <button
                onClick={this.handleReload}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Muat Ulang Halaman
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
