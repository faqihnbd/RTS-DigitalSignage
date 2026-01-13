const db = require("../models");
const { Layout, LayoutZone } = db;

async function createDemoLayouts() {
  try {
    // Check if we have users and tenants
    const { User, Tenant } = db;
    const firstUser = await User.findOne();
    const firstTenant = await Tenant.findOne();

    if (!firstUser || !firstTenant) {
      return;
    }

    // Layout 1: Split Screen Vertical (2 zones)
    const layout1 = await Layout.create({
      name: "Split Screen Vertical",
      type: "split_vertical",
      description: "Two vertical zones side by side",
      tenant_id: firstTenant.id,
      created_by: firstUser.id,
      configuration: {
        template: "split_vertical",
        zones: 2,
        orientation: "vertical",
      },
    });

    await LayoutZone.bulkCreate([
      {
        layout_id: layout1.id,
        zone_name: "Left Zone",
        position: { x: 0, y: 0, width: 50, height: 100 },
        content_type: "video",
        z_index: 1,
        is_visible: true,
        settings: { autoplay: true },
      },
      {
        layout_id: layout1.id,
        zone_name: "Right Zone",
        position: { x: 50, y: 0, width: 50, height: 100 },
        content_type: "image",
        z_index: 1,
        is_visible: true,
        settings: { autoplay: true },
      },
    ]);

    // Layout 2: Split Screen Horizontal (2 zones)
    const layout2 = await Layout.create({
      name: "Split Screen Horizontal",
      type: "split_horizontal",
      description: "Two horizontal zones stacked",
      tenant_id: firstTenant.id,
      created_by: firstUser.id,
      configuration: {
        template: "split_horizontal",
        zones: 2,
        orientation: "horizontal",
      },
    });

    await LayoutZone.bulkCreate([
      {
        layout_id: layout2.id,
        zone_name: "Top Zone",
        position: { x: 0, y: 0, width: 100, height: 50 },
        content_type: "video",
        z_index: 1,
        is_visible: true,
        settings: { autoplay: true },
      },
      {
        layout_id: layout2.id,
        zone_name: "Bottom Zone",
        position: { x: 0, y: 50, width: 100, height: 50 },
        content_type: "text",
        z_index: 1,
        is_visible: true,
        settings: { autoplay: true },
      },
    ]);

    // Layout 3: Multi-Zone (4 areas)
    const layout3 = await Layout.create({
      name: "Multi-Zone Layout",
      type: "multi_zone",
      description: "Four zones in grid layout",
      tenant_id: firstTenant.id,
      created_by: firstUser.id,
      configuration: {
        template: "multi_zone",
        zones: 4,
        grid: "2x2",
      },
    });

    await LayoutZone.bulkCreate([
      {
        layout_id: layout3.id,
        zone_name: "Top Left",
        position: { x: 0, y: 0, width: 50, height: 50 },
        content_type: "video",
        z_index: 1,
        is_visible: true,
        settings: { autoplay: true },
      },
      {
        layout_id: layout3.id,
        zone_name: "Top Right",
        position: { x: 50, y: 0, width: 50, height: 50 },
        content_type: "image",
        z_index: 1,
        is_visible: true,
        settings: { autoplay: true },
      },
      {
        layout_id: layout3.id,
        zone_name: "Bottom Left",
        position: { x: 0, y: 50, width: 50, height: 50 },
        content_type: "text",
        z_index: 1,
        is_visible: true,
        settings: { autoplay: true },
      },
      {
        layout_id: layout3.id,
        zone_name: "Bottom Right",
        position: { x: 50, y: 50, width: 50, height: 50 },
        content_type: "clock",
        z_index: 1,
        is_visible: true,
        settings: { autoplay: true },
      },
    ]);

    // Layout 4: L-Shape Layout
    const layout4 = await Layout.create({
      name: "L-Shape Layout",
      type: "l_shape",
      description: "L-shaped layout with main content and sidebar",
      tenant_id: firstTenant.id,
      created_by: firstUser.id,
      configuration: {
        template: "l_shape",
        zones: 3,
        shape: "L",
      },
    });

    await LayoutZone.bulkCreate([
      {
        layout_id: layout4.id,
        zone_name: "Main Content",
        position: { x: 0, y: 0, width: 70, height: 70 },
        content_type: "video",
        z_index: 1,
        is_visible: true,
        settings: { autoplay: true },
      },
      {
        layout_id: layout4.id,
        zone_name: "Side Panel",
        position: { x: 70, y: 0, width: 30, height: 100 },
        content_type: "ticker",
        z_index: 1,
        is_visible: true,
        settings: { scrollSpeed: "medium" },
      },
      {
        layout_id: layout4.id,
        zone_name: "Bottom Bar",
        position: { x: 0, y: 70, width: 70, height: 30 },
        content_type: "clock",
        z_index: 1,
        is_visible: true,
        settings: { format: "24h", showDate: true },
      },
    ]);

    // Layout 5: Carousel with Sidebar
    const layout5 = await Layout.create({
      name: "Carousel with Sidebar",
      type: "carousel",
      description: "Main carousel with information sidebar",
      tenant_id: firstTenant.id,
      created_by: firstUser.id,
      configuration: {
        template: "carousel",
        zones: 2,
        hasCarousel: true,
      },
    });

    await LayoutZone.bulkCreate([
      {
        layout_id: layout5.id,
        zone_name: "Carousel Zone",
        position: { x: 0, y: 0, width: 75, height: 100 },
        content_type: "playlist",
        z_index: 1,
        is_visible: true,
        settings: { autoplay: true, interval: 5000, transition: "slide" },
      },
      {
        layout_id: layout5.id,
        zone_name: "Info Sidebar",
        position: { x: 75, y: 0, width: 25, height: 100 },
        content_type: "weather",
        z_index: 1,
        is_visible: true,
        settings: { showForecast: true, updateInterval: 300000 },
      },
    ]);

    // Layout 6: Webpage Embed Layout
    const layout6 = await Layout.create({
      name: "Webpage Embed Layout",
      type: "webpage_embed",
      description: "Layout with embedded webpage and overlay",
      tenant_id: firstTenant.id,
      created_by: firstUser.id,
      configuration: {
        template: "webpage_embed",
        zones: 2,
        hasWebpage: true,
      },
    });

    await LayoutZone.bulkCreate([
      {
        layout_id: layout6.id,
        zone_name: "Webpage Zone",
        position: { x: 0, y: 0, width: 100, height: 85 },
        content_type: "webpage",
        z_index: 1,
        is_visible: true,
        settings: { url: "https://example.com", refreshInterval: 60000 },
      },
      {
        layout_id: layout6.id,
        zone_name: "Ticker Overlay",
        position: { x: 0, y: 85, width: 100, height: 15 },
        content_type: "ticker",
        z_index: 2,
        is_visible: true,
        settings: { scrollSpeed: "slow", background: "rgba(0,0,0,0.8)" },
      },
    ]);
  } catch (error) {
    console.error("Error creating demo layouts:", error);
  }
}

// Run if called directly
if (require.main === module) {
  createDemoLayouts()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}

module.exports = createDemoLayouts;
