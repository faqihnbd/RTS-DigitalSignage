import { useState, useEffect, useRef, useCallback } from "react";
import LoadingOverlay from "./LoadingOverlay";
import logger from "../utils/logger";

const MediaPlayer = ({ item, onEnded, isPlaying }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [transitionClass, setTransitionClass] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);

  const videoRef = useRef(null);
  const imageRef = useRef(null);
  const intervalRef = useRef(null);
  const preloadVideoRef = useRef(null);
  const loadingTimeoutRef = useRef(null);
  // Track all blob URLs created for proper cleanup (prevent memory leaks)
  const blobUrlsRef = useRef(new Set());
  const itemIdRef = useRef(null);

  // Helper to create and track blob URLs
  const createTrackedBlobUrl = useCallback((blob) => {
    const url = URL.createObjectURL(blob);
    blobUrlsRef.current.add(url);
    return url;
  }, []);

  // Helper to revoke and untrack blob URL
  const revokeTrackedBlobUrl = useCallback((url) => {
    if (url && url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
      blobUrlsRef.current.delete(url);
    }
  }, []);

  // Cleanup all tracked blob URLs
  const cleanupAllBlobUrls = useCallback(() => {
    blobUrlsRef.current.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        // Ignore errors
      }
    });
    blobUrlsRef.current.clear();
  }, []);

  // Preload next video function
  const preloadNext = useCallback((nextItem) => {
    if (nextItem && nextItem.content_type === "video") {
      if (!preloadVideoRef.current) {
        preloadVideoRef.current = document.createElement("video");
        preloadVideoRef.current.muted = true;
        preloadVideoRef.current.preload = "auto";
      }
      preloadVideoRef.current.src = getContentUrl(nextItem);
    }
  }, []);

  useEffect(() => {
    if (item) {
      // Check if this is a new item (prevent unnecessary re-renders)
      const newItemId = item.content_id || item.id;
      const isNewItem = newItemId !== itemIdRef.current;
      itemIdRef.current = newItemId;

      setIsTransitioning(true);
      setShowLoadingOverlay(false);

      // Cleanup previous media
      const video = videoRef.current;
      if (video) {
        video.pause();
        // Revoke previous blob URL before setting new one
        if (video.src && video.src.startsWith("blob:")) {
          revokeTrackedBlobUrl(video.src);
        }
        video.removeAttribute("src");
        video.load();
      }

      // Cleanup previous image blob URL
      const image = imageRef.current;
      if (image && image.src && image.src.startsWith("blob:")) {
        revokeTrackedBlobUrl(image.src);
      }

      setIsLoading(true);
      setError(null);
      setIsReady(false);

      // Apply transition effect
      applyTransition(item.transition || "fade");

      // Set timeout untuk loading overlay (hanya tampil jika loading > 1 detik)
      loadingTimeoutRef.current = setTimeout(() => {
        if (isLoading) {
          setShowLoadingOverlay(true);
        }
      }, 1000);

      // Delay singkat untuk transisi yang smooth
      setTimeout(() => {
        playItem().finally(() => {
          setIsTransitioning(false);
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
          }
        });
      }, 100);
    }

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      // Cleanup video saat component unmount atau item berubah
      const video = videoRef.current;
      if (video) {
        video.pause();
        if (video.src && video.src.startsWith("blob:")) {
          revokeTrackedBlobUrl(video.src);
        }
        video.removeAttribute("src");
      }

      // Cleanup image blob URLs
      const image = imageRef.current;
      if (image && image.src && image.src.startsWith("blob:")) {
        revokeTrackedBlobUrl(image.src);
      }
    };
  }, [item, revokeTrackedBlobUrl]);

  // Cleanup all blob URLs on component unmount
  useEffect(() => {
    return () => {
      cleanupAllBlobUrls();
      // Also cleanup preload video
      if (preloadVideoRef.current) {
        if (
          preloadVideoRef.current.src &&
          preloadVideoRef.current.src.startsWith("blob:")
        ) {
          URL.revokeObjectURL(preloadVideoRef.current.src);
        }
        preloadVideoRef.current = null;
      }
    };
  }, [cleanupAllBlobUrls]);

  // Handle isPlaying state changes
  useEffect(() => {
    const video = videoRef.current;
    if (video && isReady && item) {
      if (isPlaying) {
        if (video.paused) {
          // Tambahkan pengecekan untuk mencegah konflik
          if (video.readyState >= 2) {
            video.play().catch((error) => {
              // Hanya log error jika bukan karena interruption oleh load baru
              if (error.name !== "AbortError") {
                logger.logContent(
                  "Play Failed",
                  { contentId: item?.content_id, error: error.message },
                  "error"
                );
                if (error.name === "NotAllowedError") {
                  setNeedsUserInteraction(true);
                }
              }
            });
          }
        }
      } else {
        // Pause dengan aman
        if (!video.paused) {
          video.pause();
        }
      }
    }
  }, [isPlaying, isReady, item]);

  // Apply transition effects
  const applyTransition = (transitionType) => {
    switch (transitionType) {
      case "fade":
        setTransitionClass("transition-opacity duration-500 ease-in-out");
        break;
      case "slide":
        setTransitionClass("transition-transform duration-500 ease-in-out");
        break;
      case "zoom":
        setTransitionClass("transition-all duration-500 ease-in-out transform");
        break;
      case "none":
      default:
        setTransitionClass("");
        break;
    }
  };

  // Get orientation styles
  const getOrientationStyles = (orientation) => {
    const baseStyles = {
      width: "100%",
      height: "100%",
      objectFit: "cover",
    };

    switch (orientation) {
      case "portrait":
        // Rotate portrait video -90 degrees (counter-clockwise) to fill landscape screen
        return {
          width: "100vh",
          height: "100vw",
          objectFit: "cover",
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) rotate(-90deg)",
          transformOrigin: "center center",
        };
      case "landscape":
        return {
          ...baseStyles,
          objectFit: "cover",
        };
      case "auto":
      default:
        return baseStyles;
    }
  };

  const playItem = async () => {
    try {
      setError(null);

      // Clear any existing interval
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        clearInterval(intervalRef.current);
      }

      if (item.content_type === "video") {
        await playVideo();
      } else if (item.content_type === "image") {
        await playImage();
      } else if (item.content_type === "html") {
        await playHTML();
      } else {
        // Check if unknown type has content.type info
        if (item.content?.type === "image") {
          await playImage();
        } else if (item.content?.type === "video") {
          await playVideo();
        } else {
          await playVideo(); // default fallback
        }
      }
    } catch (err) {
      logger.logContent(
        "Play Item Error",
        { contentId: item?.content_id, error: err.message },
        "error"
      );
      setError(err.message);
      setIsLoading(false);
      setTimeout(onEnded, 2000);
    }
  };

  const playVideo = async () => {
    const video = videoRef.current;

    if (!video) {
      logger.logContent(
        "No Video Element",
        { contentId: item?.content_id },
        "error"
      );
      return;
    }

    try {
      // Try to get cached version first
      let videoUrl = null;
      let isBlobUrl = false;

      try {
        const StorageService = (await import("../services/StorageService"))
          .default;
        const storageInstance = new StorageService();
        videoUrl = await storageInstance.getCachedContent(item.content_id);
        if (videoUrl && videoUrl.startsWith("blob:")) {
          isBlobUrl = true;
          blobUrlsRef.current.add(videoUrl);
        }
      } catch (cacheError) {
        logger.logContent(
          "Cache Access Failed",
          { contentId: item?.content_id },
          "warn"
        );
      }

      if (!videoUrl) {
        try {
          // Try to fetch with authentication first
          const contentUrl = getContentUrl(item);
          const blob = await fetchContentWithAuth(contentUrl);
          videoUrl = createTrackedBlobUrl(blob);
          isBlobUrl = true;
        } catch (authError) {
          logger.logContent(
            "Auth Fetch Failed - Direct URL",
            { contentId: item?.content_id },
            "warn"
          );
          videoUrl = getContentUrl(item);
        }
      }

      // Set up event handlers
      const handleLoadedData = () => {
        setIsLoading(false);
        setIsReady(true);
        setShowLoadingOverlay(false);
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }

        // Hanya play jika video sudah siap dan tidak ada konflik
        if (isPlaying && video.readyState >= 2 && video.paused) {
          video.play().catch((error) => {
            if (error.name !== "AbortError") {
              logger.logContent(
                "Video Play Error",
                { contentId: item?.content_id, error: error.message },
                "error"
              );
              if (error.name === "NotAllowedError") {
                setNeedsUserInteraction(true);
              }
            }
          });
        }

        // Handle custom duration for video
        handleCustomDuration();
      };

      const handleCanPlay = () => {
        setIsLoading(false);
        setIsReady(true);
        setShowLoadingOverlay(false);
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }

        // Handle custom duration for video
        handleCustomDuration();
      };

      const handleEnded = () => {
        onEnded();
      };

      const handleCustomDuration = () => {
        // If custom duration is set, use it instead of natural video duration
        if (item.duration_sec && item.duration_sec > 0) {
          const customDuration = item.duration_sec * 1000;

          // Clear any existing timeout
          if (intervalRef.current) {
            clearTimeout(intervalRef.current);
          }

          intervalRef.current = setTimeout(() => {
            onEnded();
          }, customDuration);
        }
      };

      const handlePlay = () => {
        setIsLoading(false);
        setIsReady(true);
        setShowLoadingOverlay(false);
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }

        // Handle custom duration for video
        handleCustomDuration();
      };

      const handleError = (e) => {
        logger.logContent(
          "Video Error",
          { contentId: item?.content_id, error: e?.message || "Unknown" },
          "error"
        );

        // Don't try to handle errors for images - they shouldn't use video element
        if (item.content_type === "image") {
          // Skip image content error handling
          return;
        }

        if (videoUrl && videoUrl.startsWith("blob:")) {
          const directUrl = getContentUrl(item);
          video.src = directUrl;
          return;
        }

        setIsLoading(false);
        throw new Error("Video failed to load");
      };

      // Remove old event listeners
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("error", handleError);

      // Add event listeners
      video.addEventListener("loadeddata", handleLoadedData);
      video.addEventListener("canplay", handleCanPlay);
      video.addEventListener("ended", handleEnded);
      video.addEventListener("play", handlePlay);
      video.addEventListener("error", handleError);

      // Pastikan video bersih sebelum load baru
      video.pause();
      video.removeAttribute("src");
      video.load();

      // Set src dan load
      video.src = videoUrl;
      video.load();

      // Timeout fallback
      setTimeout(() => {
        if (isLoading && video.readyState === 0) {
          setIsLoading(false);
        }
      }, 3000);
    } catch (error) {
      console.error("playVideo error:", error);
      throw new Error(`Video error: ${error.message}`);
    }
  };
  const playImage = async () => {
    try {
      let imageUrl;
      let isBlobUrl = false;

      try {
        // Try to get cached version first
        const cachedUrl = await getCachedContentUrl(item);
        if (cachedUrl) {
          imageUrl = cachedUrl;
          if (cachedUrl.startsWith("blob:")) {
            isBlobUrl = true;
            blobUrlsRef.current.add(cachedUrl);
          }
        } else {
          // Fetch with authentication and create blob URL
          const contentUrl = getContentUrl(item);
          const blob = await fetchContentWithAuth(contentUrl);
          imageUrl = createTrackedBlobUrl(blob);
          isBlobUrl = true;
        }
      } catch (fetchError) {
        console.warn(
          "Failed to fetch with auth, trying direct URL:",
          fetchError
        );
        imageUrl = getContentUrl(item);
      }

      const img = new Image();
      img.onload = () => {
        setIsLoading(false);
        setIsReady(true);
        setShowLoadingOverlay(false);
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }

        // Set duration for image display (use duration_sec if provided, otherwise default 10 seconds)
        const duration = (item.duration_sec || 10) * 1000;
        intervalRef.current = setTimeout(() => {
          onEnded();
        }, duration);
      };

      img.onerror = (error) => {
        console.error("Image loading error:", error);
        // Don't throw, just move to next item
        setError("Image failed to load");
        setIsLoading(false);
        setTimeout(onEnded, 2000);
      };

      img.src = imageUrl;

      // Update image ref src
      if (imageRef.current) {
        imageRef.current.src = imageUrl;
      }
    } catch (error) {
      console.error("playImage error:", error);
      throw new Error(`Image error: ${error.message}`);
    }
  };

  const playHTML = async () => {
    try {
      setIsLoading(false);
      setShowLoadingOverlay(false);
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      // Set duration for HTML content (use duration_sec if provided, otherwise default 15 seconds)
      const duration = (item.duration_sec || 15) * 1000;
      intervalRef.current = setTimeout(() => {
        onEnded();
      }, duration);
    } catch (error) {
      throw new Error(`HTML error: ${error.message}`);
    }
  };

  const getCachedContentUrl = async (item) => {
    try {
      // Try to get from IndexedDB cache
      const StorageService = (await import("../services/StorageService"))
        .default;
      const storageInstance = new StorageService();
      return await storageInstance.getCachedContent(item.content_id);
    } catch (error) {
      console.warn("Failed to get cached content:", error);
      return null;
    }
  };

  const getContentUrl = (item) => {
    // Construct URL to backend content with authentication
    const baseUrl = import.meta.env.VITE_API_URL;
    return `${baseUrl}/api/player/content/${item.content_id}`;
  };

  // Function to fetch content with authentication
  const fetchContentWithAuth = async (url) => {
    try {
      const StorageService = (await import("../services/StorageService"))
        .default;
      const storageInstance = new StorageService();
      const token = await storageInstance.getDeviceToken();

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.blob();
    } catch (error) {
      console.error("Failed to fetch content with auth:", error);
      throw error;
    }
  };

  return (
    <div className="fullscreen">
      {/* Render video element only for video content */}
      {(item.content_type === "video" ||
        (item.content_type === "unknown" &&
          item.content?.type !== "image")) && (
        <>
          <video
            key={`video-${item.content_id}`}
            ref={videoRef}
            className={`media-container ${transitionClass}`}
            autoPlay
            muted
            playsInline
            preload="auto"
            style={{
              display: "block",
              ...getOrientationStyles(item.orientation),
              opacity: isLoading || isTransitioning ? 0.1 : 1,
              transition:
                item.transition === "fade"
                  ? "opacity 0.3s ease-in-out"
                  : item.transition === "slide"
                  ? "transform 0.3s ease-in-out, opacity 0.3s ease-in-out"
                  : item.transition === "zoom"
                  ? "transform 0.3s ease-in-out, opacity 0.3s ease-in-out"
                  : "opacity 0.2s ease-in-out",
              transform: (() => {
                // Get base transform from orientation
                const baseTransform =
                  getOrientationStyles(item.orientation).transform || "";

                // Add transition transforms
                let transitionTransform = "";
                if (isLoading || isTransitioning) {
                  if (item.transition === "slide") {
                    transitionTransform = "translateX(100%)";
                  } else if (item.transition === "zoom") {
                    transitionTransform = "scale(0.5)";
                  }
                }

                // Combine transforms
                if (item.orientation === "portrait") {
                  // For portrait, we need to combine rotation with transition
                  if (transitionTransform) {
                    return `translate(-50%, -50%) rotate(-90deg) ${transitionTransform}`;
                  }
                  return baseTransform;
                } else {
                  // For landscape/auto, return transition transform or default position
                  if (item.transition === "slide") {
                    return transitionTransform || "translateX(0)";
                  } else if (item.transition === "zoom") {
                    return transitionTransform || "scale(1)";
                  }
                  return "none";
                }
              })(),
            }}
          />
          {showLoadingOverlay && (
            <LoadingOverlay type="video" itemName={item?.name} />
          )}
        </>
      )}

      {(item.content_type === "image" ||
        (item.content_type === "unknown" &&
          item.content?.type === "image")) && (
        <>
          <img
            ref={imageRef}
            className={`media-container ${transitionClass}`}
            alt={item.name}
            style={{
              display: "block",
              ...getOrientationStyles(item.orientation),
              opacity: isLoading || isTransitioning ? 0.1 : 1,
              transition:
                item.transition === "fade"
                  ? "opacity 0.3s ease-in-out"
                  : item.transition === "slide"
                  ? "transform 0.3s ease-in-out, opacity 0.3s ease-in-out"
                  : item.transition === "zoom"
                  ? "transform 0.3s ease-in-out, opacity 0.3s ease-in-out"
                  : "opacity 0.2s ease-in-out",
              transform: (() => {
                // Get base transform from orientation
                const baseTransform =
                  getOrientationStyles(item.orientation).transform || "";

                // Add transition transforms
                let transitionTransform = "";
                if (isLoading || isTransitioning) {
                  if (item.transition === "slide") {
                    transitionTransform = "translateX(100%)";
                  } else if (item.transition === "zoom") {
                    transitionTransform = "scale(0.5)";
                  }
                }

                // Combine transforms
                if (item.orientation === "portrait") {
                  // For portrait, we need to combine rotation with transition
                  if (transitionTransform) {
                    return `translate(-50%, -50%) rotate(-90deg) ${transitionTransform}`;
                  }
                  return baseTransform;
                } else {
                  // For landscape/auto, return transition transform or default position
                  if (item.transition === "slide") {
                    return transitionTransform || "translateX(0)";
                  } else if (item.transition === "zoom") {
                    return transitionTransform || "scale(1)";
                  }
                  return "none";
                }
              })(),
            }}
          />
          {showLoadingOverlay && (
            <LoadingOverlay type="image" itemName={item?.name} />
          )}
        </>
      )}

      {item.content_type === "html" && (
        <div
          className={`media-container ${transitionClass}`}
          style={{
            ...getOrientationStyles(item.orientation),
            opacity: isLoading || isTransitioning ? 0.1 : 1,
            transition:
              item.transition === "fade"
                ? "opacity 0.3s ease-in-out"
                : item.transition === "slide"
                ? "transform 0.3s ease-in-out, opacity 0.3s ease-in-out"
                : item.transition === "zoom"
                ? "transform 0.3s ease-in-out, opacity 0.3s ease-in-out"
                : "opacity 0.2s ease-in-out",
            transform:
              item.transition === "slide" && (isLoading || isTransitioning)
                ? "translateX(50%)"
                : item.transition === "zoom" && (isLoading || isTransitioning)
                ? "scale(0.9)"
                : getOrientationStyles(item.orientation).transform || "none",
          }}
          dangerouslySetInnerHTML={{
            __html: item.html_content || "<p>No HTML content</p>",
          }}
        />
      )}

      {/* Show user interaction prompt if autoplay is blocked */}
      {needsUserInteraction && (
        <div
          className="fullscreen flex items-center justify-center bg-black bg-opacity-90 cursor-pointer z-50 absolute top-0 left-0"
          onClick={() => {
            const video = videoRef.current;
            if (video) {
              video
                .play()
                .then(() => {
                  setNeedsUserInteraction(false);
                })
                .catch(console.error);
            }
          }}
        >
          <div className="text-center text-white">
            <div className="text-6xl mb-4">▶️</div>
            <h2 className="text-2xl mb-4">Click to Start Playback</h2>
            <p className="text-gray-400">
              Browser requires user interaction to play videos
            </p>
          </div>
        </div>
      )}

      {/* Show error overlay if needed */}
      {error && (
        <div className="fullscreen flex items-center justify-center bg-red-900 absolute top-0 left-0 z-50">
          <div className="text-center text-white">
            <h2 className="text-2xl mb-4">Playback Error</h2>
            <p className="text-red-200">{error}</p>
            <p className="text-sm text-red-300 mt-2">
              Skipping to next item...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaPlayer;
