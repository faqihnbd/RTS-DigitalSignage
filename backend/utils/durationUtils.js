const ffmpeg = require("fluent-ffmpeg");
const ffprobeStatic = require("ffprobe-static");
const logger = require("./logger");

// Function untuk mendapatkan durasi video
const getVideoDuration = async (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.setFfprobePath(ffprobeStatic.path);
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        logger.error("FFprobe error", {
          module: "duration-utils",
          filePath,
          error: err.message,
        });
        reject(err);
      } else if (!metadata || !metadata.format || !metadata.format.duration) {
        logger.warn("No duration metadata found, using default", {
          module: "duration-utils",
          filePath,
          defaultDuration: 10,
        });
        resolve(10); // Default 10 detik jika metadata tidak ditemukan
      } else {
        const duration = Math.ceil(metadata.format.duration);
        logger.info("Video duration from metadata", {
          module: "duration-utils",
          filePath,
          duration,
        });
        resolve(duration);
      }
    });
  });
};

// Function untuk mendapatkan durasi berdasarkan tipe file
const getFileDuration = async (filePath, mimeType) => {
  try {
    // Jika mimeType tidak diberikan, coba detect dari file path
    if (!mimeType) {
      // Default assume video jika tidak ada mimeType
      logger.info("No mimeType provided, attempting video duration detection", {
        module: "duration-utils",
        filePath,
      });
      return await getVideoDuration(filePath);
    }

    if (mimeType.startsWith("video/")) {
      return await getVideoDuration(filePath);
    } else if (mimeType.startsWith("image/")) {
      return 10; // Default 10 detik untuk gambar
    } else {
      return 15; // Default 15 detik untuk HTML/text
    }
  } catch (error) {
    logger.error("Error getting file duration", {
      module: "duration-utils",
      filePath,
      mimeType,
      error: error.message,
    });
    return 10; // Default fallback
  }
};

module.exports = {
  getVideoDuration,
  getFileDuration,
};
