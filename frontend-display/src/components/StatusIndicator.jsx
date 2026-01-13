const StatusIndicator = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case "online":
        return {
          color: "bg-green-500",
          text: "Online",
          icon: "✓",
          pulse: false,
        };
      case "syncing":
        return {
          color: "bg-yellow-500",
          text: "Syncing",
          icon: "↻",
          pulse: true,
        };
      case "offline":
      default:
        return {
          color: "bg-red-500",
          text: "Offline",
          icon: "⚠",
          pulse: false,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="flex items-center space-x-2 bg-black/60 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2">
        <div
          className={`w-3 h-3 rounded-full ${config.color} ${
            config.pulse ? "animate-pulse" : ""
          }`}
        ></div>
        <span className="text-white text-xs font-medium">{config.text}</span>
      </div>
    </div>
  );
};

export default StatusIndicator;
