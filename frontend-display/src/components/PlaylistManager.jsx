import StorageService from "../services/StorageService";

class PlaylistManager {
  constructor(playerService = null) {
    this.downloadQueue = [];
    this.isDownloading = false;
    this.storageService = new StorageService();
    this.playerService = playerService;
  }

  async cachePlaylist(playlist) {
    try {
      if (!playlist.items || playlist.items.length === 0) {
        return;
      }

      // Check which items need to be downloaded
      const itemsToCache = [];

      for (const item of playlist.items) {
        const isCached = await this.storageService.isContentCached(
          item.content_id
        );
        if (!isCached) {
          itemsToCache.push(item);
        }
      }

      if (itemsToCache.length === 0) {
        return;
      }

      // Add items to download queue
      this.downloadQueue.push(...itemsToCache);

      // Start downloading if not already in progress
      if (!this.isDownloading) {
        this.processDownloadQueue();
      }
    } catch (error) {
      console.error("Error caching playlist:", error);
    }
  }

  async processDownloadQueue() {
    if (this.downloadQueue.length === 0) {
      this.isDownloading = false;
      return;
    }

    this.isDownloading = true;

    while (this.downloadQueue.length > 0) {
      const item = this.downloadQueue.shift();

      try {
        await this.downloadAndCacheItem(item);
      } catch (error) {
        console.error(`Failed to cache ${item.name}:`, error);
      }
    }

    this.isDownloading = false;
  }

  async downloadAndCacheItem(item) {
    try {
      let blob;

      if (this.playerService) {
        // Use PlayerService with proper authentication
        blob = await this.playerService.downloadContent(item.content_id);
      } else {
        // Fallback to direct fetch (without auth)
        const contentUrl = this.getContentUrl(item);
        const response = await fetch(contentUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }
        blob = await response.blob();
      }

      // Save to IndexedDB
      await this.storageService.cacheContent(
        item.content_id,
        blob,
        item.content_type
      );
    } catch (error) {
      console.error(`Download failed for content ${item.content_id}:`, error);
      throw new Error(`Download failed: ${error.message}`);
    }
  }

  getContentUrl(item) {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    return `${baseUrl}/api/player/content/${item.content_id}`;
  }

  async clearOldCache() {
    try {
      // Clear cache older than 7 days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7);

      await this.storageService.clearOldCache(cutoffDate);
    } catch (error) {
      console.error("Error clearing old cache:", error);
    }
  }

  getDownloadProgress() {
    return {
      total: this.downloadQueue.length,
      remaining: this.downloadQueue.length,
      isDownloading: this.isDownloading,
    };
  }
}

export default PlaylistManager;
