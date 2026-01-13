const express = require("express");
const { Content, User, Tenant } = require("../models");
const upload = require("./multerUpload");
const { checkStorageQuota, getStorageInfo } = require("./storageMiddleware");
const { getFileDuration } = require("../utils/durationUtils");
const fs = require("fs");
const path = require("path");
const router = express.Router();

// Only tenant admin can manage content for their tenant, or super admin can manage all
function canManageContent(req) {
  return (
    req.user &&
    (req.user.role === "tenant_admin" || req.user.role === "super_admin")
  );
}

// GET /contents
router.get("/", async (req, res) => {
  if (!canManageContent(req))
    return res.status(403).json({ message: "Forbidden" });

  let whereClause = {};
  if (req.user.role === "tenant_admin") {
    whereClause.tenant_id = req.user.tenant_id;
  }
  // Super admin can see all content (no where clause restriction)

  const contents = await Content.findAll({
    where: whereClause,
    include: [User, Tenant],
  });

  res.json(contents);
});

// GET /contents/storage-info
router.get("/storage-info", async (req, res) => {
  if (!canManageContent(req))
    return res.status(403).json({ message: "Forbidden" });

  try {
    const storageInfo = await getStorageInfo(req.user.tenant_id);
    if (!storageInfo) {
      return res.status(404).json({ message: "Storage info not found" });
    }
    res.json(storageInfo);
  } catch (error) {
    console.error("Get storage info error:", error);
    res.status(500).json({ message: "Error retrieving storage info" });
  }
});

// POST /contents
// Upload content (image/video/text) dengan batasan storage per paket
router.post("/", upload.single("file"), checkStorageQuota, async (req, res) => {
  if (!canManageContent(req))
    return res.status(403).json({ message: "Forbidden" });
  try {
    const tenant_id = req.user.tenant_id;
    const fileSize = req.file ? req.file.size : 0;

    // Determine type
    let type = "text";
    if (req.file) {
      if (req.file.mimetype.startsWith("image/")) type = "image";
      else if (req.file.mimetype.startsWith("video/")) type = "video";
      else type = "text";
    }

    // Get duration for video files
    let duration_sec = null;
    if (req.file && type === "video") {
      try {
        duration_sec = await getFileDuration(req.file.path);
      } catch (error) {
        console.error("Error getting video duration:", error);
        // Continue without duration if detection fails
      }
    }

    const content = await Content.create({
      tenant_id,
      user_id: req.user.id,
      type,
      filename: req.file ? req.file.originalname : null,
      url: req.file ? `/uploads/${req.file.originalname}` : null,
      size: fileSize,
      duration_sec,
    });
    res.status(201).json(content);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /contents/:id
router.get("/:id", async (req, res) => {
  if (!canManageContent(req))
    return res.status(403).json({ message: "Forbidden" });
  const content = await Content.findOne({
    where: { id: req.params.id, tenant_id: req.user.tenant_id },
    include: [User, Tenant],
  });
  if (!content) return res.status(404).json({ message: "Not found" });
  res.json(content);
});

// PUT /contents/:id
router.put("/:id", async (req, res) => {
  if (!canManageContent(req))
    return res.status(403).json({ message: "Forbidden" });
  const content = await Content.findOne({
    where: { id: req.params.id, tenant_id: req.user.tenant_id },
  });
  if (!content) return res.status(404).json({ message: "Not found" });
  try {
    const { type, filename, url, size } = req.body;
    if (type) content.type = type;
    if (filename) content.filename = filename;
    if (url) content.url = url;
    if (size) content.size = size;
    await content.save();
    res.json(content);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /contents/:id
router.delete("/:id", async (req, res) => {
  if (!canManageContent(req))
    return res.status(403).json({ message: "Forbidden" });
  const content = await Content.findOne({
    where: { id: req.params.id, tenant_id: req.user.tenant_id },
  });
  if (!content) return res.status(404).json({ message: "Not found" });
  await content.destroy();
  res.json({ message: "Deleted" });
});

// GET /content/file/:id - Serve content files for player
router.get("/file/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Find content by ID
    const content = await Content.findByPk(id);

    if (!content) {
      return res.status(404).json({ error: "Content not found" });
    }

    // Check if file exists
    const filePath = path.join(
      __dirname,
      "..",
      content.file_path || `uploads/${content.filename}`
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found on disk" });
    }

    // Set appropriate headers
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    res.set({
      "Content-Type": content.mime_type || "application/octet-stream",
      "Content-Length": fileSize,
      "Content-Disposition": `inline; filename="${content.filename}"`,
      "Cache-Control": "public, max-age=31536000", // Cache for 1 year
      "Accept-Ranges": "bytes",
    });

    // Support range requests for video streaming
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;

      res.status(206);
      res.set({
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Content-Length": chunksize,
      });

      const stream = fs.createReadStream(filePath, { start, end });
      stream.pipe(res);
    } else {
      // Send full file
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    }
  } catch (error) {
    console.error("Error serving content file:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /contents/:id/file - Serve content file by ID
router.get("/:id/file", async (req, res) => {
  try {
    const contentId = req.params.id;

    // Find content by ID
    const content = await Content.findByPk(contentId);
    if (!content) {
      return res.status(404).json({ error: "Content not found" });
    }

    const filePath = path.join(__dirname, "../uploads", content.filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    // Set content type based on file extension
    const ext = path.extname(content.filename).toLowerCase();
    const mimeTypes = {
      ".mp4": "video/mp4",
      ".avi": "video/avi",
      ".mov": "video/quicktime",
      ".wmv": "video/x-ms-wmv",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
    };

    const contentType = mimeTypes[ext] || "application/octet-stream";
    res.set("Content-Type", contentType);
    res.set("Content-Length", fileSize);

    // Handle range requests for video streaming
    const range = req.headers.range;
    if (range && contentType.startsWith("video/")) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;

      res.status(206);
      res.set({
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Content-Length": chunksize,
      });

      const stream = fs.createReadStream(filePath, { start, end });
      stream.pipe(res);
    } else {
      // Send full file
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    }
  } catch (error) {
    console.error("Error serving content file by ID:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /contents/public/:id - Public endpoint for display players
router.get("/public/:id", async (req, res) => {
  try {
    const contentId = req.params.id;

    // Find content by ID (no auth required for display players)
    const content = await Content.findByPk(contentId, {
      attributes: ["id", "type", "filename", "url", "size", "title"],
    });

    if (!content) {
      return res.status(404).json({ error: "Content not found" });
    }

    res.json(content);
  } catch (error) {
    console.error("Error getting public content:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
