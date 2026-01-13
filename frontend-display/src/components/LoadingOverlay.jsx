const LoadingOverlay = ({ type = "video", itemName }) => {
  return (
    <div className="fullscreen flex items-center justify-center bg-black absolute top-0 left-0 z-10">
      <div className="text-center text-white">
        {/* Modern Loading Animation */}
        <div className="relative mb-6">
          <div className="w-16 h-16 mx-auto">
            {/* Outer ring */}
            <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
            {/* Spinning inner ring */}
            <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
            {/* Pulsing center */}
            <div className="absolute inset-3 bg-blue-500/30 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">
            {type === "video"
              ? "Loading Video..."
              : type === "image"
              ? "Loading Image..."
              : "Loading Content..."}
          </h3>

          {itemName && (
            <p className="text-sm text-gray-400 max-w-xs mx-auto truncate">
              {itemName}
            </p>
          )}

          <div className="flex items-center justify-center space-x-1 mt-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
