const express = require("express");
const router = express.Router();
const {
  Layout,
  LayoutZone,
  Content,
  Playlist,
  PlaylistItem,
  Tenant,
  User,
} = require("../models");
const authMiddleware = require("./authMiddleware");
const logger = require("../utils/logger");

// Predefined layout templates
const LAYOUT_TEMPLATES = {
  split_vertical: {
    name: "Split Screen Vertikal",
    description: "Layar dibagi kiri-kanan",
    zones: [
      {
        zone_name: "main",
        position: { x: 0, y: 0, width: 70, height: 100, unit: "percentage" },
        content_type: "video",
        settings: { autoplay: true, loop: true },
      },
      {
        zone_name: "sidebar",
        position: { x: 70, y: 0, width: 30, height: 100, unit: "percentage" },
        content_type: "ticker",
        settings: { scroll_speed: 5, background_color: "#000000" },
      },
    ],
  },
  split_horizontal: {
    name: "Split Screen Horizontal",
    description: "Layar dibagi atas-bawah",
    zones: [
      {
        zone_name: "main",
        position: { x: 0, y: 0, width: 100, height: 75, unit: "percentage" },
        content_type: "video",
        settings: { autoplay: true, loop: true },
      },
      {
        zone_name: "bottom_ticker",
        position: { x: 0, y: 75, width: 100, height: 25, unit: "percentage" },
        content_type: "ticker",
        settings: { scroll_speed: 3, font_size: "24px" },
      },
    ],
  },
  multi_zone: {
    name: "Multi-Zone Layout",
    description: "Layout dengan 4 zona berbeda",
    zones: [
      {
        zone_name: "main_video",
        position: { x: 0, y: 0, width: 70, height: 70, unit: "percentage" },
        content_type: "video",
        settings: { autoplay: true, loop: true },
      },
      {
        zone_name: "logo",
        position: { x: 70, y: 0, width: 30, height: 20, unit: "percentage" },
        content_type: "logo",
        settings: { scale: "contain" },
      },
      {
        zone_name: "ticker",
        position: { x: 70, y: 20, width: 30, height: 50, unit: "percentage" },
        content_type: "ticker",
        settings: { scroll_speed: 4 },
      },
      {
        zone_name: "widget",
        position: { x: 70, y: 70, width: 30, height: 30, unit: "percentage" },
        content_type: "clock",
        settings: { format: "HH:mm:ss", timezone: "Asia/Jakarta" },
      },
    ],
  },
  l_shape: {
    name: "L-Shape Layout",
    description: "Layout berbentuk L (mirip CNN/BBC)",
    zones: [
      {
        zone_name: "main_video",
        position: { x: 30, y: 0, width: 70, height: 80, unit: "percentage" },
        content_type: "video",
        settings: { autoplay: true, loop: true },
      },
      {
        zone_name: "left_sidebar",
        position: { x: 0, y: 0, width: 30, height: 100, unit: "percentage" },
        content_type: "ticker",
        settings: { scroll_speed: 3, direction: "vertical" },
      },
      {
        zone_name: "bottom_strip",
        position: { x: 30, y: 80, width: 70, height: 20, unit: "percentage" },
        content_type: "ticker",
        settings: { scroll_speed: 5, direction: "horizontal" },
      },
    ],
  },
  carousel: {
    name: "Carousel Fullscreen",
    description: "Konten berputar fullscreen dengan durasi teratur",
    zones: [
      {
        zone_name: "fullscreen",
        position: { x: 0, y: 0, width: 100, height: 100, unit: "percentage" },
        content_type: "playlist",
        settings: {
          autoplay: true,
          loop: true,
          transition: "fade",
          duration_per_slide: 10,
        },
      },
    ],
  },
  webpage_embed: {
    name: "Webpage Embed",
    description: "Tampilkan webpage/dashboard dalam satu area",
    zones: [
      {
        zone_name: "webpage",
        position: { x: 0, y: 0, width: 100, height: 100, unit: "percentage" },
        content_type: "webpage",
        settings: {
          refresh_interval: 30000,
          zoom: 1.0,
          scrollable: false,
        },
      },
    ],
  },
  picture_in_picture: {
    name: "Picture in Picture",
    description: "Video utama dengan video kecil di pojok",
    zones: [
      {
        zone_name: "main_video",
        position: { x: 0, y: 0, width: 100, height: 100, unit: "percentage" },
        content_type: "video",
        settings: { autoplay: true, loop: true, mute: false },
      },
      {
        zone_name: "pip_video",
        position: { x: 70, y: 70, width: 25, height: 25, unit: "percentage" },
        content_type: "video",
        settings: { autoplay: true, loop: true, mute: true },
      },
    ],
  },
};

// Get all layouts for tenant
router.get("/", authMiddleware, async (req, res) => {
  try {
    const layouts = await Layout.findAll({
      where: { tenant_id: req.user.tenant_id },
      include: [
        {
          model: LayoutZone,
          as: "zones",
          include: [
            { model: Content, as: "content" },
            {
              model: Playlist,
              as: "playlist",
              include: [
                {
                  model: PlaylistItem,
                  as: "items",
                  include: [{ model: Content, as: "content" }],
                },
              ],
            },
          ],
        },
        { model: User, attributes: ["id", "email", "name"] },
      ],
      order: [
        ["created_at", "DESC"],
        [
          { model: LayoutZone, as: "zones" },
          { model: Playlist, as: "playlist" },
          { model: PlaylistItem, as: "items" },
          "order",
          "ASC",
        ],
      ],
    });

    // Include displays from configuration in response for each layout
    const layoutsData = layouts.map((layout) => {
      const layoutData = layout.toJSON();
      if (layoutData.configuration && layoutData.configuration.displays) {
        layoutData.displays = layoutData.configuration.displays;
      }
      return layoutData;
    });

    res.json(layoutsData);
  } catch (error) {
    logger.logError(error, req, {
      action: "fetch_layouts",
      tenantId: req.user.tenant_id,
    });
    res.status(500).json({ error: "Failed to fetch layouts" });
  }
});

// Get layout templates
router.get("/templates", authMiddleware, async (req, res) => {
  try {
    res.json(LAYOUT_TEMPLATES);
  } catch (error) {
    logger.logError(error, req, { action: "fetch_layout_templates" });
    res.status(500).json({ error: "Failed to fetch layout templates" });
  }
});

// Get specific layout
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const layout = await Layout.findOne({
      where: {
        id: req.params.id,
        tenant_id: req.user.tenant_id,
      },
      include: [
        {
          model: LayoutZone,
          as: "zones",
          include: [
            { model: Content, as: "content" },
            {
              model: Playlist,
              as: "playlist",
              include: [
                {
                  model: PlaylistItem,
                  as: "items",
                  include: [{ model: Content, as: "content" }],
                },
              ],
            },
          ],
        },
      ],
      order: [
        [
          { model: LayoutZone, as: "zones" },
          { model: Playlist, as: "playlist" },
          { model: PlaylistItem, as: "items" },
          "order",
          "ASC",
        ],
      ],
    });

    if (!layout) {
      return res.status(404).json({ error: "Layout not found" });
    }

    // Include displays from configuration in response
    const layoutData = layout.toJSON();
    if (layoutData.configuration && layoutData.configuration.displays) {
      layoutData.displays = layoutData.configuration.displays;
    }

    res.json(layoutData);
  } catch (error) {
    logger.logError(error, req, {
      action: "fetch_layout",
      layoutId: req.params.id,
      tenantId: req.user.tenant_id,
    });
    res.status(500).json({ error: "Failed to fetch layout" });
  }
});

// Create layout from template
router.post("/from-template", authMiddleware, async (req, res) => {
  try {
    const { templateType, name, description } = req.body;

    if (!LAYOUT_TEMPLATES[templateType]) {
      return res.status(400).json({ error: "Invalid template type" });
    }

    const template = LAYOUT_TEMPLATES[templateType];

    // Create layout
    const layout = await Layout.create({
      tenant_id: req.user.tenant_id,
      name: name || template.name,
      description: description || template.description,
      type: templateType,
      configuration: template,
      created_by: req.user.id,
    });

    // Create zones
    for (const zoneTemplate of template.zones) {
      await LayoutZone.create({
        layout_id: layout.id,
        zone_name: zoneTemplate.zone_name,
        position: zoneTemplate.position,
        content_type: zoneTemplate.content_type,
        settings: zoneTemplate.settings,
        z_index: 1,
        is_visible: true,
      });
    }

    // Fetch created layout with zones
    const createdLayout = await Layout.findByPk(layout.id, {
      include: [
        {
          model: LayoutZone,
          as: "zones",
          include: [
            { model: Content, as: "content" },
            {
              model: Playlist,
              as: "playlist",
              include: [
                {
                  model: PlaylistItem,
                  as: "items",
                  include: [{ model: Content, as: "content" }],
                },
              ],
            },
          ],
        },
      ],
    });

    // Include displays from configuration in response
    const createdLayoutData = createdLayout.toJSON();
    if (
      createdLayoutData.configuration &&
      createdLayoutData.configuration.displays
    ) {
      createdLayoutData.displays = createdLayoutData.configuration.displays;
    }

    res.status(201).json(createdLayoutData);
  } catch (error) {
    logger.logError(error, req, {
      action: "create_layout_from_template",
      tenantId: req.user.tenant_id,
    });
    res.status(500).json({ error: "Failed to create layout" });
  }
});

// Create custom layout
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, description, type, zones, displays } = req.body;

    // Create layout
    const layout = await Layout.create({
      tenant_id: req.user.tenant_id,
      name,
      description,
      type: type || "custom",
      configuration: { zones, displays: displays || [] },
      created_by: req.user.id,
    });

    // Create zones if provided
    if (zones && zones.length > 0) {
      for (const zone of zones) {
        await LayoutZone.create({
          layout_id: layout.id,
          zone_name: zone.zone_name,
          position: zone.position,
          content_type: zone.content_type,
          content_id: zone.content_id || null,
          playlist_id: zone.playlist_id || null,
          settings: zone.settings || {},
          z_index: zone.z_index || 1,
          is_visible: zone.is_visible !== false,
          display_id: zone.display_id || 1, // Support multi-display
        });
      }
    }

    // Fetch created layout with zones
    const createdLayout = await Layout.findByPk(layout.id, {
      include: [
        {
          model: LayoutZone,
          as: "zones",
          include: [
            { model: Content, as: "content" },
            {
              model: Playlist,
              as: "playlist",
              include: [
                {
                  model: PlaylistItem,
                  as: "items",
                  include: [{ model: Content, as: "content" }],
                },
              ],
            },
          ],
        },
      ],
    });

    // Include displays from configuration in response
    const createdLayoutData = createdLayout.toJSON();
    if (
      createdLayoutData.configuration &&
      createdLayoutData.configuration.displays
    ) {
      createdLayoutData.displays = createdLayoutData.configuration.displays;
    }

    res.status(201).json(createdLayoutData);
  } catch (error) {
    logger.logError(error, req, {
      action: "create_layout",
      tenantId: req.user.tenant_id,
    });
    res.status(500).json({ error: "Failed to create layout" });
  }
});

// Update layout
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { name, description, zones, displays } = req.body;

    const layout = await Layout.findOne({
      where: {
        id: req.params.id,
        tenant_id: req.user.tenant_id,
      },
    });

    if (!layout) {
      return res.status(404).json({ error: "Layout not found" });
    }

    // Update layout
    await layout.update({
      name: name || layout.name,
      description: description || layout.description,
      configuration: { zones, displays: displays || [] },
    });

    // Update zones if provided
    if (zones) {
      // Delete existing zones
      await LayoutZone.destroy({
        where: { layout_id: layout.id },
      });

      // Create new zones
      for (const zone of zones) {
        await LayoutZone.create({
          layout_id: layout.id,
          zone_name: zone.zone_name,
          position: zone.position,
          content_type: zone.content_type,
          content_id: zone.content_id || null,
          playlist_id: zone.playlist_id || null,
          settings: zone.settings || {},
          z_index: zone.z_index || 1,
          is_visible: zone.is_visible !== false,
          display_id: zone.display_id || 1, // Support multi-display
        });
      }
    }

    // Fetch updated layout
    const updatedLayout = await Layout.findByPk(layout.id, {
      include: [
        {
          model: LayoutZone,
          as: "zones",
          include: [
            { model: Content, as: "content" },
            {
              model: Playlist,
              as: "playlist",
              include: [
                {
                  model: PlaylistItem,
                  as: "items",
                  include: [{ model: Content, as: "content" }],
                },
              ],
            },
          ],
        },
      ],
    });

    // Include displays from configuration in response
    const updatedLayoutData = updatedLayout.toJSON();
    if (
      updatedLayoutData.configuration &&
      updatedLayoutData.configuration.displays
    ) {
      updatedLayoutData.displays = updatedLayoutData.configuration.displays;
    }

    res.json(updatedLayoutData);
  } catch (error) {
    logger.logError(error, req, {
      action: "update_layout",
      layoutId: req.params.id,
      tenantId: req.user.tenant_id,
    });
    res.status(500).json({ error: "Failed to update layout" });
  }
});

// Delete layout
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const layout = await Layout.findOne({
      where: {
        id: req.params.id,
        tenant_id: req.user.tenant_id,
      },
    });

    if (!layout) {
      return res.status(404).json({ error: "Layout not found" });
    }

    // Delete zones first (cascade should handle this, but being explicit)
    await LayoutZone.destroy({
      where: { layout_id: layout.id },
    });

    // Delete layout
    await layout.destroy();

    res.json({ message: "Layout deleted successfully" });
  } catch (error) {
    logger.logError(error, req, {
      action: "delete_layout",
      layoutId: req.params.id,
      tenantId: req.user.tenant_id,
    });
    res.status(500).json({ error: "Failed to delete layout" });
  }
});

// Assign content to zone
router.post(
  "/:layoutId/zones/:zoneId/content",
  authMiddleware,
  async (req, res) => {
    try {
      const { contentId, playlistId } = req.body;
      const { layoutId, zoneId } = req.params;

      // Verify layout belongs to tenant
      const layout = await Layout.findOne({
        where: {
          id: layoutId,
          tenant_id: req.user.tenant_id,
        },
      });

      if (!layout) {
        return res.status(404).json({ error: "Layout not found" });
      }

      // Find zone
      const zone = await LayoutZone.findOne({
        where: {
          id: zoneId,
          layout_id: layoutId,
        },
      });

      if (!zone) {
        return res.status(404).json({ error: "Zone not found" });
      }

      // Update zone with content
      await zone.update({
        content_id: contentId || null,
        playlist_id: playlistId || null,
      });

      // Return updated zone
      const updatedZone = await LayoutZone.findByPk(zoneId, {
        include: [
          { model: Content, as: "content" },
          { model: Playlist, as: "playlist" },
        ],
      });

      res.json(updatedZone);
    } catch (error) {
      logger.logError(error, req, {
        action: "assign_content_to_zone",
        layoutId: req.params.layoutId,
        zoneId: req.params.zoneId,
        tenantId: req.user.tenant_id,
      });
      res.status(500).json({ error: "Failed to assign content" });
    }
  }
);

module.exports = router;
