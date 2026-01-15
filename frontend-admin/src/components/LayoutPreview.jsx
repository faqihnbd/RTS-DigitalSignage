import React, { useState, useEffect } from "react";
import {
  ArrowLeftIcon,
  PlayIcon,
  PauseIcon,
  ArrowsPointingOutIcon,
  Cog6ToothIcon,
  FilmIcon,
  PhotoIcon,
  GlobeAltIcon,
  ClockIcon,
  CloudIcon,
  QrCodeIcon,
  DocumentTextIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/outline";

export default function LayoutPreview({ layout, onClose }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weatherData, setWeatherData] = useState({
    temperature: 28,
    condition: "Cerah",
    humidity: 65,
  });
  // Track current playlist item index for each playlist zone
  const [playlistIndexes, setPlaylistIndexes] = useState({});

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle playlist cycling
  useEffect(() => {
    if (!layout?.zones || !isPlaying) return;

    const timers = [];

    layout.zones.forEach((zone) => {
      if (zone.content_type === "playlist") {
        const selectedPlaylist =
          zone.playlist ||
          (zone.playlist_id &&
            layout.playlists?.find((p) => p.id === zone.playlist_id));

        if (
          selectedPlaylist &&
          selectedPlaylist.items &&
          selectedPlaylist.items.length > 1
        ) {
          const timer = setInterval(() => {
            setPlaylistIndexes((prev) => {
              const currentIndex = prev[zone.id] || 0;
              const nextIndex =
                (currentIndex + 1) % selectedPlaylist.items.length;
              return { ...prev, [zone.id]: nextIndex };
            });
          }, 5000); // Change every 5 seconds for preview

          timers.push(timer);
        }
      }
    });

    return () => {
      timers.forEach((timer) => clearInterval(timer));
    };
  }, [layout, isPlaying]);

  const getContentTypeIcon = (type) => {
    const icons = {
      video: FilmIcon,
      image: PhotoIcon,
      text: DocumentTextIcon,
      webpage: GlobeAltIcon,
      playlist: RectangleStackIcon,
      ticker: DocumentTextIcon,
      clock: ClockIcon,
      weather: CloudIcon,
      qr_code: QrCodeIcon,
      logo: PhotoIcon,
    };
    return icons[type] || DocumentTextIcon;
  };

  const renderZoneContent = (zone) => {
    const IconComponent = getContentTypeIcon(zone.content_type);

    switch (zone.content_type) {
      case "video":
        const getVideoUrl = (content) => {
          if (!content?.filename) return null;
          const baseUrl =
            import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
          return `${baseUrl}/uploads/${content.filename}`;
        };

        // Handle multiple content case for videos
        if (
          zone.settings?.multiple_content &&
          zone.settings?.content_list?.length > 0
        ) {
          // For preview, show first video in the multiple content list
          const firstContentId = zone.settings.content_list[0];
          const firstContent = layout.contents?.find(
            (c) => c.id === firstContentId
          ) || {
            id: firstContentId,
            filename: `content-${firstContentId}`,
            type: "video",
          };

          const multiVideoUrl = getVideoUrl(firstContent);
          return (
            <div className="relative w-full h-full bg-black rounded overflow-hidden">
              {multiVideoUrl ? (
                <video
                  className="w-full h-full object-cover"
                  autoPlay={zone.settings?.autoplay !== false && isPlaying}
                  loop={zone.settings?.loop !== false}
                  muted={zone.settings?.mute !== false}
                  src={multiVideoUrl}
                  onError={(e) => {
                    console.error("Preview multiple video error:", {
                      error: e,
                      videoUrl: multiVideoUrl,
                      content: firstContent,
                    });
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white">
                  <div className="text-center">
                    <RectangleStackIcon className="h-8 w-8 mx-auto mb-2 opacity-60" />
                    <p className="text-sm opacity-60">Multiple Video</p>
                    <p className="text-xs opacity-40">
                      {zone.settings.content_list.length} items
                    </p>
                  </div>
                </div>
              )}
              {/* Multiple content indicator */}
              <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                Multiple: 1/{zone.settings.content_list.length}
              </div>
              {!isPlaying && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <PauseIcon className="h-12 w-12 text-white" />
                </div>
              )}
            </div>
          );
        }

        // Single video case
        const videoUrl = getVideoUrl(zone.content);
        return (
          <div className="relative w-full h-full bg-black rounded overflow-hidden">
            {zone.content && videoUrl ? (
              <video
                className="w-full h-full object-cover"
                autoPlay={zone.settings?.autoplay !== false}
                loop={zone.settings?.loop !== false}
                muted={zone.settings?.mute !== false}
                src={videoUrl}
                onError={(e) => {
                  console.error("Preview video error:", {
                    error: e,
                    videoUrl: videoUrl,
                    content: zone.content,
                    zone: zone,
                  });
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white">
                <div className="text-center">
                  <FilmIcon className="h-8 w-8 mx-auto mb-2 opacity-60" />
                  <p className="text-sm opacity-60">Video tidak dipilih</p>
                  {zone.content && (
                    <p className="text-xs opacity-40 mt-1">
                      ID: {zone.content.id} | File:{" "}
                      {zone.content.filename || "N/A"}
                    </p>
                  )}
                </div>
              </div>
            )}
            {!isPlaying && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <PauseIcon className="h-12 w-12 text-white" />
              </div>
            )}
          </div>
        );

      case "image":
        const getImageUrl = (content) => {
          if (!content?.filename) return null;
          const baseUrl =
            import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
          return `${baseUrl}/uploads/${content.filename}`;
        };

        // Handle multiple content case for images
        if (
          zone.settings?.multiple_content &&
          zone.settings?.content_list?.length > 0
        ) {
          // For preview, show first image in the multiple content list
          const firstContentId = zone.settings.content_list[0];
          const firstContent = layout.contents?.find(
            (c) => c.id === firstContentId
          ) || {
            id: firstContentId,
            filename: `content-${firstContentId}`,
            type: "image",
          };

          const multiImageUrl = getImageUrl(firstContent);
          return (
            <div className="relative w-full h-full rounded overflow-hidden">
              {multiImageUrl ? (
                <img
                  className="w-full h-full object-cover"
                  src={multiImageUrl}
                  alt={firstContent.title || "Multiple content preview"}
                  onError={(e) => {
                    console.error("Preview multiple image error:", {
                      error: e,
                      imageUrl: multiImageUrl,
                      content: firstContent,
                    });
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <div className="text-center text-gray-500">
                    <RectangleStackIcon className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Multiple Content</p>
                    <p className="text-xs opacity-60">
                      {zone.settings.content_list.length} items
                    </p>
                  </div>
                </div>
              )}
              {/* Multiple content indicator */}
              <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                Multiple: 1/{zone.settings.content_list.length}
              </div>
            </div>
          );
        }

        // Single image case
        const imageUrl = getImageUrl(zone.content);
        return (
          <div className="relative w-full h-full rounded overflow-hidden">
            {zone.content && imageUrl ? (
              <img
                className="w-full h-full object-cover"
                src={imageUrl}
                alt={zone.content.title}
                onError={(e) => {
                  console.error("Preview image error:", {
                    error: e,
                    imageUrl: imageUrl,
                    content: zone.content,
                    zone: zone,
                  });
                  // Try alternative URL construction
                  const altUrl = `${
                    import.meta.env.VITE_API_BASE_URL ||
                    import.meta.env.VITE_API_URL
                  }/api/content/${zone.content.id}/file`;
                  console.log("Trying alternative URL:", altUrl);
                  e.target.src = altUrl;
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <div className="text-center text-gray-500">
                  <PhotoIcon className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Gambar tidak dipilih</p>
                  {zone.content && (
                    <p className="text-xs opacity-60 mt-1">
                      ID: {zone.content.id} | File:{" "}
                      {zone.content.filename || "N/A"}
                    </p>
                  )}
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
          "Teks belum diatur";

        if (isRunningText) {
          return (
            <div
              className="w-full h-full overflow-hidden relative flex items-center"
              style={{
                backgroundColor: zone.settings?.background_color || "#ffffff",
              }}
            >
              <div
                className="absolute whitespace-nowrap"
                style={{
                  left: 0,
                  color: zone.settings?.text_color || "#000000",
                  fontSize: zone.settings?.font_size || "16px",
                  animation: `marquee-slide ${
                    zone.settings?.running_speed || 10
                  }s linear infinite`,
                }}
              >
                {textContent}
              </div>
            </div>
          );
        }

        return (
          <div
            className="w-full h-full flex items-center justify-center p-4 rounded"
            style={{
              backgroundColor: zone.settings?.background_color || "#ffffff",
              color: zone.settings?.text_color || "#000000",
              fontSize: zone.settings?.font_size || "16px",
              textAlign: zone.settings?.text_align || "center",
            }}
          >
            <p className="text-center">{textContent}</p>
          </div>
        );

      case "ticker":
        return (
          <div
            className="w-full h-full flex items-center bg-black text-white overflow-hidden"
            style={{ fontSize: zone.settings?.font_size || "18px" }}
          >
            <div className="animate-marquee whitespace-nowrap">
              {zone.settings?.text ||
                "Breaking News: Teks ticker akan ditampilkan di sini • Update terbaru sistem digital signage • "}
            </div>
          </div>
        );

      case "clock":
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700 text-white rounded">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">
                {currentTime.toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: zone.settings?.format?.includes("ss")
                    ? "2-digit"
                    : undefined,
                  hour12: zone.settings?.format?.includes("A") || false,
                })}
              </div>
              <div className="text-lg opacity-80">
                {currentTime.toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>
        );

      case "weather":
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-cyan-400 to-blue-500 text-white rounded p-4">
            <CloudIcon className="h-12 w-12 mb-2" />
            <div className="text-center">
              <div className="text-3xl font-bold">
                {weatherData.temperature}°C
              </div>
              <div className="text-sm opacity-90">{weatherData.condition}</div>
              <div className="text-xs opacity-75 mt-1">
                Kelembaban {weatherData.humidity}%
              </div>
            </div>
          </div>
        );

      case "qr_code":
        return (
          <div className="w-full h-full flex items-center justify-center bg-white p-4 rounded">
            <div className="bg-black p-4 rounded">
              <QrCodeIcon className="h-20 w-20 text-white" />
            </div>
          </div>
        );

      case "webpage":
        return (
          <div className="w-full h-full bg-white rounded overflow-hidden border">
            {zone.settings?.url ? (
              <iframe
                src={zone.settings.url}
                className="w-full h-full border-none"
                style={{ zoom: zone.settings?.zoom || 1.0 }}
                title={`Webpage - ${zone.zone_name}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <GlobeAltIcon className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">URL tidak diatur</p>
                </div>
              </div>
            )}
          </div>
        );

      case "playlist":
        // Show actual playlist content if available
        const selectedPlaylist =
          zone.playlist ||
          (zone.playlist_id &&
            layout.playlists?.find((p) => p.id === zone.playlist_id));

        console.log("LayoutPreview playlist debug:", {
          zone: zone,
          selectedPlaylist: selectedPlaylist,
          layoutPlaylists: layout.playlists,
          zonePlaylistId: zone.playlist_id,
        });

        if (
          selectedPlaylist &&
          selectedPlaylist.items &&
          selectedPlaylist.items.length > 0
        ) {
          // Get current playlist item based on cycling index
          const currentIndex = playlistIndexes[zone.id] || 0;
          const currentItem = selectedPlaylist.items[currentIndex];
          const content = currentItem.content;

          console.log("LayoutPreview playlist item:", {
            currentIndex: currentIndex,
            currentItem: currentItem,
            content: content,
            totalItems: selectedPlaylist.items.length,
          });

          if (content) {
            if (content.type === "video") {
              const getVideoUrlForPlaylist = (content) => {
                if (!content?.filename) return null;
                const baseUrl =
                  import.meta.env.VITE_API_BASE_URL ||
                  import.meta.env.VITE_API_URL;
                return `${baseUrl}/uploads/${content.filename}`;
              };

              const videoUrl = getVideoUrlForPlaylist(content);
              return (
                <div className="w-full h-full bg-gray-900 rounded overflow-hidden relative">
                  {videoUrl ? (
                    <video
                      key={`${zone.id}-${currentIndex}-${content.id}`} // Force re-render on content change
                      className="w-full h-full object-cover"
                      src={videoUrl}
                      muted
                      autoPlay={isPlaying}
                      loop={false}
                      onError={(e) => {
                        console.error("Playlist video error:", {
                          error: e,
                          videoUrl: videoUrl,
                          content: content,
                          currentIndex: currentIndex,
                        });
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white">
                      <div className="text-center">
                        <FilmIcon className="h-8 w-8 mx-auto mb-2 opacity-60" />
                        <p className="text-sm opacity-60">
                          Video tidak ditemukan
                        </p>
                        <p className="text-xs opacity-40 mt-1">
                          {content.filename || "No filename"}
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Playlist indicator */}
                  <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    Playlist: {selectedPlaylist.name} ({currentIndex + 1}/
                    {selectedPlaylist.items.length})
                  </div>
                </div>
              );
            } else if (content.type === "image") {
              const getImageUrlForPlaylist = (content) => {
                if (!content?.filename) return null;
                const baseUrl =
                  import.meta.env.VITE_API_BASE_URL ||
                  import.meta.env.VITE_API_URL;
                return `${baseUrl}/uploads/${content.filename}`;
              };

              const imageUrl = getImageUrlForPlaylist(content);
              return (
                <div className="w-full h-full bg-gray-900 rounded overflow-hidden relative">
                  {imageUrl ? (
                    <img
                      key={`${zone.id}-${currentIndex}-${content.id}`} // Force re-render on content change
                      className="w-full h-full object-cover"
                      src={imageUrl}
                      alt="Playlist content"
                      onError={(e) => {
                        console.error("Playlist image error:", {
                          error: e,
                          imageUrl: imageUrl,
                          content: content,
                          currentIndex: currentIndex,
                        });
                        // Try alternative URL
                        const altUrl = `${
                          import.meta.env.VITE_API_BASE_URL ||
                          import.meta.env.VITE_API_URL
                        }/api/content/${content.id}/file`;
                        console.log(
                          "Trying alternative URL for playlist image:",
                          altUrl
                        );
                        e.target.src = altUrl;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white">
                      <div className="text-center">
                        <PhotoIcon className="h-8 w-8 mx-auto mb-2 opacity-60" />
                        <p className="text-sm opacity-60">
                          Gambar tidak ditemukan
                        </p>
                        <p className="text-xs opacity-40 mt-1">
                          {content.filename || "No filename"}
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Playlist indicator */}
                  <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    Playlist: {selectedPlaylist.name} ({currentIndex + 1}/
                    {selectedPlaylist.items.length})
                  </div>
                </div>
              );
            }
          }

          // If no content or unsupported type, show info
          return (
            <div className="w-full h-full bg-gray-900 rounded overflow-hidden relative">
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center">
                  <RectangleStackIcon className="h-8 w-8 mx-auto mb-2 opacity-60" />
                  <p className="text-sm opacity-60">
                    Playlist: {selectedPlaylist.name}
                  </p>
                  <p className="text-xs opacity-40 mt-1">
                    {selectedPlaylist.items.length} items ({currentIndex + 1}/
                    {selectedPlaylist.items.length})
                  </p>
                  {currentItem && (
                    <p className="text-xs opacity-30 mt-1">
                      Type: {currentItem.content?.type || "unknown"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        }

        // No playlist or empty playlist
        return (
          <div className="w-full h-full bg-gray-900 rounded overflow-hidden relative">
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center">
                <RectangleStackIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm opacity-60">Playlist tidak dipilih</p>
                {zone.playlist_id && (
                  <p className="text-xs opacity-40 mt-1">
                    Playlist ID: {zone.playlist_id}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case "multiple_content":
        // Show multiple content preview
        if (
          zone.settings?.multiple_content &&
          zone.settings?.content_list?.length > 0
        ) {
          const firstContentId = zone.settings.content_list[0];
          const firstContent = layout.contents?.find(
            (c) => c.id === firstContentId
          ) || {
            id: firstContentId,
            filename: `content-${firstContentId}`,
            type: "unknown",
          };

          const getMultiContentUrl = (content) => {
            if (!content?.filename) return null;
            const baseUrl =
              import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
            return `${baseUrl}/uploads/${content.filename}`;
          };

          if (firstContent.type === "video") {
            const videoUrl = getMultiContentUrl(firstContent);
            return (
              <div className="relative w-full h-full bg-black rounded overflow-hidden">
                {videoUrl ? (
                  <video
                    className="w-full h-full object-cover"
                    autoPlay={zone.settings?.autoplay !== false && isPlaying}
                    loop={zone.settings?.loop !== false}
                    muted={zone.settings?.mute !== false}
                    src={videoUrl}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white">
                    <div className="text-center">
                      <RectangleStackIcon className="h-8 w-8 mx-auto mb-2 opacity-60" />
                      <p className="text-sm opacity-60">Multiple Content</p>
                    </div>
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  Multiple: 1/{zone.settings.content_list.length}
                </div>
              </div>
            );
          } else if (firstContent.type === "image") {
            const imageUrl = getMultiContentUrl(firstContent);
            return (
              <div className="relative w-full h-full rounded overflow-hidden">
                {imageUrl ? (
                  <img
                    className="w-full h-full object-cover"
                    src={imageUrl}
                    alt="Multiple content preview"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <div className="text-center text-gray-500">
                      <RectangleStackIcon className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Multiple Content</p>
                    </div>
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  Multiple: 1/{zone.settings.content_list.length}
                </div>
              </div>
            );
          }
        }

        return (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded">
            <div className="text-center text-gray-500">
              <RectangleStackIcon className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Multiple Content</p>
              <p className="text-xs opacity-60">Tidak dikonfigurasi</p>
            </div>
          </div>
        );

      case "logo":
        return (
          <div className="w-full h-full bg-transparent flex items-center justify-center p-2 rounded">
            {zone.content ? (
              <img
                className="max-w-full max-h-full object-contain"
                src={`${import.meta.env.VITE_API_BASE_URL}/uploads/${
                  zone.content.filename
                }`}
                alt="Logo"
                style={{ opacity: zone.settings?.opacity || 1.0 }}
              />
            ) : (
              <div className="text-center text-gray-400">
                <PhotoIcon className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Logo tidak dipilih</p>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded border-2 border-dashed border-gray-300">
            <div className="text-center text-gray-500">
              <IconComponent className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">{zone.zone_name}</p>
              <p className="text-xs opacity-75 capitalize">
                {zone.content_type.replace("_", " ")}
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Kembali
            </button>

            <div>
              <h1 className="text-xl font-bold text-gray-800">{layout.name}</h1>
              <p className="text-sm text-gray-500">Preview Layout</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isPlaying
                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                  : "bg-green-50 text-green-600 hover:bg-green-100"
              }`}
            >
              {isPlaying ? (
                <>
                  <PauseIcon className="h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <PlayIcon className="h-4 w-4" />
                  Play
                </>
              )}
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <ArrowsPointingOutIcon className="h-4 w-4" />
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Container */}
      <div
        className={`flex-1 p-8 flex items-center justify-center ${
          isFullscreen ? "fixed inset-0 z-50 bg-black p-0" : "bg-gray-100"
        }`}
      >
        <div
          className={`relative bg-black shadow-2xl overflow-hidden ${
            isFullscreen ? "w-full h-full" : "rounded-lg"
          }`}
          style={{
            width: isFullscreen ? "100%" : "100%",
            maxWidth: isFullscreen ? "none" : "1200px",
            aspectRatio: "16/9",
          }}
        >
          {/* Layout Zones */}
          {layout.zones?.map((zone) => (
            <div
              key={zone.id}
              className="absolute"
              style={{
                left: `${zone.position.x}%`,
                top: `${zone.position.y}%`,
                width: `${zone.position.width}%`,
                height: `${zone.position.height}%`,
                zIndex: zone.z_index || 1,
              }}
            >
              {zone.is_visible !== false && renderZoneContent(zone)}
            </div>
          ))}

          {/* Layout Info Overlay */}
          {!isFullscreen && (
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm">
              <div className="flex items-center gap-2">
                <Cog6ToothIcon className="h-4 w-4" />
                <span>{layout.zones?.length || 0} zona</span>
                <span>•</span>
                <span className="capitalize">
                  {layout.type.replace("_", " ")}
                </span>
              </div>
            </div>
          )}

          {/* Fullscreen Exit Button */}
          {isFullscreen && (
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-black/80 transition-colors"
            >
              ✕ Exit Fullscreen
            </button>
          )}
        </div>
      </div>

      {/* Layout Info */}
      {!isFullscreen && (
        <div className="bg-white border-t border-gray-200 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  Informasi Layout
                </h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">Tipe:</span>{" "}
                    {layout.type.replace("_", " ")}
                  </p>
                  <p>
                    <span className="font-medium">Zona:</span>{" "}
                    {layout.zones?.length || 0}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span>{" "}
                    {layout.is_active ? "Aktif" : "Nonaktif"}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Deskripsi</h3>
                <p className="text-sm text-gray-600">
                  {layout.description || "Tidak ada deskripsi"}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  Zona Detail
                </h3>
                <div className="space-y-1">
                  {layout.zones?.slice(0, 3).map((zone) => (
                    <div
                      key={zone.id}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <div className={`w-2 h-2 rounded-full bg-blue-500`}></div>
                      <span className="capitalize">
                        {zone.content_type.replace("_", " ")}
                      </span>
                      <span className="text-gray-400">({zone.zone_name})</span>
                    </div>
                  ))}
                  {layout.zones?.length > 3 && (
                    <p className="text-xs text-gray-400">
                      +{layout.zones.length - 3} zona lagi
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }

        @keyframes marquee-slide {
          0% {
            transform: translateX(100vw);
          }
          100% {
            transform: translateX(-100%);
          }
        }

        .animate-marquee {
          animation: marquee 20s linear infinite;
          white-space: nowrap;
          display: inline-block;
        }
      `}</style>
    </div>
  );
}
