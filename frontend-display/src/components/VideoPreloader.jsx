import { useRef, useEffect } from "react";

const VideoPreloader = ({ items, currentIndex }) => {
  const preloadRefs = useRef({});

  useEffect(() => {
    // Preload next 2 videos
    const itemsToPreload = [];
    for (let i = 1; i <= 2; i++) {
      const nextIndex = (currentIndex + i) % items.length;
      const nextItem = items[nextIndex];
      if (nextItem && nextItem.content_type === "video") {
        itemsToPreload.push(nextItem);
      }
    }

    // Create preload video elements
    itemsToPreload.forEach((item) => {
      if (!preloadRefs.current[item.content_id]) {
        const video = document.createElement("video");
        video.preload = "auto";
        video.muted = true;
        video.style.display = "none";

        const baseUrl = import.meta.env.VITE_API_URL;
        video.src = `${baseUrl}/api/player/content/${item.content_id}`;

        document.body.appendChild(video);
        preloadRefs.current[item.content_id] = video;

        // Clean up after some time
        setTimeout(() => {
          if (preloadRefs.current[item.content_id]) {
            document.body.removeChild(video);
            delete preloadRefs.current[item.content_id];
          }
        }, 300000); // 5 minutes
      }
    });

    // Cleanup old preload elements
    Object.keys(preloadRefs.current).forEach((contentId) => {
      const isStillNeeded = itemsToPreload.some(
        (item) => item.content_id === contentId
      );
      if (!isStillNeeded) {
        const video = preloadRefs.current[contentId];
        if (video && video.parentNode) {
          document.body.removeChild(video);
        }
        delete preloadRefs.current[contentId];
      }
    });
  }, [items, currentIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(preloadRefs.current).forEach((video) => {
        if (video && video.parentNode) {
          document.body.removeChild(video);
        }
      });
      preloadRefs.current = {};
    };
  }, []);

  return null; // This component doesn't render anything
};

export default VideoPreloader;
