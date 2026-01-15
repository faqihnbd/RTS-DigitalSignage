import { useState, useEffect, useRef, useCallback } from "react";
import MediaPlayer from "./MediaPlayer";
import LayoutPlayer from "./LayoutPlayer";
import PlaylistManager from "./PlaylistManager";
import VideoPreloader from "./VideoPreloader";
import StorageService from "../services/StorageService";
import { PlayerService } from "../services/PlayerService";
import logger from "../utils/logger";

const PlayerScreen = ({ playerData, deviceId }) => {
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerService, setPlayerService] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [playbackError, setPlaybackError] = useState(null);
  const [errorRetryCount, setErrorRetryCount] = useState(0);

  // Refs for tracking
  const scheduleCheckIntervalRef = useRef(null);
  const errorRecoveryTimeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // Initialize PlayerService for content download
  useEffect(() => {
    const initializePlayerService = async () => {
      try {
        const storage = new StorageService();
        const token = await storage.getDeviceToken();

        if (token && deviceId) {
          const service = new PlayerService(deviceId, token);
          setPlayerService(service);
        }
      } catch (error) {
        logger.logDevice(
          "PlayerService Init Error",
          { deviceId, error: error.message },
          "error"
        );
      }
    };

    if (deviceId) {
      initializePlayerService();
    }
  }, [deviceId]);

  useEffect(() => {
    if (
      playerData &&
      playerData.playlists &&
      playerData.playlists.length > 0 &&
      playerService &&
      !isInitialized
    ) {
      initializePlayback();
    }
  }, [playerData, playerService, isInitialized]);

  // Periodically check if schedule has changed (every 60 seconds)
  useEffect(() => {
    if (
      !playerData ||
      !playerData.playlists ||
      playerData.playlists.length === 0
    ) {
      return;
    }

    const checkSchedule = () => {
      const activePlaylist = getActivePlaylist();

      // If active playlist changed, switch to it
      if (
        activePlaylist &&
        currentPlaylist &&
        activePlaylist.id !== currentPlaylist.id
      ) {
        logger.logPlaylist("Schedule Playlist Changed", {
          playlistId: activePlaylist.id,
        });
        setCurrentPlaylist(activePlaylist);
        setCurrentItemIndex(0);
        setIsPlaying(true);
      }

      // If no current playlist but there is an active one, initialize it
      if (activePlaylist && !currentPlaylist) {
        logger.logPlaylist("Schedule Playlist Init", {
          playlistId: activePlaylist.id,
        });
        setCurrentPlaylist(activePlaylist);
        setCurrentItemIndex(0);
        setIsPlaying(true);
        setIsInitialized(true);
      }
    };

    // Check schedule every 60 seconds
    scheduleCheckIntervalRef.current = setInterval(checkSchedule, 60000);

    return () => {
      if (scheduleCheckIntervalRef.current) {
        clearInterval(scheduleCheckIntervalRef.current);
      }
    };
  }, [playerData, currentPlaylist]);

  // Error recovery: if stuck for too long, try to recover
  useEffect(() => {
    const checkRecovery = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;

      // If no activity for 5 minutes, try to recover
      if (timeSinceLastActivity > 300000 && isInitialized) {
        logger.logAction(
          "Recovery No Activity",
          { timeSinceLastActivity },
          "warn"
        );
        handleRecovery();
      }
    };

    const recoveryInterval = setInterval(checkRecovery, 60000);

    return () => {
      clearInterval(recoveryInterval);
      if (errorRecoveryTimeoutRef.current) {
        clearTimeout(errorRecoveryTimeoutRef.current);
      }
    };
  }, [isInitialized]);

  const handleRecovery = useCallback(() => {
    logger.logAction("Recovery Attempt", { retryCount: errorRetryCount });

    const newRetryCount = errorRetryCount + 1;
    setErrorRetryCount(newRetryCount);

    // If too many retries, reload the page
    if (newRetryCount > 5) {
      logger.logAction(
        "Recovery Max Retries - Reload",
        { retryCount: newRetryCount },
        "warn"
      );
      window.location.reload();
      return;
    }

    // Reset playback state
    setIsInitialized(false);
    setPlaybackError(null);
    setCurrentItemIndex(0);

    // Get active playlist and reinitialize
    const activePlaylist = getActivePlaylist();
    if (activePlaylist) {
      setCurrentPlaylist(activePlaylist);
      setIsPlaying(true);
      setIsInitialized(true);
      lastActivityRef.current = Date.now();
    }
  }, [errorRetryCount]);

  const initializePlayback = async () => {
    try {
      // Get active playlist based on schedule
      const activePlaylist = getActivePlaylist();

      if (activePlaylist) {
        setCurrentPlaylist(activePlaylist);
        setCurrentItemIndex(0);
        setIsPlaying(true);
        setIsInitialized(true); // Mark as initialized
        lastActivityRef.current = Date.now();

        // Cache content if needed
        await cachePlaylistContent(activePlaylist);
      }
    } catch (error) {
      logger.logAction(
        "Playback Init Error",
        { error: error.message },
        "error"
      );
      setPlaybackError(error.message);

      // Schedule retry
      errorRecoveryTimeoutRef.current = setTimeout(() => {
        handleRecovery();
      }, 5000);
    }
  };

  const getActivePlaylist = () => {
    if (!playerData.playlists || playerData.playlists.length === 0) {
      return null;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Find playlist with active schedule
    for (const playlist of playerData.playlists) {
      if (playlist.schedules && playlist.schedules.length > 0) {
        for (const schedule of playlist.schedules) {
          if (isScheduleActive(schedule, currentTime, currentDay)) {
            return playlist;
          }
        }
      }
    }

    // Return first playlist if no schedule matches
    return playerData.playlists[0];
  };

  const isScheduleActive = (schedule, currentTime, currentDay) => {
    try {
      // Check if current day is active
      const activeDays = schedule.days || [0, 1, 2, 3, 4, 5, 6]; // Default: all days
      if (!activeDays.includes(currentDay)) {
        return false;
      }

      // Check time range
      const startTime = parseTime(schedule.start_time || "00:00");
      const endTime = parseTime(schedule.end_time || "23:59");

      return currentTime >= startTime && currentTime <= endTime;
    } catch (error) {
      logger.logAction(
        "Schedule Check Error",
        { error: error.message },
        "error"
      );
      return true; // Default to active if error
    }
  };

  const parseTime = (timeString) => {
    const [hours, minutes] = timeString.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const cachePlaylistContent = async (playlist) => {
    try {
      const playlistManager = new PlaylistManager(playerService);
      await playlistManager.cachePlaylist(playlist);
    } catch (error) {
      logger.logPlaylist(
        "Cache Error",
        { playlistId: playlist?.id, error: error.message },
        "error"
      );
    }
  };

  const handleItemEnd = useCallback(() => {
    if (!currentPlaylist || !currentPlaylist.items) return;

    // Update last activity timestamp
    lastActivityRef.current = Date.now();

    // Reset error retry count on successful item playback
    if (errorRetryCount > 0) {
      setErrorRetryCount(0);
    }

    const nextIndex = (currentItemIndex + 1) % currentPlaylist.items.length;
    setCurrentItemIndex(nextIndex);
  }, [currentPlaylist, currentItemIndex, errorRetryCount]);

  const handleScreenClick = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      lastActivityRef.current = Date.now();
    }
  };

  const getCurrentItem = () => {
    if (
      !currentPlaylist ||
      !currentPlaylist.items ||
      currentPlaylist.items.length === 0
    ) {
      return null;
    }

    const item = currentPlaylist.items[currentItemIndex];
    return item;
  };

  // Show loading if no data
  if (!playerData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-xl">Loading playlist...</p>
        </div>
      </div>
    );
  }

  // Debug: tampilkan jika playlist kosong
  if (!playerData.playlists || playerData.playlists.length === 0) {
    logger.logDevice("No Playlist Assigned", { deviceId }, "warn");
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl mb-4">No Playlist Assigned</h2>
          <p className="text-gray-400">Device: {deviceId}</p>
          <p className="text-gray-400">
            Tidak ada playlist yang di-assign ke perangkat ini.
          </p>
        </div>
      </div>
    );
  }

  // Show message if no playlists
  if (!currentPlaylist) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl mb-4">No Active Playlist</h2>
          <p className="text-gray-400">Device: {deviceId}</p>
          <p className="text-gray-400">
            No playlist is scheduled for this time period.
          </p>
        </div>
      </div>
    );
  }

  const currentItem = getCurrentItem();

  // Check if current playlist has a layout
  const hasLayout =
    currentPlaylist?.layout && currentPlaylist.layout.zones?.length > 0;

  return (
    <div className="fullscreen bg-black" onClick={handleScreenClick}>
      {/* Video Preloader for smooth transitions - only for non-layout playlists */}
      {!hasLayout && currentPlaylist && currentPlaylist.items && (
        <VideoPreloader
          items={currentPlaylist.items}
          currentIndex={currentItemIndex}
        />
      )}

      {hasLayout ? (
        // Render layout-based content
        <LayoutPlayer
          playlist={currentPlaylist}
          onEnded={handleItemEnd}
          isPlaying={isPlaying}
        />
      ) : currentItem ? (
        // Render traditional fullscreen content
        <MediaPlayer
          item={currentItem}
          onEnded={handleItemEnd}
          isPlaying={isPlaying}
        />
      ) : (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center text-white">
            <h2 className="text-2xl mb-4">No Current Item</h2>
            <p className="text-gray-400">Device: {deviceId}</p>
            <p className="text-gray-400">
              Playlist: {currentPlaylist?.name || "None"}
            </p>
            <p className="text-gray-400">
              Items: {currentPlaylist?.items?.length || 0}
            </p>
          </div>
        </div>
      )}

      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
          <div>Device: {deviceId}</div>
          <div>Playlist: {currentPlaylist?.name}</div>
          <div>Layout: {hasLayout ? "Yes" : "No"}</div>
          <div>
            Item: {currentItemIndex + 1}/{currentPlaylist?.items?.length || 0}
          </div>
          <div>Current: {currentItem?.name || "None"}</div>
        </div>
      )}
    </div>
  );
};

export default PlayerScreen;
