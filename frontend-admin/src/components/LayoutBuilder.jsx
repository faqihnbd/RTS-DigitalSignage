import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeftIcon,
  CheckIcon,
  EyeIcon,
  PlusIcon,
  TrashIcon,
  Cog6ToothIcon,
  FilmIcon,
  PhotoIcon,
  GlobeAltIcon,
  ClockIcon,
  CloudIcon,
  QrCodeIcon,
  DocumentTextIcon,
  RectangleStackIcon,
  XMarkIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/outline";
import "./LayoutBuilder.css";

const CONTENT_TYPES = [
  {
    id: "video",
    name: "Video",
    icon: FilmIcon,
    color: "bg-red-100 text-red-600",
  },
  {
    id: "image",
    name: "Gambar",
    icon: PhotoIcon,
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: "text",
    name: "Teks",
    icon: DocumentTextIcon,
    color: "bg-green-100 text-green-600",
  },
  {
    id: "webpage",
    name: "Webpage",
    icon: GlobeAltIcon,
    color: "bg-purple-100 text-purple-600",
  },
  {
    id: "playlist",
    name: "Playlist",
    icon: RectangleStackIcon,
    color: "bg-yellow-100 text-yellow-600",
  },
  {
    id: "ticker",
    name: "Ticker",
    icon: DocumentTextIcon,
    color: "bg-indigo-100 text-indigo-600",
  },
  {
    id: "clock",
    name: "Jam",
    icon: ClockIcon,
    color: "bg-pink-100 text-pink-600",
  },
  {
    id: "weather",
    name: "Cuaca",
    icon: CloudIcon,
    color: "bg-cyan-100 text-cyan-600",
  },
  {
    id: "qr_code",
    name: "QR Code",
    icon: QrCodeIcon,
    color: "bg-gray-100 text-gray-600",
  },
  {
    id: "logo",
    name: "Logo",
    icon: PhotoIcon,
    color: "bg-orange-100 text-orange-600",
  },
];

export default function LayoutBuilder({ layout, onSave, onCancel }) {
  const [layoutData, setLayoutData] = useState({
    name: layout?.name || "",
    description: layout?.description || "",
    type: layout?.type || "custom",
    zones: layout?.zones || [],
    displays: layout?.displays || [
      { id: 1, name: "Display 1", orientation: "landscape", primary: true },
    ], // Multi-display support
    current_display: 0, // Current display being edited
  });

  const [selectedZone, setSelectedZone] = useState(null);
  const [showZoneSettings, setShowZoneSettings] = useState(false);
  const [showDisplaySettings, setShowDisplaySettings] = useState(false); // Display settings panel
  const [contents, setContents] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [draggedType, setDraggedType] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [resizeHandle, setResizeHandle] = useState(null);
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 450 });

  useEffect(() => {
    fetchContents();
    fetchPlaylists();
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  const updateCanvasSize = () => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setCanvasSize({ width: rect.width, height: rect.height });
    }
  };

  const fetchContents = async () => {
    try {
      const token =
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("admin_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/contents`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setContents(data);
    } catch (error) {
      console.error("Error fetching contents:", error);
    }
  };

  const fetchPlaylists = async () => {
    try {
      const token =
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("admin_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/playlists`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setPlaylists(data);
    } catch (error) {
      console.error("Error fetching playlists:", error);
    }
  };

  const handleCanvasDrop = (e) => {
    e.preventDefault();
    if (!draggedType) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const currentDisplay = getCurrentDisplay();

    const newZone = {
      id: Date.now(),
      zone_name: `zone_${layoutData.zones.length + 1}`,
      display_id: currentDisplay.id, // Assign to current display
      position: {
        x: Math.max(0, Math.min(x - 10, 80)),
        y: Math.max(0, Math.min(y - 10, 80)),
        width: 20,
        height: 20,
        unit: "percentage",
      },
      content_type: draggedType,
      settings: getDefaultSettings(draggedType),
      z_index: layoutData.zones.length + 1,
      is_visible: true,
    };

    setLayoutData((prev) => ({
      ...prev,
      zones: [...prev.zones, newZone],
    }));

    setDraggedType(null);
  };

  const getDefaultSettings = (contentType) => {
    const defaults = {
      video: { autoplay: true, loop: true, mute: false },
      image: { scale: "cover", duration: 10 },
      text: { font_size: "16px", color: "#000000", background: "#ffffff" },
      webpage: { refresh_interval: 30000, zoom: 1.0 },
      playlist: { autoplay: true, loop: true, transition: "fade" },
      ticker: {
        scroll_speed: 5,
        direction: "horizontal",
        font_size: "18px",
        advanced_ticker: false,
        show_logo: false,
        text_color: "#ffffff",
        background_color: "#000000",
      },
      clock: {
        format: "HH:mm:ss",
        timezone: "Asia/Jakarta",
        clock_style: "modern",
        show_seconds: true,
        show_date: true,
        time_format: "24h",
      },
      weather: {
        location: "Jakarta",
        unit: "celsius",
        weather_style: "modern",
        show_forecast: true,
        show_details: true,
      },
      qr_code: { size: 200, error_correction: "M" },
      logo: { scale: "contain", opacity: 1.0 },
    };
    return defaults[contentType] || {};
  };

  // Multi-display functions
  const addDisplay = () => {
    const newDisplay = {
      id: Date.now(),
      name: `Display ${layoutData.displays.length + 1}`,
      orientation: "landscape",
      primary: false,
      resolution: "1920x1080",
      position: { x: 0, y: 0 }, // Position relative to primary display
    };

    setLayoutData((prev) => ({
      ...prev,
      displays: [...prev.displays, newDisplay],
    }));
  };

  const removeDisplay = (displayId) => {
    if (layoutData.displays.length <= 1) return; // Can't remove the last display

    setLayoutData((prev) => ({
      ...prev,
      displays: prev.displays.filter((d) => d.id !== displayId),
      current_display:
        prev.current_display >= prev.displays.length - 1
          ? 0
          : prev.current_display,
    }));
  };

  const updateDisplay = (displayId, updates) => {
    setLayoutData((prev) => ({
      ...prev,
      displays: prev.displays.map((d) =>
        d.id === displayId ? { ...d, ...updates } : d
      ),
    }));
  };

  const switchDisplay = (displayIndex) => {
    setLayoutData((prev) => ({
      ...prev,
      current_display: displayIndex,
    }));
    setSelectedZone(null);
  };

  const getCurrentDisplay = () => {
    return (
      layoutData.displays[layoutData.current_display] || layoutData.displays[0]
    );
  };

  const getCurrentDisplayZones = () => {
    const currentDisplay = getCurrentDisplay();
    return layoutData.zones.filter(
      (zone) => !zone.display_id || zone.display_id === currentDisplay.id
    );
  };

  const handleZoneSelect = (zone) => {
    setSelectedZone(zone);
    setShowZoneSettings(true);
  };

  const handleMouseDown = (e, zone, action = "drag") => {
    e.preventDefault();
    e.stopPropagation();

    const rect = canvasRef.current.getBoundingClientRect();
    const startX = ((e.clientX - rect.left) / rect.width) * 100;
    const startY = ((e.clientY - rect.top) / rect.height) * 100;

    // Store initial mouse position untuk threshold
    setDragStart({
      x: startX,
      y: startY,
      zoneOffsetX: action === "drag" ? startX - zone.position.x : 0,
      zoneOffsetY: action === "drag" ? startY - zone.position.y : 0,
      initialMouseX: e.clientX,
      initialMouseY: e.clientY,
      action: action,
      zone: zone,
      hasStartedDrag: false,
    });

    setSelectedZone(zone);

    // Set class untuk mencegah transisi selama drag
    document.body.classList.add("drag-in-progress");

    // Set user-select to none to prevent text selection
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";
  };

  const handleMouseMove = (e) => {
    if (!dragStart) return;

    e.preventDefault();

    const DRAG_THRESHOLD = 5; // pixels
    const distance = Math.sqrt(
      Math.pow(e.clientX - dragStart.initialMouseX, 2) +
        Math.pow(e.clientY - dragStart.initialMouseY, 2)
    );

    // Cek apakah sudah melewati threshold
    if (!dragStart.hasStartedDrag && distance < DRAG_THRESHOLD) {
      return;
    }

    // Mulai drag setelah threshold terlewati
    if (!dragStart.hasStartedDrag) {
      if (dragStart.action === "drag") {
        setIsDragging(dragStart.zone.id);
      } else {
        setIsResizing(dragStart.zone.id);
        setResizeHandle(dragStart.action);
      }
      setDragStart((prev) => ({ ...prev, hasStartedDrag: true }));
    }

    // Hanya lanjutkan jika sudah mulai drag
    if (!isDragging && !isResizing) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = ((e.clientX - rect.left) / rect.width) * 100;
    const currentY = ((e.clientY - rect.top) / rect.height) * 100;

    if (isDragging) {
      const newX = Math.max(0, Math.min(100, currentX - dragStart.zoneOffsetX));
      const newY = Math.max(0, Math.min(100, currentY - dragStart.zoneOffsetY));

      // Ensure zone stays within bounds including its width/height
      const maxX = Math.max(0, 100 - selectedZone.position.width);
      const maxY = Math.max(0, 100 - selectedZone.position.height);

      updateZone(isDragging, {
        position: {
          ...selectedZone.position,
          x: Math.min(newX, maxX),
          y: Math.min(newY, maxY),
        },
      });
    } else if (isResizing) {
      const deltaX = currentX - dragStart.x;
      const deltaY = currentY - dragStart.y;

      let newPos = { ...selectedZone.position };

      switch (resizeHandle) {
        case "se":
          newPos.width = Math.max(
            5,
            Math.min(100 - newPos.x, newPos.width + deltaX)
          );
          newPos.height = Math.max(
            5,
            Math.min(100 - newPos.y, newPos.height + deltaY)
          );
          break;
        case "nw":
          const newWidth = newPos.width - deltaX;
          const newHeight = newPos.height - deltaY;
          if (
            newWidth > 5 &&
            newPos.x + deltaX >= 0 &&
            newPos.x + deltaX <= 95
          ) {
            newPos.x += deltaX;
            newPos.width = newWidth;
          }
          if (
            newHeight > 5 &&
            newPos.y + deltaY >= 0 &&
            newPos.y + deltaY <= 95
          ) {
            newPos.y += deltaY;
            newPos.height = newHeight;
          }
          break;
        case "ne":
          newPos.width = Math.max(
            5,
            Math.min(100 - newPos.x, newPos.width + deltaX)
          );
          const newHeightNE = newPos.height - deltaY;
          if (
            newHeightNE > 5 &&
            newPos.y + deltaY >= 0 &&
            newPos.y + deltaY <= 95
          ) {
            newPos.y += deltaY;
            newPos.height = newHeightNE;
          }
          break;
        case "sw":
          const newWidthSW = newPos.width - deltaX;
          if (
            newWidthSW > 5 &&
            newPos.x + deltaX >= 0 &&
            newPos.x + deltaX <= 95
          ) {
            newPos.x += deltaX;
            newPos.width = newWidthSW;
          }
          newPos.height = Math.max(
            5,
            Math.min(100 - newPos.y, newPos.height + deltaY)
          );
          break;
      }

      updateZone(isResizing, { position: newPos });

      // Update drag start untuk resize
      setDragStart((prev) => ({ ...prev, x: currentX, y: currentY }));
    }
  };

  const handleMouseUp = (e) => {
    e.preventDefault();
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
    setDragStart(null);

    // Hapus class drag
    document.body.classList.remove("drag-in-progress");

    // Restore user-select
    document.body.style.userSelect = "";
    document.body.style.webkitUserSelect = "";
  };

  useEffect(() => {
    if (dragStart) {
      const handleGlobalMouseMove = (e) => handleMouseMove(e);
      const handleGlobalMouseUp = (e) => handleMouseUp(e);

      document.addEventListener("mousemove", handleGlobalMouseMove, {
        passive: false,
      });
      document.addEventListener("mouseup", handleGlobalMouseUp, {
        passive: false,
      });
      document.addEventListener("mouseleave", handleGlobalMouseUp, {
        passive: false,
      });

      return () => {
        document.removeEventListener("mousemove", handleGlobalMouseMove);
        document.removeEventListener("mouseup", handleGlobalMouseUp);
        document.removeEventListener("mouseleave", handleGlobalMouseUp);
      };
    }
  }, [dragStart, isDragging, isResizing, selectedZone]);

  const updateZone = (zoneId, updates) => {
    setLayoutData((prev) => {
      const newZones = prev.zones.map((zone) =>
        zone.id === zoneId ? { ...zone, ...updates } : zone
      );
      return {
        ...prev,
        zones: newZones,
      };
    });

    // Update selectedZone if it's being updated
    if (selectedZone && selectedZone.id === zoneId) {
      setSelectedZone((prev) => ({ ...prev, ...updates }));
    }
  };

  const deleteZone = (zoneId) => {
    setLayoutData((prev) => ({
      ...prev,
      zones: prev.zones.filter((zone) => zone.id !== zoneId),
    }));
    setSelectedZone(null);
    setShowZoneSettings(false);
  };

  const handleSave = async () => {
    try {
      const token =
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("admin_token");
      const url = layout
        ? `${import.meta.env.VITE_API_BASE_URL}/api/layouts/${layout.id}`
        : `${import.meta.env.VITE_API_BASE_URL}/api/layouts`;

      const method = layout ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(layoutData),
      });

      if (response.ok) {
        onSave();
      }
    } catch (error) {
      console.error("Error saving layout:", error);
    }
  };

  const getContentTypeIcon = (type) => {
    const contentType = CONTENT_TYPES.find((ct) => ct.id === type);
    return contentType?.icon || DocumentTextIcon;
  };

  const getContentTypeColor = (type) => {
    const contentType = CONTENT_TYPES.find((ct) => ct.id === type);
    return contentType?.color || "bg-gray-100 text-gray-600";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar - Tools */}
      <div className="w-80 bg-white shadow-lg flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">Layout Builder</h1>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Nama Layout"
              value={layoutData.name}
              onChange={(e) =>
                setLayoutData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <textarea
              placeholder="Deskripsi Layout"
              value={layoutData.description}
              onChange={(e) =>
                setLayoutData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
            />
          </div>
        </div>

        {/* Content Types */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-4">Jenis Konten</h3>
          <div className="grid grid-cols-2 gap-2">
            {CONTENT_TYPES.map((type) => {
              const IconComponent = type.icon;
              return (
                <div
                  key={type.id}
                  draggable
                  onDragStart={() => setDraggedType(type.id)}
                  className={`cursor-move p-3 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors ${type.color}`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <IconComponent className="h-5 w-5" />
                    <span className="text-xs font-medium">{type.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Drag & drop konten ke canvas untuk membuat zona
          </p>
        </div>

        {/* Zone List */}
        <div className="p-6 flex-1 overflow-y-auto">
          <h3 className="font-semibold text-gray-800 mb-4">
            Zona {getCurrentDisplay().name} ({getCurrentDisplayZones().length})
          </h3>

          {getCurrentDisplayZones().length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              Belum ada zona di {getCurrentDisplay().name}.
              <br />
              Drag konten ke canvas untuk membuat zona.
            </p>
          ) : (
            <div className="space-y-2">
              {getCurrentDisplayZones().map((zone) => {
                const IconComponent = getContentTypeIcon(zone.content_type);
                return (
                  <div
                    key={zone.id}
                    onClick={() => handleZoneSelect(zone)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedZone?.id === zone.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${getContentTypeColor(
                          zone.content_type
                        )}`}
                      >
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {zone.zone_name}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {zone.content_type.replace("_", " ")}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteZone(zone.id);
                        }}
                        className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-200 space-y-3">
          <button
            onClick={handleSave}
            disabled={!layoutData.name.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CheckIcon className="h-5 w-5" />
            Simpan Layout
          </button>

          <button
            onClick={onCancel}
            className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Canvas Header with Multi-Display Controls */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Canvas Preview (16:9)
            </h2>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("🔥 BUTTON CLICKED!");
                  console.log(
                    "Current showDisplaySettings:",
                    showDisplaySettings
                  );
                  setShowDisplaySettings((prev) => {
                    console.log(
                      "🚀 Setting showDisplaySettings from",
                      prev,
                      "to true"
                    );
                    return true;
                  });
                  console.log("✅ setShowDisplaySettings called");
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Cog6ToothIcon className="h-4 w-4" />
                Display Settings
              </button>
              <div className="text-sm text-gray-500">
                Zona: {getCurrentDisplayZones().length} | Dipilih:{" "}
                {selectedZone && selectedZone.zone_name
                  ? selectedZone.zone_name
                  : "Tidak ada"}
              </div>
            </div>
          </div>

          {/* Display Selection Dropdown */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">
                Current Display:
              </span>
              <select
                value={layoutData.current_display}
                onChange={(e) => switchDisplay(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {layoutData.displays.map((display, index) => (
                  <option key={display.id} value={index}>
                    {display.name} (
                    {display.orientation === "portrait" ? "9:16" : "16:9"})
                    {display.primary ? " - Primary" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 p-8 flex items-center justify-center bg-gray-100">
          <div
            ref={canvasRef}
            className={`layout-builder-canvas relative bg-black rounded-lg shadow-2xl overflow-hidden ${
              dragStart ? "drag-in-progress" : ""
            }`}
            style={{
              width: "100%",
              maxWidth: "800px",
              aspectRatio:
                getCurrentDisplay().orientation === "portrait"
                  ? "9/16"
                  : "16/9",
            }}
            onDrop={handleCanvasDrop}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={(e) => e.preventDefault()}
          >
            {/* Canvas Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black">
              <div className="absolute inset-0 opacity-10">
                <div
                  className={`grid h-full ${
                    getCurrentDisplay().orientation === "portrait"
                      ? "grid-cols-6 grid-rows-8"
                      : "grid-cols-8 grid-rows-6"
                  }`}
                >
                  {Array.from({
                    length:
                      getCurrentDisplay().orientation === "portrait" ? 48 : 48,
                  }).map((_, i) => (
                    <div key={i} className="border border-gray-600"></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Display Info Overlay */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg text-sm">
              <div className="font-medium">{getCurrentDisplay().name}</div>
              <div className="text-xs opacity-80">
                {getCurrentDisplay().orientation === "portrait"
                  ? "Portrait (9:16)"
                  : "Landscape (16:9)"}
                {getCurrentDisplay().resolution && (
                  <span> • {getCurrentDisplay().resolution}</span>
                )}
              </div>
            </div>

            {/* Drop Zone Hint */}
            {draggedType && (
              <div className="absolute inset-0 border-4 border-dashed border-blue-400 bg-blue-400/10 flex items-center justify-center">
                <div className="text-blue-400 text-center">
                  <PlusIcon className="h-12 w-12 mx-auto mb-2" />
                  <p className="font-semibold">Drop untuk membuat zona</p>
                  <p className="text-sm opacity-80">
                    pada {getCurrentDisplay().name}
                  </p>
                </div>
              </div>
            )}

            {/* Zones - Only show zones for current display */}
            {getCurrentDisplayZones().map((zone) => {
              const IconComponent = getContentTypeIcon(zone.content_type);
              return (
                <div
                  key={zone.id}
                  onMouseDown={(e) => handleMouseDown(e, zone, "drag")}
                  className={`zone-container absolute border-2 rounded-lg transition-all no-select ${
                    selectedZone?.id === zone.id
                      ? "selected border-blue-500 bg-blue-500/20"
                      : "border-white/30 bg-white/10 hover:border-white/50"
                  } ${isDragging === zone.id ? "zone-dragging" : ""} ${
                    isResizing === zone.id ? "zone-resizing" : ""
                  }`}
                  style={{
                    left: `${zone.position.x}%`,
                    top: `${zone.position.y}%`,
                    width: `${zone.position.width}%`,
                    height: `${zone.position.height}%`,
                    zIndex: zone.z_index,
                  }}
                >
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center text-white p-2 cursor-pointer overflow-hidden"
                    onClick={() => handleZoneSelect(zone)}
                    onMouseDown={(e) => {
                      // Only allow dragging if not clicking on resize handles
                      if (!e.target.classList.contains("resize-handle")) {
                        handleMouseDown(e, zone, "drag");
                      }
                    }}
                    style={{
                      backgroundColor:
                        zone.content_type === "text"
                          ? zone.settings?.background_color || "rgba(0,0,0,0.7)"
                          : "rgba(0,0,0,0.7)",
                    }}
                  >
                    {zone.content_type === "text" &&
                    zone.settings?.text_content ? (
                      // Text preview
                      <div
                        className={`w-full h-full flex items-center p-1 ${
                          zone.settings?.running_text ? "overflow-hidden" : ""
                        }`}
                        style={{
                          color: zone.settings?.text_color || "#ffffff",
                          fontSize: `${Math.min(
                            zone.settings?.font_size || 24,
                            16
                          )}px`,
                          fontWeight: zone.settings?.font_weight || "normal",
                          textAlign: zone.settings?.text_align || "center",
                          justifyContent:
                            zone.settings?.text_align === "left"
                              ? "flex-start"
                              : zone.settings?.text_align === "right"
                              ? "flex-end"
                              : "center",
                          lineHeight: "1.2",
                          wordWrap: "break-word",
                          overflow: "hidden",
                        }}
                      >
                        {zone.settings?.running_text ? (
                          <div className="whitespace-nowrap animate-pulse">
                            {zone.settings.text_content} ↔{" "}
                            {zone.settings.text_content}
                          </div>
                        ) : (
                          <div className="truncate">
                            {zone.settings.text_content}
                          </div>
                        )}
                      </div>
                    ) : (
                      // Default icon preview
                      <>
                        <IconComponent className="h-6 w-6 mb-1" />
                        <span className="text-xs font-medium text-center">
                          {zone.zone_name}
                        </span>
                        <span className="text-xs opacity-75 capitalize">
                          {zone.content_type.replace("_", " ")}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Resize Handles */}
                  {selectedZone?.id === zone.id && (
                    <>
                      <div
                        className={`resize-handle se ${
                          isResizing === zone.id && resizeHandle === "se"
                            ? "dragging"
                            : ""
                        }`}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handleMouseDown(e, zone, "se");
                        }}
                      ></div>
                      <div
                        className={`resize-handle nw ${
                          isResizing === zone.id && resizeHandle === "nw"
                            ? "dragging"
                            : ""
                        }`}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handleMouseDown(e, zone, "nw");
                        }}
                      ></div>
                      <div
                        className={`resize-handle ne ${
                          isResizing === zone.id && resizeHandle === "ne"
                            ? "dragging"
                            : ""
                        }`}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handleMouseDown(e, zone, "ne");
                        }}
                      ></div>
                      <div
                        className={`resize-handle sw ${
                          isResizing === zone.id && resizeHandle === "sw"
                            ? "dragging"
                            : ""
                        }`}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handleMouseDown(e, zone, "sw");
                        }}
                      ></div>
                    </>
                  )}
                </div>
              );
            })}

            {/* Canvas Info */}
            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded text-sm">
              {canvasSize.width}×{canvasSize.height}px
            </div>
          </div>
        </div>
      </div>

      {/* Zone Settings Panel */}
      {showZoneSettings && selectedZone && (
        <ZoneSettingsPanel
          zone={selectedZone}
          contents={contents}
          playlists={playlists}
          onUpdate={(updates) => updateZone(selectedZone.id, updates)}
          onClose={() => {
            setShowZoneSettings(false);
            setSelectedZone(null);
          }}
        />
      )}

      {/* Display Settings Panel */}
      {showDisplaySettings && (
        <DisplaySettingsPanel
          layoutData={layoutData}
          onUpdate={(updates) => {
            console.log("🎯 DisplaySettingsPanel onUpdate called:", updates);
            setLayoutData((prev) => ({ ...prev, ...updates }));
          }}
          onClose={() => {
            console.log("🚪 DisplaySettingsPanel closing");
            setShowDisplaySettings(false);
          }}
        />
      )}
    </div>
  );
}

// Display Settings Panel Component
function DisplaySettingsPanel({ layoutData, onUpdate, onClose }) {
  const [currentDisplay, setCurrentDisplay] = useState(
    layoutData.displays[0] || {}
  );

  const handleDisplayUpdate = (updates) => {
    const updatedDisplays = layoutData.displays.map((display) =>
      display.id === currentDisplay.id ? { ...display, ...updates } : display
    );
    onUpdate({ displays: updatedDisplays });
    setCurrentDisplay({ ...currentDisplay, ...updates });
  };

  const addNewDisplay = () => {
    const newDisplay = {
      id: Math.max(...layoutData.displays.map((d) => d.id)) + 1,
      name: `Display ${layoutData.displays.length + 1}`,
      orientation: "landscape",
      resolution: "1920x1080",
      primary: false,
    };
    const updatedDisplays = [...layoutData.displays, newDisplay];
    onUpdate({ displays: updatedDisplays });
  };

  const removeDisplay = (displayId) => {
    if (layoutData.displays.length <= 1) return; // Minimal satu display
    const updatedDisplays = layoutData.displays.filter(
      (d) => d.id !== displayId
    );
    // Set display pertama sebagai primary jika yang dihapus adalah primary
    if (currentDisplay.primary) {
      updatedDisplays[0].primary = true;
    }
    onUpdate({ displays: updatedDisplays });
    setCurrentDisplay(updatedDisplays[0]);
  };

  return (
    <div className="fixed top-0 right-0 w-80 h-full bg-white shadow-lg border-l border-gray-200 z-50 overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">Display Settings</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Select Display
            </label>
            <select
              value={currentDisplay.id}
              onChange={(e) => {
                const selectedDisplay = layoutData.displays.find(
                  (d) => d.id === parseInt(e.target.value)
                );
                setCurrentDisplay(selectedDisplay);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {layoutData.displays.map((display) => (
                <option key={display.id} value={display.id}>
                  {display.name} {display.primary ? "(Primary)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-gray-200">
        <h4 className="font-medium text-gray-800 mb-3">
          Display Configuration
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={currentDisplay.name || ""}
              onChange={(e) => handleDisplayUpdate({ name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Orientation
            </label>
            <select
              value={currentDisplay.orientation || "landscape"}
              onChange={(e) =>
                handleDisplayUpdate({ orientation: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="landscape">Landscape (16:9)</option>
              <option value="portrait">Portrait (9:16)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Resolution
            </label>
            <select
              value={currentDisplay.resolution || "1920x1080"}
              onChange={(e) =>
                handleDisplayUpdate({ resolution: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1920x1080">1920x1080 (Full HD)</option>
              <option value="2560x1440">2560x1440 (2K QHD)</option>
              <option value="3840x2160">3840x2160 (4K UHD)</option>
              <option value="1280x720">1280x720 (HD)</option>
            </select>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={currentDisplay.primary || false}
                onChange={(e) => {
                  if (e.target.checked) {
                    // Set semua display primary = false, kecuali yang dipilih
                    const updatedDisplays = layoutData.displays.map((d) => ({
                      ...d,
                      primary: d.id === currentDisplay.id,
                    }));
                    onUpdate({ displays: updatedDisplays });
                    setCurrentDisplay({ ...currentDisplay, primary: true });
                  }
                }}
                className="mr-2"
              />
              <span className="text-xs text-gray-600">
                Set as Primary Display
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-gray-200">
        <h4 className="font-medium text-gray-800 mb-3">Display Management</h4>
        <div className="space-y-2">
          <button
            onClick={addNewDisplay}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-blue-300 border-dashed text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add New Display
          </button>

          {layoutData.displays.length > 1 && (
            <button
              onClick={() => removeDisplay(currentDisplay.id)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-red-300 border-dashed text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <TrashIcon className="h-4 w-4" />
              Remove Current Display
            </button>
          )}
        </div>
      </div>

      <div className="p-4 border-b border-gray-200">
        <div className="text-xs text-gray-500">
          <div>Total Displays: {layoutData.displays.length}</div>
          <div>Current: {currentDisplay.name}</div>
          <div>
            Zones on this display:{" "}
            {
              layoutData.zones.filter(
                (z) => !z.display_id || z.display_id === currentDisplay.id
              ).length
            }
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Done
        </button>
      </div>
    </div>
  );
}

// Zone Settings Panel Component
function ZoneSettingsPanel({ zone, contents, playlists, onUpdate, onClose }) {
  const [settings, setSettings] = useState(() => ({
    ...zone.settings,
    content_id: zone.content_id,
    playlist_id: zone.playlist_id,
  }));
  const [position, setPosition] = useState(zone.position || {});
  const [zoneName, setZoneName] = useState(zone.zone_name || "");

  // Update local state when zone prop changes
  useEffect(() => {
    setSettings({
      ...zone.settings,
      content_id: zone.content_id,
      playlist_id: zone.playlist_id,
    });
    setPosition(zone.position || {});
    setZoneName(zone.zone_name || "");
  }, [zone]);

  const handleSave = () => {
    const updateData = {
      zone_name: zoneName,
      settings,
      // Keep original position to prevent unwanted changes
      position: zone.position,
    };

    // Include content_id or playlist_id if they exist in settings
    if (settings.content_id !== undefined) {
      updateData.content_id = settings.content_id;
    }
    if (settings.playlist_id !== undefined) {
      updateData.playlist_id = settings.playlist_id;
    }

    console.log("🎯 Zone settings being saved:", updateData);
    console.log("💾 Settings object:", settings);

    onUpdate(updateData);
    onClose();
  };

  return (
    <div className="w-80 bg-white shadow-lg border-l border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Pengaturan Zona</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Nama zona"
            value={zoneName}
            onChange={(e) => setZoneName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="p-4 border-b border-gray-200">
        <h4 className="font-medium text-gray-800 mb-3">Posisi & Ukuran</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">X (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={Math.round((zone.position.x || 0) * 10) / 10}
              onChange={(e) => {
                const newX = parseFloat(e.target.value) || 0;
                onUpdate({
                  position: {
                    ...zone.position,
                    x: Math.max(0, Math.min(100 - zone.position.width, newX)),
                  },
                });
              }}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Y (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={Math.round((zone.position.y || 0) * 10) / 10}
              onChange={(e) => {
                const newY = parseFloat(e.target.value) || 0;
                onUpdate({
                  position: {
                    ...zone.position,
                    y: Math.max(0, Math.min(100 - zone.position.height, newY)),
                  },
                });
              }}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Width (%)
            </label>
            <input
              type="number"
              min="5"
              max="100"
              step="0.1"
              value={Math.round((zone.position.width || 10) * 10) / 10}
              onChange={(e) => {
                const newWidth = parseFloat(e.target.value) || 5;
                onUpdate({
                  position: {
                    ...zone.position,
                    width: Math.max(
                      5,
                      Math.min(100 - zone.position.x, newWidth)
                    ),
                  },
                });
              }}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Height (%)
            </label>
            <input
              type="number"
              min="5"
              max="100"
              step="0.1"
              value={Math.round((zone.position.height || 10) * 10) / 10}
              onChange={(e) => {
                const newHeight = parseFloat(e.target.value) || 5;
                onUpdate({
                  position: {
                    ...zone.position,
                    height: Math.max(
                      5,
                      Math.min(100 - zone.position.y, newHeight)
                    ),
                  },
                });
              }}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>
      </div>

      {/* Content Assignment */}
      <div className="p-4 border-b border-gray-200">
        <h4 className="font-medium text-gray-800 mb-3">Konten</h4>

        {zone.content_type === "logo" && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-2">
                Pilih Logo
              </label>
              <select
                value={settings.content_id || zone.content_id || ""}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    content_id: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">-- Pilih Logo --</option>
                {contents
                  .filter((content) => content.type === "image")
                  .map((content) => (
                    <option key={content.id} value={content.id}>
                      {content.filename}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        )}

        {(zone.content_type === "video" || zone.content_type === "image") && (
          <div className="space-y-3">
            <div>
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={settings.multiple_content || false}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      multiple_content: e.target.checked,
                      content_list: e.target.checked
                        ? prev.content_list || []
                        : undefined,
                      content_id: e.target.checked ? null : prev.content_id,
                    }))
                  }
                />
                <span className="text-xs text-gray-600">Multiple Content</span>
              </label>
            </div>

            {!settings.multiple_content ? (
              <div>
                <label className="block text-xs text-gray-600 mb-2">
                  Pilih {zone.content_type === "video" ? "Video" : "Gambar"}
                </label>
                <select
                  value={settings.content_id || zone.content_id || ""}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      content_id: e.target.value
                        ? parseInt(e.target.value)
                        : null,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">-- Pilih Konten --</option>
                  {contents
                    .filter((content) => {
                      const typeMapping = {
                        video: ["video"],
                        image: ["image"],
                        text: ["text", "html"],
                      };
                      return (
                        typeMapping[zone.content_type]?.includes(
                          content.type
                        ) || content.type === zone.content_type
                      );
                    })
                    .map((content) => (
                      <option key={content.id} value={content.id}>
                        {content.title || content.filename}
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs text-gray-600 mb-2">
                  Pilih Multiple{" "}
                  {zone.content_type === "video" ? "Video" : "Gambar"}
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                  {contents
                    .filter((content) => {
                      const typeMapping = {
                        video: ["video"],
                        image: ["image"],
                        text: ["text", "html"],
                      };
                      return (
                        typeMapping[zone.content_type]?.includes(
                          content.type
                        ) || content.type === zone.content_type
                      );
                    })
                    .map((content) => (
                      <label
                        key={content.id}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          checked={(settings.content_list || []).includes(
                            content.id
                          )}
                          onChange={(e) => {
                            const currentList = settings.content_list || [];
                            if (e.target.checked) {
                              setSettings((prev) => ({
                                ...prev,
                                content_list: [...currentList, content.id],
                              }));
                            } else {
                              setSettings((prev) => ({
                                ...prev,
                                content_list: currentList.filter(
                                  (id) => id !== content.id
                                ),
                              }));
                            }
                          }}
                        />
                        <span className="text-xs text-gray-700">
                          {content.title || content.filename}
                        </span>
                      </label>
                    ))}
                </div>

                {/* Content Order Management */}
                {settings.multiple_content &&
                  settings.content_list &&
                  settings.content_list.length > 0 && (
                    <div className="mt-3 border-t pt-3">
                      <label className="block text-xs text-gray-600 mb-2">
                        Atur Urutan Content
                      </label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {settings.content_list.map((contentId, index) => {
                          const content = contents.find(
                            (c) => c.id === contentId
                          );
                          if (!content) return null;

                          return (
                            <div
                              key={contentId}
                              className="flex items-center gap-2 p-2 bg-gray-50 rounded border"
                            >
                              <span className="text-xs font-mono text-gray-500 w-6">
                                {index + 1}.
                              </span>
                              <span className="text-xs text-gray-700 flex-1">
                                {content.title || content.filename}
                              </span>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (index > 0) {
                                      const newList = [
                                        ...settings.content_list,
                                      ];
                                      [newList[index], newList[index - 1]] = [
                                        newList[index - 1],
                                        newList[index],
                                      ];
                                      setSettings((prev) => ({
                                        ...prev,
                                        content_list: newList,
                                      }));
                                    }
                                  }}
                                  disabled={index === 0}
                                  className="p-1 text-blue-500 hover:bg-blue-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Pindah ke atas"
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (
                                      index <
                                      settings.content_list.length - 1
                                    ) {
                                      const newList = [
                                        ...settings.content_list,
                                      ];
                                      [newList[index], newList[index + 1]] = [
                                        newList[index + 1],
                                        newList[index],
                                      ];
                                      setSettings((prev) => ({
                                        ...prev,
                                        content_list: newList,
                                      }));
                                    }
                                  }}
                                  disabled={
                                    index === settings.content_list.length - 1
                                  }
                                  className="p-1 text-blue-500 hover:bg-blue-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Pindah ke bawah"
                                >
                                  ↓
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newList =
                                      settings.content_list.filter(
                                        (id) => id !== contentId
                                      );
                                    setSettings((prev) => ({
                                      ...prev,
                                      content_list: newList,
                                    }));
                                  }}
                                  className="p-1 text-red-500 hover:bg-red-100 rounded"
                                  title="Hapus dari daftar"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {settings.multiple_content && (
                  <div className="mt-2">
                    <label className="block text-xs text-gray-600 mb-1">
                      Durasi per Item (detik)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={settings.content_duration || 5}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          content_duration: parseInt(e.target.value),
                        }))
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {zone.content_type === "playlist" && (
          <div>
            <label className="block text-xs text-gray-600 mb-2">
              Pilih Playlist
            </label>
            <select
              value={settings.playlist_id || zone.playlist_id || ""}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  playlist_id: e.target.value ? parseInt(e.target.value) : null,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">-- Pilih Playlist --</option>
              {playlists.map((playlist) => (
                <option key={playlist.id} value={playlist.id}>
                  {playlist.name}
                </option>
              ))}
            </select>

            <div className="mt-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.use_item_duration !== false}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      use_item_duration: e.target.checked,
                    }))
                  }
                />
                <span className="text-xs text-gray-600">
                  Gunakan durasi dari setiap item playlist
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Jika dicentang, setiap item akan menggunakan durasi yang sudah
                diatur di playlist (5 detik, dll). Jika tidak, semua item akan
                menggunakan durasi default di bawah.
              </p>
            </div>

            {settings.use_item_duration === false && (
              <div className="mt-3">
                <label className="block text-xs text-gray-600 mb-1">
                  Durasi Default per Item (detik)
                </label>
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={settings.content_duration || 10}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      content_duration: parseInt(e.target.value),
                    }))
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Durasi ini akan digunakan untuk semua item dalam playlist jika
                  opsi di atas tidak dicentang.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content-specific Settings */}
      <div className="flex-1 p-4 overflow-y-auto">
        <h4 className="font-medium text-gray-800 mb-3">Pengaturan Khusus</h4>

        {(zone.content_type === "video" || zone.content_type === "image") && (
          <div className="space-y-3">
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.autoplay !== false}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      autoplay: e.target.checked,
                    }))
                  }
                />
                <span className="text-xs text-gray-600">Autoplay</span>
              </label>
            </div>
            {zone.content_type === "video" && (
              <>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.loop !== false}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          loop: e.target.checked,
                        }))
                      }
                    />
                    <span className="text-xs text-gray-600">Loop</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.muted || false}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          muted: e.target.checked,
                        }))
                      }
                    />
                    <span className="text-xs text-gray-600">Muted</span>
                  </label>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Volume (%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.volume || 50}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        volume: parseInt(e.target.value),
                      }))
                    }
                    className="w-full"
                    disabled={settings.muted}
                  />
                  <span className="text-xs text-gray-500">
                    {settings.muted ? "Muted" : `${settings.volume || 50}%`}
                  </span>
                </div>
              </>
            )}
            {zone.content_type === "image" && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Durasi Tampil (detik)
                </label>
                <input
                  type="number"
                  min="1"
                  value={settings.duration || 5}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      duration: parseInt(e.target.value),
                    }))
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Fit Content
              </label>
              <select
                value={settings.object_fit || "cover"}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    object_fit: e.target.value,
                  }))
                }
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
                <option value="fill">Fill</option>
                <option value="scale-down">Scale Down</option>
              </select>
            </div>
          </div>
        )}

        {zone.content_type === "text" && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Teks Content
              </label>
              <textarea
                placeholder="Masukkan teks disini..."
                value={settings.text_content || ""}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    text_content: e.target.value,
                  }))
                }
                rows="3"
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Ukuran Font (px)
              </label>
              <input
                type="number"
                min="8"
                max="72"
                value={settings.font_size || 16}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    font_size: parseInt(e.target.value),
                  }))
                }
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Warna Teks
              </label>
              <input
                type="color"
                value={settings.text_color || "#FFFFFF"}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    text_color: e.target.value,
                  }))
                }
                className="w-full h-8 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Align Text
              </label>
              <select
                value={settings.text_align || "center"}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    text_align: e.target.value,
                  }))
                }
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="left">Kiri</option>
                <option value="center">Tengah</option>
                <option value="right">Kanan</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Warna Background
              </label>
              <input
                type="color"
                value={settings.background_color || "#000000"}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    background_color: e.target.value,
                  }))
                }
                className="w-full h-8 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                <input
                  type="checkbox"
                  checked={settings.running_text || false}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      running_text: e.target.checked,
                    }))
                  }
                  className="mr-2"
                />
                Aktifkan Running Text
              </label>
            </div>
            {settings.running_text && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Kecepatan Running (detik)
                </label>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={settings.running_speed || 10}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      running_speed: parseInt(e.target.value),
                    }))
                  }
                  className="w-full"
                />
                <div className="text-xs text-gray-500 text-center">
                  {settings.running_speed || 10} detik
                </div>
              </div>
            )}
          </div>
        )}

        {zone.content_type === "ticker" && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Teks Ticker
              </label>
              <textarea
                placeholder="Masukkan teks ticker..."
                value={settings.text_content || settings.text || ""}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    text_content: e.target.value,
                  }))
                }
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                rows={3}
              />
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.advanced_ticker || false}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      advanced_ticker: e.target.checked,
                    }))
                  }
                  className="mr-2"
                />
                <span className="text-xs text-gray-600">
                  Aktifkan Advanced Ticker (dengan logo)
                </span>
              </label>
            </div>

            {settings.advanced_ticker && (
              <div className="space-y-3 pl-4 border-l-2 border-blue-200">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.show_logo || false}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          show_logo: e.target.checked,
                        }))
                      }
                      className="mr-2"
                    />
                    <span className="text-xs text-gray-600">
                      Tampilkan Logo Kiri
                    </span>
                  </label>
                </div>

                {settings.show_logo && (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Logo Content ID
                      </label>
                      <input
                        type="text"
                        placeholder="ID konten logo"
                        value={settings.logo_content_id || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            logo_content_id: e.target.value,
                          }))
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Logo Size (px)
                      </label>
                      <input
                        type="number"
                        min="20"
                        max="100"
                        value={
                          parseInt(settings.logo_size?.replace("px", "")) || 40
                        }
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            logo_size: `${e.target.value}px`,
                          }))
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.show_right_logo || false}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          show_right_logo: e.target.checked,
                        }))
                      }
                      className="mr-2"
                    />
                    <span className="text-xs text-gray-600">
                      Tampilkan Logo Kanan
                    </span>
                  </label>
                </div>

                {settings.show_right_logo && (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Right Logo Content ID
                      </label>
                      <input
                        type="text"
                        placeholder="ID konten logo kanan"
                        value={settings.right_logo_content_id || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            right_logo_content_id: e.target.value,
                          }))
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Right Logo Size (px)
                      </label>
                      <input
                        type="number"
                        min="20"
                        max="100"
                        value={
                          parseInt(
                            settings.right_logo_size?.replace("px", "")
                          ) || 40
                        }
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            right_logo_size: `${e.target.value}px`,
                          }))
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Padding Horizontal (px)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={settings.padding_x || 16}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        padding_x: parseInt(e.target.value),
                      }))
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Padding Vertical (px)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={settings.padding_y || 8}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        padding_y: parseInt(e.target.value),
                      }))
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.text_shadow || false}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          text_shadow: e.target.checked,
                        }))
                      }
                      className="mr-2"
                    />
                    <span className="text-xs text-gray-600">Text Shadow</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Letter Spacing
                  </label>
                  <select
                    value={settings.letter_spacing || "normal"}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        letter_spacing: e.target.value,
                      }))
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="normal">Normal</option>
                    <option value="0.05em">Tight</option>
                    <option value="0.1em">Wide</option>
                    <option value="0.15em">Wider</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Font Weight
                  </label>
                  <select
                    value={settings.font_weight || "normal"}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        font_weight: e.target.value,
                      }))
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value="600">Semi Bold</option>
                    <option value="300">Light</option>
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Kecepatan Scroll
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={settings.scroll_speed || 5}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    scroll_speed: parseInt(e.target.value),
                  }))
                }
                className="w-full"
              />
              <span className="text-xs text-gray-500">
                {settings.scroll_speed || 5}
              </span>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Arah</label>
              <select
                value={settings.direction || "horizontal"}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    direction: e.target.value,
                  }))
                }
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="horizontal">Horizontal</option>
                <option value="vertical">Vertikal</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Font Size
              </label>
              <input
                type="number"
                min="12"
                max="72"
                value={parseInt(settings.font_size?.replace("px", "")) || 18}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    font_size: `${e.target.value}px`,
                  }))
                }
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Warna Teks
              </label>
              <input
                type="color"
                value={settings.text_color || "#ffffff"}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    text_color: e.target.value,
                  }))
                }
                className="w-full h-8 border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Warna Background
              </label>
              <input
                type="color"
                value={settings.background_color || "#000000"}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    background_color: e.target.value,
                  }))
                }
                className="w-full h-8 border border-gray-300 rounded"
              />
            </div>
          </div>
        )}

        {zone.content_type === "clock" && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Clock Style
              </label>
              <select
                value={settings.clock_style || "modern"}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    clock_style: e.target.value,
                  }))
                }
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="modern">Modern Digital</option>
                <option value="analog">Analog</option>
                <option value="retro">Retro/Neon</option>
                <option value="classic">Classic</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Time Format
              </label>
              <select
                value={settings.time_format || "24h"}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    time_format: e.target.value,
                  }))
                }
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="24h">24 Hour</option>
                <option value="12h">12 Hour (AM/PM)</option>
              </select>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.show_seconds !== false}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      show_seconds: e.target.checked,
                    }))
                  }
                  className="mr-2"
                />
                <span className="text-xs text-gray-600">Show Seconds</span>
              </label>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.show_date !== false}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      show_date: e.target.checked,
                    }))
                  }
                  className="mr-2"
                />
                <span className="text-xs text-gray-600">Show Date</span>
              </label>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.show_weekday !== false}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      show_weekday: e.target.checked,
                    }))
                  }
                  className="mr-2"
                />
                <span className="text-xs text-gray-600">Show Weekday</span>
              </label>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.show_timezone || false}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      show_timezone: e.target.checked,
                    }))
                  }
                  className="mr-2"
                />
                <span className="text-xs text-gray-600">Show Timezone</span>
              </label>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Timezone
              </label>
              <select
                value={settings.timezone || "Asia/Jakarta"}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, timezone: e.target.value }))
                }
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="Asia/Jakarta">Jakarta (WIB)</option>
                <option value="Asia/Makassar">Makassar (WITA)</option>
                <option value="Asia/Jayapura">Jayapura (WIT)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Time Size (rem)
              </label>
              <input
                type="number"
                min="1"
                max="8"
                step="0.1"
                value={
                  parseFloat(settings.time_size?.replace("rem", "")) || 3.5
                }
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    time_size: `${e.target.value}rem`,
                  }))
                }
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Date Size (rem)
              </label>
              <input
                type="number"
                min="0.5"
                max="3"
                step="0.1"
                value={
                  parseFloat(settings.date_size?.replace("rem", "")) || 1.2
                }
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    date_size: `${e.target.value}rem`,
                  }))
                }
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>

            {settings.clock_style === "analog" && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Digital Size (rem)
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={
                    parseFloat(settings.digital_size?.replace("rem", "")) || 1.5
                  }
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      digital_size: `${e.target.value}rem`,
                    }))
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Custom Theme
              </label>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Background
                  </label>
                  <input
                    type="text"
                    placeholder="linear-gradient(...)"
                    value={settings.custom_theme?.background || ""}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        custom_theme: {
                          ...prev.custom_theme,
                          background: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Text Color
                  </label>
                  <input
                    type="color"
                    value={settings.custom_theme?.textColor || "#ffffff"}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        custom_theme: {
                          ...prev.custom_theme,
                          textColor: e.target.value,
                        },
                      }))
                    }
                    className="w-full h-8 border border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {zone.content_type === "webpage" && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                URL Website
              </label>
              <input
                type="url"
                placeholder="https://example.com"
                value={settings.url || ""}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, url: e.target.value }))
                }
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Refresh Interval (detik)
              </label>
              <input
                type="number"
                min="10"
                value={
                  settings.refresh_interval
                    ? settings.refresh_interval / 1000
                    : 30
                }
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    refresh_interval: parseInt(e.target.value) * 1000,
                  }))
                }
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
        )}

        {zone.content_type === "logo" && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Select Logo Content
              </label>
              <select
                value={settings.content_id || ""}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    content_id: parseInt(e.target.value) || null,
                  }))
                }
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="">-- Pilih Logo --</option>
                {contents
                  .filter((content) => content.type === "image")
                  .map((content) => (
                    <option key={content.id} value={content.id}>
                      {content.filename} ({content.type})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Scale Mode
              </label>
              <select
                value={settings.scale || "contain"}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    scale: e.target.value,
                  }))
                }
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="contain">Contain</option>
                <option value="cover">Cover</option>
                <option value="fill">Fill</option>
                <option value="scale-down">Scale Down</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Max Width (%)
              </label>
              <input
                type="text"
                placeholder="80%"
                value={settings.max_width || ""}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    max_width: e.target.value,
                  }))
                }
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Max Height (%)
              </label>
              <input
                type="text"
                placeholder="80%"
                value={settings.max_height || ""}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    max_height: e.target.value,
                  }))
                }
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Opacity
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.opacity || 1}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    opacity: parseFloat(e.target.value),
                  }))
                }
                className="w-full"
              />
              <div className="text-xs text-gray-500 text-center">
                {(settings.opacity || 1) * 100}%
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Background Color
              </label>
              <input
                type="color"
                value={settings.background || "#transparent"}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    background: e.target.value,
                  }))
                }
                className="w-full h-8 border border-gray-300 rounded"
              />
            </div>
          </div>
        )}

        {zone.content_type === "qr_code" && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                QR Code Text/URL
              </label>
              <textarea
                placeholder="https://example.com atau teks apa saja"
                value={settings.text || settings.url || ""}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    text: e.target.value,
                  }))
                }
                rows="3"
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                QR Code Size (px)
              </label>
              <input
                type="number"
                min="50"
                max="500"
                value={settings.size || 150}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    size: parseInt(e.target.value),
                  }))
                }
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                QR Color
              </label>
              <input
                type="color"
                value={settings.color || "#000000"}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    color: e.target.value,
                  }))
                }
                className="w-full h-8 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Background Color
              </label>
              <input
                type="color"
                value={settings.background || "#ffffff"}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    background: e.target.value,
                  }))
                }
                className="w-full h-8 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Opacity
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.opacity || 1}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    opacity: parseFloat(e.target.value),
                  }))
                }
                className="w-full"
              />
              <div className="text-xs text-gray-500 text-center">
                {(settings.opacity || 1) * 100}%
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleSave}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Simpan Pengaturan
        </button>
      </div>
    </div>
  );

  // Main return starts here
  return (
    <>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Left Sidebar - Tools */}
        <div className="w-80 bg-white shadow-lg flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={onCancel}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-800">
                Layout Builder
              </h1>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nama Layout"
                value={layoutData.name}
                onChange={(e) =>
                  setLayoutData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <textarea
                placeholder="Deskripsi Layout"
                value={layoutData.description}
                onChange={(e) =>
                  setLayoutData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={2}
              />
            </div>
          </div>

          {/* Content Types */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4">Jenis Konten</h3>
            <div className="grid grid-cols-2 gap-2">
              {CONTENT_TYPES.map((type) => {
                const IconComponent = type.icon;
                return (
                  <div
                    key={type.id}
                    draggable
                    onDragStart={() => setDraggedType(type.id)}
                    className={`cursor-move p-3 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors ${type.color}`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <IconComponent className="h-5 w-5" />
                      <span className="text-xs font-medium">{type.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Drag & drop konten ke canvas untuk membuat zona
            </p>
          </div>

          {/* Zone List */}
          <div className="p-6 flex-1 overflow-y-auto">
            <h3 className="font-semibold text-gray-800 mb-4">
              Zona {getCurrentDisplay().name} ({getCurrentDisplayZones().length}
              )
            </h3>

            {getCurrentDisplayZones().length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                Belum ada zona di {getCurrentDisplay().name}.
                <br />
                Drag konten ke canvas untuk membuat zona.
              </p>
            ) : (
              <div className="space-y-2">
                {getCurrentDisplayZones().map((zone) => {
                  const IconComponent = getContentTypeIcon(zone.content_type);
                  return (
                    <div
                      key={zone.id}
                      onClick={() => handleZoneSelect(zone)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedZone?.id === zone.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${getContentTypeColor(
                            zone.content_type
                          )}`}
                        >
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">
                            {zone.zone_name}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {zone.content_type.replace("_", " ")}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteZone(zone.id);
                          }}
                          className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-gray-200 space-y-3">
            <button
              onClick={handleSave}
              disabled={!layoutData.name.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <CheckIcon className="h-5 w-5" />
              Simpan Layout
            </button>

            <button
              onClick={onCancel}
              className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>

        {/* Zone Settings Panel */}
        {showZoneSettings && selectedZone && (
          <ZoneSettingsPanel
            zone={selectedZone}
            contents={contents}
            playlists={playlists}
            onUpdate={(updates) => updateZone(selectedZone.id, updates)}
            onClose={() => {
              setShowZoneSettings(false);
              setSelectedZone(null);
            }}
          />
        )}

        {/* Display Settings Panel */}
        {showDisplaySettings && (
          <div
            style={{
              position: "fixed",
              top: "50px",
              right: "50px",
              width: "300px",
              height: "400px",
              backgroundColor: "white",
              border: "2px solid red",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              zIndex: 999999,
              padding: "20px",
              borderRadius: "8px",
            }}
          >
            <h3
              style={{ color: "red", fontSize: "18px", marginBottom: "10px" }}
            >
              🎉 DISPLAY SETTINGS PANEL 🎉
            </h3>
            <p style={{ marginBottom: "15px", fontSize: "14px" }}>
              Panel berhasil dimuat!
            </p>
            <p
              style={{ marginBottom: "15px", fontSize: "12px", color: "blue" }}
            >
              State: {showDisplaySettings ? "TRUE" : "FALSE"}
            </p>
            <button
              onClick={() => {
                console.log("Close button clicked");
                setShowDisplaySettings(false);
              }}
              style={{
                padding: "10px 20px",
                backgroundColor: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              CLOSE PANEL
            </button>
          </div>
        )}

        {/* Debug Info */}
        {console.log("Render - showDisplaySettings:", showDisplaySettings)}
      </div>

      {/* Display Settings Modal - Simple Form */}
      {modalOpen &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 2147483647,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setModalOpen(false);
              }
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                maxWidth: "800px",
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: "24px",
                  borderBottom: "1px solid #e5e7eb",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: "#1f2937",
                    margin: 0,
                  }}
                >
                  Display Settings
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  style={{
                    padding: "8px",
                    border: "none",
                    background: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "18px",
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div style={{ padding: "24px" }}>
                <div
                  style={{
                    display: "grid",
                    gap: "24px",
                  }}
                >
                  {layoutData.displays.map((display, index) => (
                    <div
                      key={display.id}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        padding: "16px",
                      }}
                    >
                      <h3
                        style={{
                          fontWeight: "600",
                          color: "#1f2937",
                          margin: "0 0 16px 0",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {display.name}
                        {display.primary && (
                          <span
                            style={{
                              backgroundColor: "#dcfce7",
                              color: "#166534",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontSize: "12px",
                            }}
                          >
                            Primary
                          </span>
                        )}
                        {layoutData.displays.length > 1 && (
                          <button
                            onClick={() => removeDisplay(display.id)}
                            style={{
                              marginLeft: "auto",
                              padding: "4px",
                              border: "none",
                              backgroundColor: "transparent",
                              color: "#dc2626",
                              cursor: "pointer",
                              borderRadius: "4px",
                            }}
                          >
                            🗑️
                          </button>
                        )}
                      </h3>

                      <div style={{ display: "grid", gap: "16px" }}>
                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: "14px",
                              fontWeight: "500",
                              marginBottom: "4px",
                            }}
                          >
                            Display Name
                          </label>
                          <input
                            type="text"
                            value={display.name}
                            onChange={(e) =>
                              updateDisplay(display.id, {
                                name: e.target.value,
                              })
                            }
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              border: "1px solid #d1d5db",
                              borderRadius: "6px",
                              fontSize: "14px",
                              boxSizing: "border-box",
                            }}
                          />
                        </div>

                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: "14px",
                              fontWeight: "500",
                              marginBottom: "4px",
                            }}
                          >
                            Orientation
                          </label>
                          <select
                            value={display.orientation}
                            onChange={(e) =>
                              updateDisplay(display.id, {
                                orientation: e.target.value,
                              })
                            }
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              border: "1px solid #d1d5db",
                              borderRadius: "6px",
                              fontSize: "14px",
                              boxSizing: "border-box",
                            }}
                          >
                            <option value="landscape">Landscape (16:9)</option>
                            <option value="portrait">Portrait (9:16)</option>
                          </select>
                        </div>

                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: "14px",
                              fontWeight: "500",
                              marginBottom: "4px",
                            }}
                          >
                            Resolution
                          </label>
                          <select
                            value={display.resolution || "1920x1080"}
                            onChange={(e) =>
                              updateDisplay(display.id, {
                                resolution: e.target.value,
                              })
                            }
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              border: "1px solid #d1d5db",
                              borderRadius: "6px",
                              fontSize: "14px",
                              boxSizing: "border-box",
                            }}
                          >
                            <option value="1920x1080">
                              1920x1080 (Full HD)
                            </option>
                            <option value="2560x1440">
                              2560x1440 (2K QHD)
                            </option>
                            <option value="3840x2160">
                              3840x2160 (4K UHD)
                            </option>
                            <option value="1280x720">1280x720 (HD)</option>
                            <option value="1366x768">1366x768 (HD)</option>
                          </select>
                        </div>

                        <div>
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              cursor: "pointer",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={display.primary}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setLayoutData((prev) => ({
                                    ...prev,
                                    displays: prev.displays.map((d) => ({
                                      ...d,
                                      primary: d.id === display.id,
                                    })),
                                  }));
                                }
                              }}
                            />
                            <span
                              style={{ fontSize: "14px", fontWeight: "500" }}
                            >
                              Set as Primary Display
                            </span>
                          </label>
                        </div>

                        <div style={{ fontSize: "12px", color: "#6b7280" }}>
                          Zones:{" "}
                          {
                            layoutData.zones.filter(
                              (z) =>
                                !z.display_id || z.display_id === display.id
                            ).length
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add New Display Button */}
                <div style={{ marginTop: "24px", textAlign: "center" }}>
                  <button
                    onClick={addDisplay}
                    style={{
                      padding: "12px 24px",
                      border: "2px dashed #3b82f6",
                      backgroundColor: "transparent",
                      color: "#3b82f6",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "14px",
                    }}
                  >
                    + Add New Display
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: "24px",
                  borderTop: "1px solid #e5e7eb",
                  textAlign: "right",
                }}
              >
                <button
                  onClick={() => setModalOpen(false)}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
