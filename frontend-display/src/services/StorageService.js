import localforage from "localforage";

class StorageService {
  constructor() {
    // Configure localforage for better performance
    localforage.config({
      driver: [
        localforage.INDEXEDDB,
        localforage.WEBSQL,
        localforage.LOCALSTORAGE,
      ],
      name: "WisseDigitalSignage",
      version: 1.0,
      storeName: "signage_data",
    });

    // Separate store for cached content
    this.contentStore = localforage.createInstance({
      name: "WisseDigitalSignage",
      storeName: "cached_content",
    });

    // Store for metadata
    this.metaStore = localforage.createInstance({
      name: "WisseDigitalSignage",
      storeName: "metadata",
    });
  }

  // Device Authentication
  async saveDeviceToken(token) {
    try {
      await localforage.setItem("device_token", token);
    } catch (error) {
      console.error("Error saving device token:", error);
      throw error;
    }
  }

  async getDeviceToken() {
    try {
      return await localforage.getItem("device_token");
    } catch (error) {
      console.error("Error getting device token:", error);
      return null;
    }
  }

  async saveDeviceId(deviceId) {
    try {
      await localforage.setItem("device_id", deviceId);
    } catch (error) {
      console.error("Error saving device ID:", error);
      throw error;
    }
  }

  async getDeviceId() {
    try {
      return await localforage.getItem("device_id");
    } catch (error) {
      console.error("Error getting device ID:", error);
      return null;
    }
  }

  async saveSessionId(sessionId) {
    try {
      await localforage.setItem("session_id", sessionId);
    } catch (error) {
      console.error("Error saving session ID:", error);
      throw error;
    }
  }

  async getSessionId() {
    try {
      return await localforage.getItem("session_id");
    } catch (error) {
      console.error("Error getting session ID:", error);
      return null;
    }
  }

  async clearAuth() {
    try {
      await localforage.removeItem("device_token");
      await localforage.removeItem("device_id");
      await localforage.removeItem("session_id");
    } catch (error) {
      console.error("Error clearing auth:", error);
    }
  }

  // Generic get/set for simple key-value storage
  async getItem(key) {
    try {
      return await localforage.getItem(key);
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  }

  async setItem(key, value) {
    try {
      await localforage.setItem(key, value);
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
    }
  }

  // Clear all cache
  async clearCache() {
    try {
      await localforage.clear();
      await this.contentStore.clear();
      await this.metaStore.clear();
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  }

  // Content Caching
  async cacheContent(contentId, blob, contentType) {
    try {
      const cacheData = {
        blob: blob,
        contentType: contentType,
        cachedAt: new Date().toISOString(),
        size: blob.size,
      };

      await this.contentStore.setItem(`content_${contentId}`, cacheData);

      // Update metadata
      await this.updateCacheMetadata(contentId, {
        cachedAt: cacheData.cachedAt,
        size: cacheData.size,
        contentType: contentType,
      });
    } catch (error) {
      console.error("Error caching content:", error);
      throw error;
    }
  }

  async getCachedContent(contentId) {
    try {
      const cacheData = await this.contentStore.getItem(`content_${contentId}`);

      if (!cacheData) {
        return null;
      }

      // Create blob URL for cached content
      const blobUrl = URL.createObjectURL(cacheData.blob);
      return blobUrl;
    } catch (error) {
      console.error("Error getting cached content:", error);
      return null;
    }
  }

  async isContentCached(contentId) {
    try {
      const cacheData = await this.contentStore.getItem(`content_${contentId}`);
      return cacheData !== null;
    } catch (error) {
      console.error("Error checking cached content:", error);
      return false;
    }
  }

  async updateCacheMetadata(contentId, metadata) {
    try {
      await this.metaStore.setItem(`meta_${contentId}`, metadata);
    } catch (error) {
      console.error("Error updating cache metadata:", error);
    }
  }

  async getCacheMetadata(contentId) {
    try {
      return await this.metaStore.getItem(`meta_${contentId}`);
    } catch (error) {
      console.error("Error getting cache metadata:", error);
      return null;
    }
  }

  async clearOldCache(cutoffDate) {
    try {
      const keys = await this.contentStore.keys();

      for (const key of keys) {
        if (key.startsWith("content_")) {
          const contentId = key.replace("content_", "");
          const metadata = await this.getCacheMetadata(contentId);

          if (metadata && new Date(metadata.cachedAt) < cutoffDate) {
            await this.contentStore.removeItem(key);
            await this.metaStore.removeItem(`meta_${contentId}`);
          }
        }
      }
    } catch (error) {
      console.error("Error clearing old cache:", error);
    }
  }

  async getCacheStats() {
    try {
      const keys = await this.contentStore.keys();
      const contentKeys = keys.filter((key) => key.startsWith("content_"));

      let totalSize = 0;
      const items = [];

      for (const key of contentKeys) {
        const contentId = key.replace("content_", "");
        const metadata = await this.getCacheMetadata(contentId);

        if (metadata) {
          totalSize += metadata.size;
          items.push({
            contentId,
            ...metadata,
          });
        }
      }

      return {
        totalItems: contentKeys.length,
        totalSize: totalSize,
        items: items,
      };
    } catch (error) {
      console.error("Error getting cache stats:", error);
      return {
        totalItems: 0,
        totalSize: 0,
        items: [],
      };
    }
  }

  async clearAllCache() {
    try {
      await this.contentStore.clear();
      await this.metaStore.clear();
    } catch (error) {
      console.error("Error clearing all cache:", error);
    }
  }

  // Clear everything - full reset
  async clearEverything() {
    try {
      // Clear all localforage stores
      await localforage.clear();
      await this.contentStore.clear();
      await this.metaStore.clear();

      // Clear localStorage
      localStorage.clear();

      // Clear sessionStorage
      sessionStorage.clear();
    } catch (error) {
      console.error("Error clearing everything:", error);
    }
  }

  // Player Settings
  async savePlayerSettings(settings) {
    try {
      await localforage.setItem("player_settings", settings);
    } catch (error) {
      console.error("Error saving player settings:", error);
    }
  }

  async getPlayerSettings() {
    try {
      const defaultSettings = {
        volume: 1.0,
        autoplay: true,
        loop: true,
        preloadContent: true,
      };

      const saved = await localforage.getItem("player_settings");
      return { ...defaultSettings, ...saved };
    } catch (error) {
      console.error("Error getting player settings:", error);
      return {
        volume: 1.0,
        autoplay: true,
        loop: true,
        preloadContent: true,
      };
    }
  }

  // Last Sync Info
  async saveLastSync(syncInfo) {
    try {
      await localforage.setItem("last_sync", {
        ...syncInfo,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error saving last sync:", error);
    }
  }

  async getLastSync() {
    try {
      return await localforage.getItem("last_sync");
    } catch (error) {
      console.error("Error getting last sync:", error);
      return null;
    }
  }
}

export default StorageService;
