const ffmpeg = require("fluent-ffmpeg");
const ffprobeStatic = require("ffprobe-static");

// Function untuk mendapatkan durasi video
const getVideoDuration = async (filePath) => {
  return new Promise((resolve) => {
    ffmpeg.setFfprobePath(ffprobeStatic.path);
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err || !metadata || !metadata.format || !metadata.format.duration) {
        console.error("Error getting video duration:", err);
        resolve(10); // Default 10 detik
      } else {
        resolve(Math.ceil(metadata.format.duration));
      }
    });
  });
};

// Function untuk mendapatkan durasi berdasarkan tipe file
const getFileDuration = async (filePath, mimeType) => {
  try {
    if (mimeType.startsWith("video/")) {
      return await getVideoDuration(filePath);
    } else if (mimeType.startsWith("image/")) {
      return 10; // Default 10 detik untuk gambar
    } else {
      return 15; // Default 15 detik untuk HTML/text
    }
  } catch (error) {
    console.error("Error getting file duration:", error);
    return 10; // Default fallback
  }
};

module.exports = {
  getVideoDuration,
  getFileDuration,
};
