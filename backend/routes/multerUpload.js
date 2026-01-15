const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 500MB per file
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: function (req, file, cb) {
    // Generate user-friendly unique filename
    // Format: filename.ext, filename (2).ext, filename (3).ext, etc.
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const uploadsDir = path.join(__dirname, "../uploads");

    // Start with original name
    let finalFilename = file.originalname;
    let counter = 2;

    // Check if file exists, increment counter until we find available name
    while (fs.existsSync(path.join(uploadsDir, finalFilename))) {
      finalFilename = `${nameWithoutExt} (${counter})${ext}`;
      counter++;
    }

    cb(null, finalFilename);
  },
});

const fileFilter = (req, file, cb) => {
  // Accept images, videos, and text files only
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/quicktime",
    "video/x-matroska",
    "text/plain",
    "application/pdf",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("File type not allowed"), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

module.exports = upload;
