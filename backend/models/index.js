const Tenant = require("./Tenant");
const Package = require("./Package");
const sequelize = require("../db");
// Tenant-Package association
Tenant.belongsTo(Package, { foreignKey: "package_id" });
Package.hasMany(Tenant, { foreignKey: "package_id" });
const User = require("./User");
const Device = require("./Device");
const Content = require("./Content");
const Playlist = require("./Playlist");
const PlaylistItem = require("./PlaylistItem");
const Schedule = require("./Schedule");
const Payment = require("./Payment");
const PlayerStat = require("./PlayerStat");

// Associations
Tenant.hasMany(User, { foreignKey: "tenant_id" });
User.belongsTo(Tenant, { foreignKey: "tenant_id" });

Tenant.hasMany(Device, { foreignKey: "tenant_id" });
Device.belongsTo(Tenant, { foreignKey: "tenant_id" });

Package.hasMany(Device, { foreignKey: "package_id" });
Device.belongsTo(Package, { foreignKey: "package_id" });

Tenant.hasMany(Content, { foreignKey: "tenant_id" });
Content.belongsTo(Tenant, { foreignKey: "tenant_id" });

User.hasMany(Content, { foreignKey: "user_id" });
Content.belongsTo(User, { foreignKey: "user_id" });

Tenant.hasMany(Playlist, { foreignKey: "tenant_id" });
Playlist.belongsTo(Tenant, { foreignKey: "tenant_id" });

User.hasMany(Playlist, { foreignKey: "created_by" });
Playlist.belongsTo(User, { foreignKey: "created_by" });

Playlist.hasMany(PlaylistItem, { foreignKey: "playlist_id", as: "items" });
PlaylistItem.belongsTo(Playlist, { foreignKey: "playlist_id" });

Content.hasMany(PlaylistItem, { foreignKey: "content_id", as: "items" });
PlaylistItem.belongsTo(Content, { foreignKey: "content_id", as: "content" });

Tenant.hasMany(Schedule, { foreignKey: "tenant_id" });
Schedule.belongsTo(Tenant, { foreignKey: "tenant_id" });

Playlist.hasMany(Schedule, { foreignKey: "playlist_id", as: "schedules" });
Schedule.belongsTo(Playlist, { foreignKey: "playlist_id" });

Device.hasMany(Schedule, { foreignKey: "device_id" });
Schedule.belongsTo(Device, { foreignKey: "device_id" });

Tenant.hasMany(Payment, { foreignKey: "tenant_id" });
Payment.belongsTo(Tenant, { foreignKey: "tenant_id" });

Package.hasMany(Payment, { foreignKey: "package_id" });
Payment.belongsTo(Package, { foreignKey: "package_id" });

Tenant.hasMany(PlayerStat, { foreignKey: "tenant_id" });
PlayerStat.belongsTo(Tenant, { foreignKey: "tenant_id" });

Content.hasMany(PlayerStat, { foreignKey: "content_id" });
PlayerStat.belongsTo(Content, { foreignKey: "content_id" });

// DevicePlaylist association
const DevicePlaylist = require("./DevicePlaylist");
Device.hasMany(DevicePlaylist, { foreignKey: "device_id" });
DevicePlaylist.belongsTo(Device, { foreignKey: "device_id" });
Playlist.hasMany(DevicePlaylist, { foreignKey: "playlist_id" });
DevicePlaylist.belongsTo(Playlist, { foreignKey: "playlist_id" });

// Layout associations
const Layout = require("./Layout");
const LayoutZone = require("./LayoutZone");

Tenant.hasMany(Layout, { foreignKey: "tenant_id" });
Layout.belongsTo(Tenant, { foreignKey: "tenant_id" });

User.hasMany(Layout, { foreignKey: "created_by" });
Layout.belongsTo(User, { foreignKey: "created_by" });

Layout.hasMany(LayoutZone, { foreignKey: "layout_id", as: "zones" });
LayoutZone.belongsTo(Layout, { foreignKey: "layout_id" });

Content.hasMany(LayoutZone, { foreignKey: "content_id" });
LayoutZone.belongsTo(Content, { foreignKey: "content_id", as: "content" });

Playlist.hasMany(LayoutZone, { foreignKey: "playlist_id" });
LayoutZone.belongsTo(Playlist, { foreignKey: "playlist_id", as: "playlist" });

// Add layout to playlist items for layout-based playlists
Playlist.belongsTo(Layout, { foreignKey: "layout_id", as: "layout" });
Layout.hasMany(Playlist, { foreignKey: "layout_id" });

module.exports = {
  Tenant,
  Package,
  User,
  Device,
  Content,
  Playlist,
  PlaylistItem,
  Schedule,
  Payment,
  PlayerStat,
  DevicePlaylist,
  Layout,
  LayoutZone,
  sequelize,
};
