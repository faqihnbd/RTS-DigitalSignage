import React, { useState, useEffect } from "react";
import {
  SquaresPlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  Squares2X2Icon,
  RectangleStackIcon,
  ComputerDesktopIcon,
  FilmIcon,
  PhotoIcon,
  GlobeAltIcon,
  ClockIcon,
  CloudIcon,
  QrCodeIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import LayoutBuilder from "../components/LayoutBuilder";
import LayoutPreview from "../components/LayoutPreview";
import logger from "../utils/logger";

const LAYOUT_TYPES = {
  split_vertical: {
    name: "Split Screen Vertikal",
    description: "Layar dibagi kiri-kanan",
    icon: "↔️",
    color: "from-blue-500 to-blue-600",
  },
  split_horizontal: {
    name: "Split Screen Horizontal",
    description: "Layar dibagi atas-bawah",
    icon: "↕️",
    color: "from-green-500 to-green-600",
  },
  multi_zone: {
    name: "Multi-Zone Layout",
    description: "Layout dengan 4 zona berbeda",
    icon: "🏢",
    color: "from-purple-500 to-purple-600",
  },
  l_shape: {
    name: "L-Shape Layout",
    description: "Layout berbentuk L (mirip CNN/BBC)",
    icon: "📺",
    color: "from-red-500 to-red-600",
  },
  carousel: {
    name: "Carousel Fullscreen",
    description: "Konten berputar fullscreen",
    icon: "🎠",
    color: "from-yellow-500 to-yellow-600",
  },
  webpage_embed: {
    name: "Webpage Embed",
    description: "Tampilkan webpage/dashboard",
    icon: "🌐",
    color: "from-indigo-500 to-indigo-600",
  },
  picture_in_picture: {
    name: "Picture in Picture",
    description: "Video utama dengan video kecil",
    icon: "📱",
    color: "from-pink-500 to-pink-600",
  },
  custom: {
    name: "Custom Template",
    description: "Buat template sendiri",
    icon: "🎨",
    color: "from-gray-500 to-gray-600",
  },
};

const CONTENT_TYPE_ICONS = {
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

export default function LayoutManagement() {
  const [layouts, setLayouts] = useState([]);
  const [templates, setTemplates] = useState({});
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    fetchLayouts();
    fetchTemplates();
  }, []);

  const fetchLayouts = async () => {
    try {
      const token =
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("admin_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/layouts`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setLayouts(data);
    } catch (error) {
      logger.logApiError("/api/layouts", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const token =
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("admin_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/layouts/templates`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      logger.logApiError("/api/layouts/templates", error);
    }
  };

  const createLayoutFromTemplate = async (templateType) => {
    try {
      const token =
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("admin_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/layouts/from-template`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            templateType,
            name: `${
              LAYOUT_TYPES[templateType].name
            } - ${new Date().toLocaleDateString()}`,
          }),
        }
      );

      if (response.ok) {
        logger.logLayout("Layout Created from Template", { templateType });
        fetchLayouts();
        setShowTemplates(false);
      }
    } catch (error) {
      logger.logApiError("/api/layouts/from-template (POST)", error);
    }
  };

  const deleteLayout = async (layoutId) => {
    if (!confirm("Apakah Anda yakin ingin menghapus layout ini?")) return;

    try {
      const token =
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("admin_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/layouts/${layoutId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        fetchLayouts();
      }
    } catch (error) {
      console.error("Error deleting layout:", error);
    }
  };

  const handleEditLayout = (layout) => {
    setSelectedLayout(layout);
    setShowBuilder(true);
  };

  const handlePreviewLayout = async (layout) => {
    try {
      // Fetch complete layout data with playlist items
      const token =
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("admin_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/layouts/${layout.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const layoutData = await response.json();

      // Also fetch contents for multiple content support
      const contentsResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/contents`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const contentsData = await contentsResponse.json();

      // Also fetch playlists for additional data
      const playlistsResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/playlists`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const playlistsData = await playlistsResponse.json();

      // Attach contents and playlists to layout data for preview
      layoutData.contents = contentsData;
      layoutData.playlists = playlistsData;

      setSelectedLayout(layoutData);
      setShowPreview(true);
    } catch (error) {
      console.error("Error fetching layout data for preview:", error);
      // Fallback to basic layout if fetch fails
      setSelectedLayout(layout);
      setShowPreview(true);
    }
  };

  const handleSaveLayout = () => {
    fetchLayouts();
    setShowBuilder(false);
    setSelectedLayout(null);
  };

  if (showBuilder) {
    return (
      <LayoutBuilder
        layout={selectedLayout}
        onSave={handleSaveLayout}
        onCancel={() => {
          setShowBuilder(false);
          setSelectedLayout(null);
        }}
      />
    );
  }

  if (showPreview) {
    return (
      <LayoutPreview
        layout={selectedLayout}
        onClose={() => {
          setShowPreview(false);
          setSelectedLayout(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-purple-500 to-indigo-600 rounded-xl shadow-lg">
            <Squares2X2Icon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Layout Manager</h1>
            <p className="text-gray-600">
              Kelola layout dan template tampilan digital signage
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowTemplates(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <PlusIcon className="h-5 w-5" />
            Buat dari Template
          </button>

          <button
            onClick={() => {
              setSelectedLayout(null);
              setShowBuilder(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <SquaresPlusIcon className="h-5 w-5" />
            Custom Builder
          </button>
        </div>
      </div>

      {/* Template Selection Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">
                  Pilih Template Layout
                </h2>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(LAYOUT_TYPES).map(([key, template]) => (
                  <div
                    key={key}
                    onClick={() => {
                      if (key === "custom") {
                        // For custom template, open builder directly
                        setSelectedLayout(null);
                        setShowTemplates(false);
                        setShowBuilder(true);
                      } else {
                        // For predefined templates, create from template
                        createLayoutFromTemplate(key);
                      }
                    }}
                    className="cursor-pointer group bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-lg transition-all duration-200"
                  >
                    <div
                      className={`w-16 h-16 bg-gradient-to-r ${template.color} rounded-xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform duration-200`}
                    >
                      {template.icon}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {template.name}
                    </h3>

                    <p className="text-gray-600 text-sm mb-4">
                      {template.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-600 font-medium">
                        Klik untuk buat
                      </span>
                      <PlusIcon className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Layouts Grid */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-3 text-gray-600">Memuat layouts...</span>
          </div>
        ) : layouts.length === 0 ? (
          <div className="text-center py-12">
            <Squares2X2Icon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-500 mb-2">
              Belum Ada Layout
            </h3>
            <p className="text-gray-400 mb-6">
              Mulai dengan membuat layout dari template atau custom builder
            </p>
            <button
              onClick={() => setShowTemplates(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
            >
              Buat Layout Pertama
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {layouts.map((layout) => (
              <div
                key={layout.id}
                className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
              >
                {/* Layout Preview */}
                <div className="h-48 bg-gray-50 border-b border-gray-200 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className={`w-24 h-24 bg-gradient-to-r ${
                        LAYOUT_TYPES[layout.type]?.color ||
                        "from-gray-400 to-gray-500"
                      } rounded-xl flex items-center justify-center text-3xl`}
                    >
                      {LAYOUT_TYPES[layout.type]?.icon || "📐"}
                    </div>
                  </div>

                  {/* Zone Count Badge */}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-600">
                    {layout.zones?.length || 0} zona
                  </div>
                </div>

                {/* Layout Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        {layout.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {LAYOUT_TYPES[layout.type]?.name || layout.type}
                      </p>
                    </div>

                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        layout.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {layout.is_active ? "Aktif" : "Nonaktif"}
                    </div>
                  </div>

                  {/* Zones Summary */}
                  {layout.zones && layout.zones.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {layout.zones.slice(0, 3).map((zone, index) => {
                          const IconComponent =
                            CONTENT_TYPE_ICONS[zone.content_type] ||
                            DocumentTextIcon;
                          return (
                            <div
                              key={zone.id}
                              className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-xs"
                            >
                              <IconComponent className="h-3 w-3" />
                              {zone.zone_name}
                            </div>
                          );
                        })}
                        {layout.zones.length > 3 && (
                          <div className="px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-500">
                            +{layout.zones.length - 3} lagi
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePreviewLayout(layout)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                      <EyeIcon className="h-4 w-4" />
                      Preview
                    </button>

                    <button
                      onClick={() => handleEditLayout(layout)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                    >
                      <PencilIcon className="h-4 w-4" />
                      Edit
                    </button>

                    <button
                      onClick={() => deleteLayout(layout.id)}
                      className="flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
