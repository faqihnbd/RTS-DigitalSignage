import React, { useState, useEffect, useRef } from "react";
import MediaPlayer from "./MediaPlayer";
import QRCode from "qrcode";

// WebpageZone component with CSP error handling
const WebpageZone = ({ zone }) => {
  const [iframeError, setIframeError] = useState(false);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const iframeRef = useRef(null);

  const handleIframeError = () => {
    console.error("Iframe failed to load:", zone.settings?.url);
    setIframeError(true);
    setLoadAttempts((prev) => prev + 1);
  };

  const handleIframeLoad = () => {
    setIframeError(false);
  };

  // Reset error state when URL changes
  useEffect(() => {
    setIframeError(false);
    setLoadAttempts(0);
  }, [zone.settings?.url]);

  // Auto-retry for CSP errors after 5 seconds
  useEffect(() => {
    if (iframeError && loadAttempts < 3) {
      const timer = setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = zone.settings?.url;
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [iframeError, loadAttempts, zone.settings?.url]);

  if (!zone.settings?.url) {
    return (
      <div
        className="w-full h-full flex items-center justify-center text-gray-500"
        style={{ backgroundColor: zone.settings?.background || "#ffffff" }}
      >
        <div className="text-center">
          <div className="text-4xl mb-2">🌐</div>
          <p className="text-sm">Webpage Zone</p>
          <p className="text-xs mt-1 opacity-75">No URL configured</p>
          <p className="text-xs mt-2 px-4">Configure URL in zone settings</p>
        </div>
      </div>
    );
  }

  if (iframeError && loadAttempts >= 3) {
    return (
      <div
        className="w-full h-full flex items-center justify-center text-gray-500"
        style={{ backgroundColor: zone.settings?.background || "#ffffff" }}
      >
        <div className="text-center p-4">
          <div className="text-4xl mb-2">⚠️</div>
          <p className="text-sm font-medium">Website Access Blocked</p>
          <p className="text-xs mt-1 opacity-75">
            This website cannot be displayed in a frame
          </p>
          <div className="mt-3 p-2 bg-gray-100 rounded text-xs">
            <p className="font-medium">URL: {zone.settings.url}</p>
            <p className="mt-1">
              Reason: Content Security Policy (CSP) restriction
            </p>
          </div>
          <p className="text-xs mt-2 opacity-60">
            Try opening this website in a new browser tab
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full overflow-hidden relative"
      style={{ backgroundColor: zone.settings?.background || "#ffffff" }}
    >
      {iframeError && loadAttempts < 3 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">
              Retrying... ({loadAttempts + 1}/3)
            </p>
          </div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={zone.settings.url}
        className="w-full h-full border-none"
        style={{
          zoom: zone.settings?.zoom || 1.0,
          transform: zone.settings?.scale
            ? `scale(${zone.settings.scale})`
            : "none",
          transformOrigin: "top left",
        }}
        title={`Webpage - ${zone.zone_name}`}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-top-navigation"
        allow="fullscreen; autoplay; camera; microphone; geolocation"
        loading="lazy"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      />
    </div>
  );
};

const LayoutPlayer = ({ playlist, onEnded, isPlaying }) => {
  const [currentZoneItems, setCurrentZoneItems] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [multiContentIndexes, setMultiContentIndexes] = useState({});
  const [playlistIndexes, setPlaylistIndexes] = useState({}); // Track playlist item indexes
  const [contentCache, setContentCache] = useState({}); // Cache for content data
  const [playlistVersions, setPlaylistVersions] = useState({}); // Track playlist versions to detect changes
  const multiContentTimers = useRef({});
  const playlistTimers = useRef({}); // Timers for playlist zones
  const [weatherData, setWeatherData] = useState({
    temperature: 28,
    condition: "Cerah",
    humidity: 65,
    wind_speed: 12,
    pressure: 1013,
    uv_index: 5,
    visibility: 10,
    feels_like: 31,
    weather_icon: "☀️",
    forecast: [
      {
        day: "Besok",
        temp_high: 30,
        temp_low: 24,
        condition: "Berawan",
        icon: "⛅",
      },
      {
        day: "Lusa",
        temp_high: 29,
        temp_low: 23,
        condition: "Hujan",
        icon: "🌧️",
      },
      {
        day: "Selasa",
        temp_high: 31,
        temp_low: 25,
        condition: "Cerah",
        icon: "☀️",
      },
    ],
  });

  // Function to fetch content by ID
  const fetchContentById = async (contentId) => {
    if (contentCache[contentId]) {
      return contentCache[contentId];
    }

    try {
      const baseUrl =
        import.meta.env.VITE_API_BASE_URL ||
        import.meta.env.VITE_API_URL ||
        "http://localhost:3000";

      const response = await fetch(
        `${baseUrl}/api/contents/public/${contentId}`
      );
      if (response.ok) {
        const contentData = await response.json();
        setContentCache((prev) => ({ ...prev, [contentId]: contentData }));
        return contentData;
      } else {
        console.error(
          `[DEBUG] Failed to fetch content ${contentId}: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.error(`[DEBUG] Failed to fetch content ${contentId}:`, error);
    }

    return { id: contentId };
  };

  // Function to create a playlist version hash for change detection
  const createPlaylistVersion = (items) => {
    if (!items || items.length === 0) return "";
    return items.map((item) => `${item.id}:${item.order}`).join(",");
  };

  // Function to get sorted playlist items with duplicate order handling
  const getSortedPlaylistItems = (items) => {
    if (!items || items.length === 0) return [];

    // Sort by order first, then by id as secondary sort for consistency with duplicates
    const sorted = [...items].sort((a, b) => {
      if (a.order === b.order) {
        // If orders are the same, sort by id to ensure consistent ordering
        return a.id - b.id;
      }
      return a.order - b.order;
    });

    return sorted;
  };

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize zone content from playlist
  useEffect(() => {
    const initializeZoneContent = async () => {
      if (playlist?.layout?.zones) {
        const zoneItems = {};
        const indexes = {};
        const playlistIdx = {};

        for (const zone of playlist.layout.zones) {
          // Handle multiple content
          if (
            zone.settings?.multiple_content &&
            zone.settings?.content_list?.length > 0
          ) {
            indexes[zone.id] = 0; // Start with first item
            // Set initial content item
            const contentId = zone.settings.content_list[0];

            // Try to find full content data from playlist items
            let contentData = { id: contentId };
            if (playlist?.items) {
              const foundItem = playlist.items.find(
                (item) => item.content && item.content.id === contentId
              );
              if (foundItem?.content) {
                contentData = foundItem.content;
              } else {
                contentData = await fetchContentById(contentId);
              }
            } else {
              contentData = await fetchContentById(contentId);
            }

            zoneItems[zone.id] = contentData;
          } else if (zone.content_id && zone.content) {
            zoneItems[zone.id] = zone.content;
          } else if (zone.playlist_id && zone.playlist) {
            // For zones with playlist, get first item
            if (zone.playlist.items && zone.playlist.items.length > 0) {
              // Get sorted playlist items
              const sortedItems = getSortedPlaylistItems(zone.playlist.items);
              zone.playlist.items = sortedItems;

              // Create version hash for change detection
              const newVersion = createPlaylistVersion(sortedItems);
              setPlaylistVersions((prev) => ({
                ...prev,
                [zone.id]: newVersion,
              }));

              playlistIdx[zone.id] = 0; // Start with first item
              zoneItems[zone.id] = sortedItems[0].content;
            }
          }
        }

        setCurrentZoneItems(zoneItems);
        setMultiContentIndexes(indexes);
        setPlaylistIndexes(playlistIdx);
      }
    };

    initializeZoneContent();
  }, [playlist]);

  // Detect playlist order changes and reset affected zones
  useEffect(() => {
    if (!playlist?.layout?.zones) return;

    playlist.layout.zones.forEach((zone) => {
      if (zone.playlist_id && zone.playlist?.items?.length > 0) {
        const sortedItems = getSortedPlaylistItems(zone.playlist.items);
        const newVersion = createPlaylistVersion(sortedItems);
        const currentVersion = playlistVersions[zone.id];

        // If playlist order has changed, reset the zone
        if (currentVersion && currentVersion !== newVersion) {
          // Clear existing timer for this zone
          if (playlistTimers.current[zone.id]) {
            clearTimeout(playlistTimers.current[zone.id]);
            delete playlistTimers.current[zone.id];
          }

          // Update playlist items with new sorted order
          zone.playlist.items = sortedItems;

          // Reset to first item
          setPlaylistIndexes((prev) => ({
            ...prev,
            [zone.id]: 0,
          }));

          // Update current content to first item
          setCurrentZoneItems((prev) => ({
            ...prev,
            [zone.id]: sortedItems[0].content,
          }));

          // Update version
          setPlaylistVersions((prev) => ({
            ...prev,
            [zone.id]: newVersion,
          }));
        }
      }
    });
  }, [playlist?.layout?.zones, playlistVersions]);

  // Handle multiple content rotation and playlist rotation
  useEffect(() => {
    if (!playlist?.layout?.zones || !isPlaying) return;

    // Clear existing timers
    Object.values(multiContentTimers.current).forEach((timer) =>
      clearInterval(timer)
    );
    Object.values(playlistTimers.current).forEach((timer) =>
      clearInterval(timer)
    );
    multiContentTimers.current = {};
    playlistTimers.current = {};

    playlist.layout.zones.forEach((zone) => {
      // Handle multiple content zones
      if (
        zone.settings?.multiple_content &&
        zone.settings?.content_list?.length > 1
      ) {
        const duration = (zone.settings?.content_duration || 5) * 1000;

        multiContentTimers.current[zone.id] = setInterval(async () => {
          setMultiContentIndexes((prev) => {
            const currentIndex = prev[zone.id] || 0;
            const nextIndex =
              (currentIndex + 1) % zone.settings.content_list.length;

            // Update current content with full content data if available
            const updateContent = async () => {
              const nextContentId = zone.settings.content_list[nextIndex];

              // Try to find full content data from playlist items
              let contentData = { id: nextContentId };
              if (playlist?.items) {
                const foundItem = playlist.items.find(
                  (item) => item.content && item.content.id === nextContentId
                );
                if (foundItem?.content) {
                  contentData = foundItem.content;
                } else {
                  contentData = await fetchContentById(nextContentId);
                }
              } else {
                contentData = await fetchContentById(nextContentId);
              }

              setCurrentZoneItems((prevItems) => ({
                ...prevItems,
                [zone.id]: contentData,
              }));
            };

            updateContent();

            return {
              ...prev,
              [zone.id]: nextIndex,
            };
          });
        }, duration);
      }

      // Handle playlist zones
      if (zone.playlist_id && zone.playlist?.items?.length > 1) {
        // Get sorted playlist items using the utility function
        const sortedItems = getSortedPlaylistItems(zone.playlist.items);
        zone.playlist.items = sortedItems;

        // Check if we should use individual item durations
        const useItemDuration = zone.settings?.use_item_duration !== false; // Default to true

        const setNextPlaylistItem = () => {
          setPlaylistIndexes((prev) => {
            const currentIndex = prev[zone.id] || 0;
            const nextIndex = (currentIndex + 1) % sortedItems.length;
            const currentItem = sortedItems[currentIndex];

            // Get duration for current item
            let itemDuration;
            if (useItemDuration && currentItem.duration_sec) {
              itemDuration = currentItem.duration_sec * 1000; // Use item's duration
            } else {
              itemDuration = (zone.settings?.content_duration || 10) * 1000; // Use zone default
            }

            // Update current content
            setCurrentZoneItems((prevItems) => ({
              ...prevItems,
              [zone.id]: sortedItems[nextIndex].content,
            }));

            // Set timer for the CURRENT item before switching
            setTimeout(() => {
              if (sortedItems?.length > 1) {
                setNextPlaylistItem(); // Recursive call for next transition
              }
            }, itemDuration);

            return {
              ...prev,
              [zone.id]: nextIndex,
            };
          });
        };

        // Start the playlist cycling
        const firstItem = sortedItems[0];
        let firstDuration;
        if (useItemDuration && firstItem.duration_sec) {
          firstDuration = firstItem.duration_sec * 1000;
        } else {
          firstDuration = (zone.settings?.content_duration || 10) * 1000;
        }

        playlistTimers.current[zone.id] = setTimeout(() => {
          setNextPlaylistItem();
        }, firstDuration);
      }
    });

    return () => {
      Object.values(multiContentTimers.current).forEach((timer) =>
        clearInterval(timer)
      );
      Object.values(playlistTimers.current).forEach((timer) => {
        // Clear both setTimeout and setInterval
        clearTimeout(timer);
        clearInterval(timer);
      });
    };
  }, [playlist, isPlaying]);

  const getContentUrl = (content) => {
    if (!content) {
      return null;
    }

    // Handle content with only id (multiple content case)
    if (content.id && !content.filename) {
      // Check content cache first
      if (contentCache[content.id]) {
        const cachedContent = contentCache[content.id];
        if (cachedContent.filename) {
          const baseUrl =
            import.meta.env.VITE_API_BASE_URL ||
            import.meta.env.VITE_API_URL ||
            "http://localhost:3000";
          const url = `${baseUrl}/uploads/${cachedContent.filename}`;
          return url;
        }
      }

      // Try to find the content in playlist
      if (playlist && playlist.PlaylistItems) {
        for (const item of playlist.PlaylistItems) {
          if (item.Content && item.Content.id === content.id) {
            if (item.Content.filename) {
              const baseUrl =
                import.meta.env.VITE_API_BASE_URL ||
                import.meta.env.VITE_API_URL ||
                "http://localhost:3000";
              const url = `${baseUrl}/uploads/${item.Content.filename}`;
              return url;
            }
          }
        }
      }

      // Trigger fetch for content data
      fetchContentById(content.id);
      return null;
    }

    if (!content.filename) {
      return null;
    }

    // Standard content with filename
    const baseUrl =
      import.meta.env.VITE_API_BASE_URL ||
      import.meta.env.VITE_API_URL ||
      "http://localhost:3000";
    const url = `${baseUrl}/uploads/${content.filename}`;
    return url;
  };

  const renderZoneContent = (zone) => {
    const zoneContent = currentZoneItems[zone.id];

    switch (zone.content_type) {
      case "video":
        const videoUrl = getContentUrl(zoneContent);

        return (
          <div className="relative w-full h-full bg-black overflow-hidden">
            {zoneContent && videoUrl ? (
              <video
                key={`${zone.id}-${zoneContent.id}-${videoUrl}`} // Force re-render when content changes
                className="w-full h-full object-cover"
                autoPlay={zone.settings?.autoplay !== false && isPlaying}
                loop={zone.settings?.loop !== false}
                muted={zone.settings?.mute !== false}
                src={videoUrl}
                onEnded={() => handleZoneEnded(zone)}
                onError={(e) => {
                  console.error(`Video load error for zone ${zone.id}:`, {
                    error: e,
                    videoUrl: videoUrl,
                    zoneContent: zoneContent,
                    src: e.target?.src,
                    errorCode: e.target?.error?.code,
                    errorMessage: e.target?.error?.message,
                    networkState: e.target?.networkState,
                    readyState: e.target?.readyState,
                  });
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
                <div className="text-center opacity-60">
                  <div className="text-4xl mb-2">🎬</div>
                  <p className="text-sm">Video Zone</p>
                  <p className="text-xs mt-2">
                    {zone.settings?.multiple_content
                      ? `Content ${multiContentIndexes[zone.id] + 1}/${
                          zone.settings?.content_list?.length || 0
                        } loading...`
                      : "No content assigned"}
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case "image":
        return (
          <div className="relative w-full h-full bg-gray-100 overflow-hidden">
            {zoneContent ? (
              <img
                className="w-full h-full object-cover"
                src={getContentUrl(zoneContent)}
                alt={zoneContent.title}
                onLoad={() => handleImageLoad(zone)}
                onError={(e) => {
                  console.error(`Image load error for zone ${zone.id}:`, e);
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">🖼️</div>
                  <p className="text-sm">Image Zone</p>
                  <p className="text-xs mt-2">
                    {zone.settings?.multiple_content
                      ? "No content in multiple content list"
                      : "No content assigned"}
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case "text":
        const isRunningText = zone.settings?.running_text;
        const textContent =
          zone.settings?.text_content ||
          zone.settings?.text ||
          "Teks akan ditampilkan di sini";

        if (isRunningText) {
          return (
            <div
              className="w-full h-full overflow-hidden flex items-center"
              style={{
                backgroundColor:
                  zone.settings?.background_color || "transparent",
              }}
            >
              <div
                className="whitespace-nowrap animate-marquee"
                style={{
                  color: zone.settings?.text_color || "#ffffff",
                  fontSize: `${zone.settings?.font_size || 24}px`,
                  fontWeight: zone.settings?.font_weight || "normal",
                  animationDuration: `${zone.settings?.running_speed || 10}s`,
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                {textContent}
              </div>
            </div>
          );
        }

        return (
          <div
            className="w-full h-full p-4"
            style={{
              backgroundColor: zone.settings?.background_color || "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent:
                zone.settings?.text_align === "left"
                  ? "flex-start"
                  : zone.settings?.text_align === "right"
                  ? "flex-end"
                  : "center",
            }}
          >
            <div
              style={{
                color: zone.settings?.text_color || "#ffffff",
                fontSize: `${zone.settings?.font_size || 24}px`,
                fontWeight: zone.settings?.font_weight || "normal",
                textAlign: zone.settings?.text_align || "center",
                width: "100%",
                wordWrap: "break-word",
                lineHeight: "1.4",
              }}
            >
              {textContent}
            </div>
          </div>
        );

      case "ticker":
        const isAdvancedTicker = zone.settings?.advanced_ticker;
        const showLogo =
          zone.settings?.show_logo && zone.settings?.logo_content_id;

        if (isAdvancedTicker) {
          return (
            <div
              className="w-full h-full flex items-center overflow-hidden relative"
              style={{
                fontSize: zone.settings?.font_size || "18px",
                backgroundColor: zone.settings?.background_color || "#000000",
                color: zone.settings?.text_color || "#ffffff",
                padding: `${zone.settings?.padding_y || 8}px ${
                  zone.settings?.padding_x || 16
                }px`,
              }}
            >
              {/* Logo Section */}
              {showLogo && (
                <div
                  className="flex-shrink-0 mr-4 flex items-center justify-center"
                  style={{
                    width: zone.settings?.logo_size || "40px",
                    height: zone.settings?.logo_size || "40px",
                  }}
                >
                  <img
                    src={
                      zone.settings?.logo_url ||
                      `/api/contents/public/${zone.settings.logo_content_id}`
                    }
                    alt="Logo"
                    className="max-w-full max-h-full object-contain"
                    style={{
                      filter: zone.settings?.logo_filter || "none",
                      opacity: zone.settings?.logo_opacity || 1.0,
                    }}
                  />
                </div>
              )}

              {/* Scrolling Text */}
              <div className="flex-1 overflow-hidden relative">
                <div
                  className={`${
                    zone.settings?.direction === "vertical"
                      ? "animate-scroll-vertical"
                      : "animate-scroll-horizontal"
                  } whitespace-nowrap absolute flex items-center`}
                  style={{
                    animationDuration: `${
                      20 / (zone.settings?.scroll_speed || 5)
                    }s`,
                    fontWeight: zone.settings?.font_weight || "normal",
                    textShadow: zone.settings?.text_shadow
                      ? "2px 2px 4px rgba(0,0,0,0.5)"
                      : "none",
                    letterSpacing: zone.settings?.letter_spacing || "normal",
                    height: "100%",
                  }}
                >
                  {zone.settings?.text_content ||
                    zone.settings?.text ||
                    "Breaking News: Sistem digital signage telah aktif • Selamat datang di era komunikasi digital • "}
                </div>
              </div>

              {/* Optional Right Logo */}
              {zone.settings?.show_right_logo &&
                zone.settings?.right_logo_content_id && (
                  <div
                    className="flex-shrink-0 ml-4 flex items-center justify-center"
                    style={{
                      width: zone.settings?.right_logo_size || "40px",
                      height: zone.settings?.right_logo_size || "40px",
                    }}
                  >
                    <img
                      src={
                        zone.settings?.right_logo_url ||
                        `/api/contents/public/${zone.settings.right_logo_content_id}`
                      }
                      alt="Right Logo"
                      className="max-w-full max-h-full object-contain"
                      style={{
                        filter: zone.settings?.right_logo_filter || "none",
                        opacity: zone.settings?.right_logo_opacity || 1.0,
                      }}
                    />
                  </div>
                )}
            </div>
          );
        }

        // Standard ticker (backward compatibility)
        return (
          <div
            className="w-full h-full flex items-center bg-black text-white overflow-hidden relative"
            style={{
              fontSize: zone.settings?.font_size || "18px",
              backgroundColor: zone.settings?.background_color || "#000000",
              color: zone.settings?.text_color || "#ffffff",
            }}
          >
            <div
              className={`${
                zone.settings?.direction === "vertical"
                  ? "animate-scroll-vertical"
                  : "animate-scroll-horizontal"
              } whitespace-nowrap absolute`}
              style={{
                animationDuration: `${
                  20 / (zone.settings?.scroll_speed || 5)
                }s`,
              }}
            >
              {zone.settings?.text_content ||
                zone.settings?.text ||
                "Breaking News: Sistem digital signage telah aktif • Selamat datang di era komunikasi digital • "}
            </div>
          </div>
        );

      case "clock":
        const clockStyle = zone.settings?.clock_style || "modern";
        const showSeconds = zone.settings?.show_seconds !== false;
        const showDate = zone.settings?.show_date !== false;
        const timeFormat = zone.settings?.time_format || "24h";
        const customTheme = zone.settings?.custom_theme || {};

        const formatTime = () => {
          return currentTime.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: showSeconds ? "2-digit" : undefined,
            hour12: timeFormat === "12h",
          });
        };

        const formatDate = () => {
          return currentTime.toLocaleDateString("id-ID", {
            weekday: zone.settings?.show_weekday !== false ? "long" : undefined,
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        };

        // Modern Digital Style
        if (clockStyle === "modern") {
          return (
            <div
              className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
              style={{
                background:
                  customTheme.background ||
                  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: customTheme.textColor || "#ffffff",
              }}
            >
              {/* Background Pattern */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)",
                  backgroundSize: "20px 20px",
                }}
              />

              <div className="text-center z-10 p-4">
                {/* Time Display */}
                <div
                  className="font-mono font-bold mb-2 tracking-wider"
                  style={{
                    fontSize: zone.settings?.time_size || "3.5rem",
                    textShadow: "0 4px 8px rgba(0,0,0,0.3)",
                    letterSpacing: "0.05em",
                  }}
                >
                  {formatTime()}
                </div>

                {/* Date Display */}
                {showDate && (
                  <div
                    className="opacity-90 font-medium"
                    style={{
                      fontSize: zone.settings?.date_size || "1.2rem",
                      textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                    }}
                  >
                    {formatDate()}
                  </div>
                )}

                {/* Optional Timezone */}
                {zone.settings?.show_timezone && (
                  <div className="text-xs opacity-70 mt-2">
                    {zone.settings?.timezone || "Asia/Jakarta"}
                  </div>
                )}
              </div>
            </div>
          );
        }

        // Analog Style
        if (clockStyle === "analog") {
          const now = currentTime;
          const hours = now.getHours() % 12;
          const minutes = now.getMinutes();
          const seconds = now.getSeconds();

          const hourAngle = hours * 30 + minutes * 0.5;
          const minuteAngle = minutes * 6;
          const secondAngle = seconds * 6;

          return (
            <div
              className="w-full h-full flex flex-col items-center justify-center relative"
              style={{
                background:
                  customTheme.background ||
                  "linear-gradient(135deg, #2c3e50 0%, #3498db 100%)",
                color: customTheme.textColor || "#ffffff",
              }}
            >
              {/* Analog Clock */}
              <div
                className="relative mb-4"
                style={{ width: "120px", height: "120px" }}
              >
                <svg viewBox="0 0 120 120" className="w-full h-full">
                  {/* Clock Face */}
                  <circle
                    cx="60"
                    cy="60"
                    r="58"
                    fill="rgba(255,255,255,0.1)"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="2"
                  />

                  {/* Hour Markers */}
                  {[...Array(12)].map((_, i) => (
                    <line
                      key={i}
                      x1="60"
                      y1="8"
                      x2="60"
                      y2="16"
                      stroke="rgba(255,255,255,0.8)"
                      strokeWidth="2"
                      transform={`rotate(${i * 30} 60 60)`}
                    />
                  ))}

                  {/* Hour Hand */}
                  <line
                    x1="60"
                    y1="60"
                    x2="60"
                    y2="35"
                    stroke="#ffffff"
                    strokeWidth="4"
                    strokeLinecap="round"
                    transform={`rotate(${hourAngle} 60 60)`}
                  />

                  {/* Minute Hand */}
                  <line
                    x1="60"
                    y1="60"
                    x2="60"
                    y2="20"
                    stroke="#ffffff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    transform={`rotate(${minuteAngle} 60 60)`}
                  />

                  {/* Second Hand */}
                  {showSeconds && (
                    <line
                      x1="60"
                      y1="60"
                      x2="60"
                      y2="15"
                      stroke="#ff6b6b"
                      strokeWidth="1"
                      strokeLinecap="round"
                      transform={`rotate(${secondAngle} 60 60)`}
                    />
                  )}

                  {/* Center Dot */}
                  <circle cx="60" cy="60" r="4" fill="#ffffff" />
                </svg>
              </div>

              {/* Digital Time */}
              <div
                className="font-mono font-bold text-center"
                style={{
                  fontSize: zone.settings?.digital_size || "1.5rem",
                  textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                }}
              >
                {formatTime()}
              </div>

              {/* Date */}
              {showDate && (
                <div
                  className="opacity-90 text-center mt-2"
                  style={{
                    fontSize: zone.settings?.date_size || "0.9rem",
                  }}
                >
                  {formatDate()}
                </div>
              )}
            </div>
          );
        }

        // Classic/Retro Style
        if (clockStyle === "retro") {
          return (
            <div
              className="w-full h-full flex flex-col items-center justify-center relative"
              style={{
                background:
                  customTheme.background ||
                  "linear-gradient(45deg, #1a1a1a 0%, #2d2d2d 100%)",
                color: customTheme.textColor || "#00ff00",
                fontFamily: "monospace",
              }}
            >
              {/* Retro Border */}
              <div className="absolute inset-2 border-2 border-current opacity-30 rounded-lg"></div>

              <div className="text-center z-10 p-4">
                {/* Time Display with Glow Effect */}
                <div
                  className="font-mono font-bold mb-2 tracking-widest relative"
                  style={{
                    fontSize: zone.settings?.time_size || "3rem",
                    textShadow: `
                      0 0 5px currentColor,
                      0 0 10px currentColor,
                      0 0 15px currentColor,
                      0 0 20px currentColor
                    `,
                    filter: "brightness(1.2)",
                  }}
                >
                  {formatTime()}
                </div>

                {/* Date Display */}
                {showDate && (
                  <div
                    className="opacity-80 font-mono tracking-wider"
                    style={{
                      fontSize: zone.settings?.date_size || "1rem",
                      textShadow: "0 0 5px currentColor",
                    }}
                  >
                    {formatDate()}
                  </div>
                )}
              </div>

              {/* Retro Scan Lines Effect */}
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  background:
                    "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
                }}
              />
            </div>
          );
        }

        // Default/Legacy Style (backward compatibility)
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700 text-white">
            <div className="text-center p-4">
              <div
                className="font-bold mb-2"
                style={{ fontSize: zone.settings?.time_size || "2.5rem" }}
              >
                {formatTime()}
              </div>
              {showDate && (
                <div
                  className="opacity-80"
                  style={{ fontSize: zone.settings?.date_size || "1rem" }}
                >
                  {formatDate()}
                </div>
              )}
            </div>
          </div>
        );

      case "weather":
        const weatherStyle = zone.settings?.weather_style || "modern";
        const showForecast = zone.settings?.show_forecast !== false;
        const showDetails = zone.settings?.show_details !== false;
        const location = zone.settings?.location || "Jakarta";
        const customWeatherTheme = zone.settings?.custom_theme || {};

        // Modern Comprehensive Weather
        if (weatherStyle === "modern") {
          return (
            <div
              className="w-full h-full flex flex-col relative overflow-hidden"
              style={{
                background:
                  customWeatherTheme.background ||
                  "linear-gradient(135deg, #74b9ff 0%, #0984e3 50%, #00b894 100%)",
                color: customWeatherTheme.textColor || "#ffffff",
                padding: "16px",
              }}
            >
              {/* Background Animation */}
              <div className="absolute inset-0 opacity-20">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(circle at 20% 80%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)",
                  }}
                />
              </div>

              <div className="relative z-10 h-full flex flex-col">
                {/* Main Weather Info */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="text-5xl mr-4">
                      {weatherData.weather_icon}
                    </div>
                    <div>
                      <div
                        className="font-bold"
                        style={{
                          fontSize: zone.settings?.temp_size || "2.5rem",
                        }}
                      >
                        {weatherData.temperature}°C
                      </div>
                      <div
                        className="opacity-90 font-medium"
                        style={{
                          fontSize: zone.settings?.condition_size || "1rem",
                        }}
                      >
                        {weatherData.condition}
                      </div>
                      <div className="text-sm opacity-80">
                        Terasa seperti {weatherData.feels_like}°C
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-medium mb-1">{location}</div>
                    <div className="text-xs opacity-80">
                      {currentTime.toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>

                {/* Weather Details */}
                {showDetails && (
                  <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                    <div className="bg-white bg-opacity-20 rounded-lg p-2">
                      <div className="opacity-80">Kelembaban</div>
                      <div className="font-semibold">
                        {weatherData.humidity}%
                      </div>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-2">
                      <div className="opacity-80">Angin</div>
                      <div className="font-semibold">
                        {weatherData.wind_speed} km/h
                      </div>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-2">
                      <div className="opacity-80">Tekanan</div>
                      <div className="font-semibold">
                        {weatherData.pressure} hPa
                      </div>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-2">
                      <div className="opacity-80">UV Index</div>
                      <div className="font-semibold">
                        {weatherData.uv_index}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3-Day Forecast */}
                {showForecast && weatherData.forecast && (
                  <div className="mt-auto">
                    <div className="text-sm opacity-80 mb-2">
                      Perkiraan 3 Hari
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {weatherData.forecast.map((day, index) => (
                        <div
                          key={index}
                          className="bg-white bg-opacity-20 rounded-lg p-2 text-center"
                        >
                          <div className="font-medium mb-1">{day.day}</div>
                          <div className="text-lg mb-1">{day.icon}</div>
                          <div className="font-semibold">{day.temp_high}°</div>
                          <div className="opacity-80">{day.temp_low}°</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        }

        // Minimal/Clean Style
        if (weatherStyle === "minimal") {
          return (
            <div
              className="w-full h-full flex flex-col items-center justify-center relative"
              style={{
                background:
                  customWeatherTheme.background ||
                  "linear-gradient(45deg, #f8f9fa 0%, #e9ecef 100%)",
                color: customWeatherTheme.textColor || "#495057",
              }}
            >
              <div className="text-center">
                <div className="text-6xl mb-3">{weatherData.weather_icon}</div>
                <div
                  className="font-light mb-2"
                  style={{ fontSize: zone.settings?.temp_size || "3rem" }}
                >
                  {weatherData.temperature}°
                </div>
                <div
                  className="opacity-80 mb-3"
                  style={{
                    fontSize: zone.settings?.condition_size || "1.2rem",
                  }}
                >
                  {weatherData.condition}
                </div>
                <div className="text-sm opacity-60">{location}</div>

                {showDetails && (
                  <div className="flex justify-center gap-4 mt-4 text-xs">
                    <span>💧 {weatherData.humidity}%</span>
                    <span>💨 {weatherData.wind_speed} km/h</span>
                  </div>
                )}
              </div>
            </div>
          );
        }

        // Card Style with Glassmorphism
        if (weatherStyle === "glass") {
          return (
            <div
              className="w-full h-full flex items-center justify-center relative overflow-hidden"
              style={{
                background:
                  customWeatherTheme.background ||
                  "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: customWeatherTheme.textColor || "#ffffff",
              }}
            >
              {/* Background Blur Circles */}
              <div className="absolute top-1/4 left-1/4 w-20 h-20 bg-white opacity-10 rounded-full blur-xl"></div>
              <div className="absolute bottom-1/4 right-1/4 w-16 h-16 bg-blue-300 opacity-20 rounded-full blur-xl"></div>

              <div className="text-center z-10 p-6">
                <div className="text-5xl mb-4">{weatherData.weather_icon}</div>
                <div
                  className="font-bold mb-2"
                  style={{ fontSize: zone.settings?.temp_size || "2.8rem" }}
                >
                  {weatherData.temperature}°C
                </div>
                <div
                  className="opacity-90 mb-3"
                  style={{
                    fontSize: zone.settings?.condition_size || "1.1rem",
                  }}
                >
                  {weatherData.condition}
                </div>
                <div className="text-sm opacity-80 mb-4">{location}</div>

                {showDetails && (
                  <div className="text-xs opacity-70 space-y-1">
                    <div>
                      Kelembaban: {weatherData.humidity}% • Angin:{" "}
                      {weatherData.wind_speed} km/h
                    </div>
                    <div>Terasa seperti {weatherData.feels_like}°C</div>
                  </div>
                )}
              </div>
            </div>
          );
        }

        // Default/Legacy Style (backward compatibility)
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-cyan-400 to-blue-500 text-white p-4">
            <div className="text-center">
              <div className="text-4xl mb-2">☀️</div>
              <div className="text-3xl font-bold">
                {weatherData.temperature}°C
              </div>
              <div className="text-sm opacity-90 mb-1">
                {weatherData.condition}
              </div>
              <div className="text-xs opacity-75">
                {location} • Kelembaban {weatherData.humidity}%
              </div>
            </div>
          </div>
        );

      case "qr_code":
        const QRCodeRenderer = () => {
          const [qrDataURL, setQrDataURL] = useState("");

          useEffect(() => {
            const generateQR = async () => {
              try {
                const qrText =
                  zone.settings?.text ||
                  zone.settings?.url ||
                  "https://example.com";
                const size = parseInt(zone.settings?.size) || 200;

                const dataURL = await QRCode.toDataURL(qrText, {
                  width: size,
                  height: size,
                  margin: 2,
                  color: {
                    dark: zone.settings?.color || "#000000",
                    light: zone.settings?.background || "#FFFFFF",
                  },
                });
                setQrDataURL(dataURL);
              } catch (error) {
                console.error("Error generating QR code:", error);
              }
            };

            generateQR();
          }, [zone.settings]);

          return qrDataURL ? (
            <img
              src={qrDataURL}
              alt="QR Code"
              className="max-w-full max-h-full object-contain"
              style={{
                opacity: zone.settings?.opacity || 1.0,
                filter: zone.settings?.filter || "none",
              }}
            />
          ) : (
            <div className="animate-pulse">
              <div
                className="bg-gray-300 rounded"
                style={{
                  width: zone.settings?.size || "120px",
                  height: zone.settings?.size || "120px",
                }}
              ></div>
            </div>
          );
        };

        return (
          <div
            className="w-full h-full flex items-center justify-center p-4"
            style={{
              backgroundColor: zone.settings?.background || "transparent",
            }}
          >
            <QRCodeRenderer />
          </div>
        );

      case "webpage":
        return <WebpageZone zone={zone} />;

      case "playlist":
        // For playlist zones, cycle through playlist items with better handling
        const currentPlaylistIndex = playlistIndexes[zone.id] || 0;

        return (
          <div className="w-full h-full bg-gray-900 overflow-hidden">
            {zoneContent ? (
              zoneContent.type === "video" ? (
                <video
                  key={`${zone.id}-${currentPlaylistIndex}-${zoneContent.id}`} // Force re-render when content changes
                  className="w-full h-full object-cover"
                  autoPlay={isPlaying}
                  loop={false} // Don't loop individual items
                  muted={zone.settings?.mute !== false}
                  src={getContentUrl(zoneContent)}
                  onEnded={() => handlePlaylistZoneEnded(zone)}
                  onError={(e) => {
                    console.error(
                      `Playlist video error for zone ${zone.id}:`,
                      e
                    );
                  }}
                />
              ) : zoneContent.type === "image" ? (
                <img
                  key={`${zone.id}-${currentPlaylistIndex}-${zoneContent.id}`}
                  className="w-full h-full object-cover"
                  src={getContentUrl(zoneContent)}
                  alt={zoneContent.title}
                  onLoad={() => handleImageLoad(zone)}
                  onError={(e) => {
                    console.error(
                      `Playlist image error for zone ${zone.id}:`,
                      e
                    );
                  }}
                />
              ) : (
                <div className="w-full h-full p-4 text-white">
                  <div
                    dangerouslySetInnerHTML={{
                      __html:
                        zoneContent.html_content ||
                        zoneContent.title ||
                        "No content",
                    }}
                  />
                </div>
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <div className="text-center opacity-60">
                  <div className="text-4xl mb-2">📺</div>
                  <p className="text-sm">Playlist Zone</p>
                  <p className="text-xs mt-2">
                    {zone.playlist?.items?.length > 0
                      ? `Item ${currentPlaylistIndex + 1}/${
                          zone.playlist.items.length
                        } loading...`
                      : "No playlist items"}
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case "logo":
        return (
          <div
            className="w-full h-full flex items-center justify-center p-2"
            style={{
              backgroundColor: zone.settings?.background || "transparent",
            }}
          >
            {zoneContent ? (
              <img
                className="object-contain"
                src={getContentUrl(zoneContent)}
                alt="Logo"
                style={{
                  maxWidth: zone.settings?.max_width || "100%",
                  maxHeight: zone.settings?.max_height || "100%",
                  width: zone.settings?.width || "auto",
                  height: zone.settings?.height || "auto",
                  opacity: zone.settings?.opacity || 1.0,
                  filter: zone.settings?.filter || "none",
                  borderRadius: zone.settings?.border_radius || "0px",
                  border: zone.settings?.border || "none",
                }}
                onError={(e) => {
                  console.error(
                    "Logo failed to load:",
                    getContentUrl(zoneContent)
                  );
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <div className="text-center text-gray-400 opacity-60">
                <div className="text-4xl mb-2">🏢</div>
                <p className="text-sm">Logo Zone</p>
                <p className="text-xs mt-1 opacity-75">No logo assigned</p>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white">
            <div className="text-center opacity-60">
              <p className="text-sm">{zone.zone_name}</p>
              <p className="text-xs opacity-75 capitalize">
                {zone.content_type.replace("_", " ")}
              </p>
            </div>
          </div>
        );
    }
  };

  const handleZoneEnded = (zone) => {
    // Handle when video in zone ends
  };

  const handleImageLoad = (zone) => {
    // Handle image load, maybe set timer for duration
    if (zone.settings?.duration || zone.settings?.content_duration) {
      const duration =
        (zone.settings?.duration || zone.settings?.content_duration || 10) *
        1000;
      setTimeout(() => {
        handleZoneEnded(zone);
      }, duration);
    }
  };

  const handlePlaylistZoneEnded = (zone) => {
    // This will be handled by the timer-based cycling, but we can also trigger immediate advance
    if (zone.playlist?.items && zone.playlist.items.length > 1) {
      setPlaylistIndexes((prev) => {
        const currentIndex = prev[zone.id] || 0;
        const nextIndex = (currentIndex + 1) % zone.playlist.items.length;

        // Update current content
        setCurrentZoneItems((prevItems) => ({
          ...prevItems,
          [zone.id]: zone.playlist.items[nextIndex].content,
        }));

        return {
          ...prev,
          [zone.id]: nextIndex,
        };
      });
    }
  };

  if (!playlist?.layout) {
    // Fallback to regular fullscreen if no layout
    return (
      <div className="fullscreen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-4xl mb-4">📺</div>
          <p>Layout tidak tersedia</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fullscreen bg-black relative overflow-hidden">
      {/* Render all zones */}
      {playlist.layout.zones?.map((zone) => (
        <div
          key={zone.id}
          className="absolute"
          style={{
            left: `${zone.position.x}%`,
            top: `${zone.position.y}%`,
            width: `${zone.position.width}%`,
            height: `${zone.position.height}%`,
            zIndex: zone.z_index || 1,
            display: zone.is_visible === false ? "none" : "block",
          }}
        >
          {renderZoneContent(zone)}
        </div>
      ))}

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes scroll-horizontal {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }

        @keyframes scroll-vertical {
          0% {
            transform: translateY(100%);
          }
          100% {
            transform: translateY(-100%);
          }
        }

        .animate-scroll-horizontal {
          animation: scroll-horizontal linear infinite;
        }

        .animate-scroll-vertical {
          animation: scroll-vertical linear infinite;
        }
      `}</style>
    </div>
  );
};

export default LayoutPlayer;
