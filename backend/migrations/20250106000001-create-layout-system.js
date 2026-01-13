"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create layouts table
    await queryInterface.createTable("layouts", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "tenants",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      type: {
        type: Sequelize.ENUM(
          "split_vertical",
          "split_horizontal",
          "multi_zone",
          "l_shape",
          "carousel",
          "webpage_embed",
          "custom",
          "picture_in_picture"
        ),
        allowNull: false,
      },
      configuration: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
      },
      preview_url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
      },
    });

    // Create layout_zones table
    await queryInterface.createTable("layout_zones", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      layout_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "layouts",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      zone_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      position: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      content_type: {
        type: Sequelize.ENUM(
          "video",
          "image",
          "text",
          "webpage",
          "playlist",
          "ticker",
          "clock",
          "weather",
          "qr_code",
          "logo"
        ),
        allowNull: false,
      },
      content_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "contents",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      playlist_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "playlists",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      settings: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
      },
      z_index: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      is_visible: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
      },
    });

    // Add layout_id to playlists table
    await queryInterface.addColumn("playlists", "layout_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "layouts",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    // Add indexes for better performance
    await queryInterface.addIndex("layouts", ["tenant_id"]);
    await queryInterface.addIndex("layouts", ["type"]);
    await queryInterface.addIndex("layout_zones", ["layout_id"]);
    await queryInterface.addIndex("layout_zones", ["content_type"]);
    await queryInterface.addIndex("playlists", ["layout_id"]);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove layout_id from playlists
    await queryInterface.removeColumn("playlists", "layout_id");

    // Drop tables
    await queryInterface.dropTable("layout_zones");
    await queryInterface.dropTable("layouts");
  },
};
