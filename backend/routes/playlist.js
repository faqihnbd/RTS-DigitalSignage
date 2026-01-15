const express = require("express");
const {
  Playlist,
  PlaylistItem,
  Content,
  User,
  Tenant,
  Layout,
  LayoutZone,
  sequelize,
} = require("../models");
const logger = require("../utils/logger");
const router = express.Router();

function canManagePlaylist(req) {
  return (
    req.user &&
    (req.user.role === "tenant_admin" || req.user.role === "super_admin")
  );
}

// Helper function to fix duplicate orders in a playlist
async function fixPlaylistOrder(playlistId) {
  try {
    // Get all items sorted by current order, then by id for consistency
    const items = await PlaylistItem.findAll({
      where: { playlist_id: playlistId },
      order: [
        ["order", "ASC"],
        ["id", "ASC"],
      ],
    });

    // Reassign orders sequentially
    for (let i = 0; i < items.length; i++) {
      const newOrder = i + 1;
      if (items[i].order !== newOrder) {
        await PlaylistItem.update(
          { order: newOrder },
          { where: { id: items[i].id } }
        );
      }
    }
  } catch (error) {
    logger.error(`[ORDER-FIX] Error fixing playlist ${playlistId}:`, {
      error: error.message,
      stack: error.stack,
      playlistId,
    });
  }
}

// GET /playlists
router.get("/", async (req, res) => {
  if (!canManagePlaylist(req))
    return res.status(403).json({ message: "Forbidden" });

  let whereClause = {};
  if (req.user.role === "tenant_admin") {
    whereClause.tenant_id = req.user.tenant_id;
  }
  // Super admin can see all playlists (no where clause restriction)

  const playlists = await Playlist.findAll({
    where: whereClause,
    include: [
      User,
      Tenant,
      {
        model: Layout,
        as: "layout",
        required: false,
        include: [
          {
            model: LayoutZone,
            as: "zones",
          },
        ],
      },
      {
        model: PlaylistItem,
        as: "items",
        include: [
          {
            model: Content,
            as: "content",
          },
        ],
      },
    ],
  });
  res.json(playlists);
});

// POST /playlists
router.post("/", async (req, res) => {
  if (!canManagePlaylist(req))
    return res.status(403).json({ message: "Forbidden" });
  try {
    const { name, layout_id } = req.body;
    const playlist = await Playlist.create({
      tenant_id: req.user.tenant_id,
      name,
      created_by: req.user.id,
      layout_id: layout_id || null,
    });
    res.status(201).json(playlist);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /playlists/:id
router.get("/:id", async (req, res) => {
  if (!canManagePlaylist(req))
    return res.status(403).json({ message: "Forbidden" });
  const playlist = await Playlist.findOne({
    where: { id: req.params.id, tenant_id: req.user.tenant_id },
    include: [
      User,
      Tenant,
      {
        model: Layout,
        as: "layout",
        required: false,
        include: [
          {
            model: LayoutZone,
            as: "zones",
          },
        ],
      },
      {
        model: PlaylistItem,
        as: "items",
        include: [
          {
            model: Content,
            as: "content",
          },
        ],
      },
    ],
  });
  if (!playlist) return res.status(404).json({ message: "Not found" });
  res.json(playlist);
});

// PUT /playlists/:id
router.put("/:id", async (req, res) => {
  if (!canManagePlaylist(req))
    return res.status(403).json({ message: "Forbidden" });
  const playlist = await Playlist.findOne({
    where: { id: req.params.id, tenant_id: req.user.tenant_id },
  });
  if (!playlist) return res.status(404).json({ message: "Not found" });
  try {
    const { name, status, layout_id } = req.body;
    if (name) playlist.name = name;
    if (status) playlist.status = status;
    if (layout_id !== undefined) playlist.layout_id = layout_id;
    await playlist.save();
    res.json(playlist);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /playlists/:id
router.delete("/:id", async (req, res) => {
  if (!canManagePlaylist(req))
    return res.status(403).json({ message: "Forbidden" });
  const playlist = await Playlist.findOne({
    where: { id: req.params.id, tenant_id: req.user.tenant_id },
  });
  if (!playlist) return res.status(404).json({ message: "Not found" });
  await playlist.destroy();
  res.json({ message: "Deleted" });
});

// --- PLAYLIST ITEMS ---

// GET /playlists/:playlistId/items
router.get("/:playlistId/items", async (req, res) => {
  if (!canManagePlaylist(req))
    return res.status(403).json({ message: "Forbidden" });
  const items = await PlaylistItem.findAll({
    where: { playlist_id: req.params.playlistId },
    include: [
      {
        model: Content,
        as: "content",
      },
    ],
  });
  res.json(items);
});

// POST /playlists/:playlistId/items
router.post("/:playlistId/items", async (req, res) => {
  if (!canManagePlaylist(req))
    return res.status(403).json({ message: "Forbidden" });
  try {
    const { content_id, order, duration_sec, orientation, transition } =
      req.body;

    // Create the item first
    const item = await PlaylistItem.create({
      playlist_id: req.params.playlistId,
      content_id,
      order,
      duration_sec,
      orientation,
      transition,
    });

    // Auto-fix order duplicates after creating
    await fixPlaylistOrder(req.params.playlistId);

    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /playlists/:playlistId/items/:itemId
router.put("/:playlistId/items/:itemId", async (req, res) => {
  if (!canManagePlaylist(req))
    return res.status(403).json({ message: "Forbidden" });
  const item = await PlaylistItem.findOne({
    where: { id: req.params.itemId, playlist_id: req.params.playlistId },
  });
  if (!item) return res.status(404).json({ message: "Not found" });
  try {
    const { content_id, order, duration_sec, orientation, transition } =
      req.body;
    if (content_id) item.content_id = content_id;
    if (order) {
      // Check for duplicate order and auto-fix if needed
      const existingItem = await PlaylistItem.findOne({
        where: {
          playlist_id: req.params.playlistId,
          order: order,
          id: { [require("sequelize").Op.ne]: req.params.itemId }, // Not this item
        },
      });

      if (existingItem) {
        // Auto-fix: reorder all items sequentially
        await fixPlaylistOrder(req.params.playlistId);
      }

      item.order = order;
    }
    if (duration_sec !== undefined && duration_sec !== null)
      item.duration_sec = duration_sec;
    if (orientation) item.orientation = orientation;
    if (transition) item.transition = transition;
    await item.save();

    // After saving, ensure no duplicates exist
    await fixPlaylistOrder(req.params.playlistId);

    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /playlists/:playlistId/items/batch-order
router.post("/:playlistId/items/batch-order", async (req, res) => {
  if (!canManagePlaylist(req))
    return res.status(403).json({ message: "Forbidden" });

  try {
    const { items } = req.body; // Expected: [{ id, order }, ...]

    // Update all items in a transaction
    await sequelize.transaction(async (t) => {
      for (const itemData of items) {
        await PlaylistItem.update(
          { order: itemData.order },
          {
            where: {
              id: itemData.id,
              playlist_id: req.params.playlistId,
            },
            transaction: t,
          }
        );
      }
    });

    // Ensure no duplicates after batch update
    await fixPlaylistOrder(req.params.playlistId);

    // Get updated items
    const updatedItems = await PlaylistItem.findAll({
      where: { playlist_id: req.params.playlistId },
      include: [
        {
          model: Content,
          as: "content",
        },
      ],
      order: [["order", "ASC"]],
    });

    res.json({
      message: "Batch order update successful",
      items: updatedItems,
    });
  } catch (err) {
    logger.logError(err, req, {
      action: "Batch Order Update",
      playlistId: req.params.playlistId,
    });
    res.status(400).json({ message: err.message });
  }
});

// DELETE /playlists/:playlistId/items/:itemId
router.delete("/:playlistId/items/:itemId", async (req, res) => {
  if (!canManagePlaylist(req))
    return res.status(403).json({ message: "Forbidden" });
  const item = await PlaylistItem.findOne({
    where: { id: req.params.itemId, playlist_id: req.params.playlistId },
  });
  if (!item) return res.status(404).json({ message: "Not found" });

  await item.destroy();

  // Auto-fix order after deletion to ensure sequential order
  await fixPlaylistOrder(req.params.playlistId);

  res.json({ message: "Deleted" });
});

module.exports = router;
