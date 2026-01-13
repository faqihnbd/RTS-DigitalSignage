const express = require("express");
const { Schedule, Playlist, Device, Tenant } = require("../models");
const router = express.Router();

function canManageSchedule(req) {
  return (
    req.user &&
    (req.user.role === "tenant_admin" || req.user.role === "super_admin")
  );
}

// GET /schedules
router.get("/", async (req, res) => {
  if (!canManageSchedule(req))
    return res.status(403).json({ message: "Forbidden" });

  let whereClause = {};
  if (req.user.role === "tenant_admin") {
    whereClause.tenant_id = req.user.tenant_id;
  }
  // Super admin can see all schedules (no where clause restriction)

  const schedules = await Schedule.findAll({
    where: whereClause,
    include: [Playlist, Device, Tenant],
  });
  res.json(schedules);
});

// POST /schedules
router.post("/", async (req, res) => {
  if (!canManageSchedule(req))
    return res.status(403).json({ message: "Forbidden" });
  try {
    const {
      playlist_id,
      device_id,
      day_of_week,
      time_start,
      time_end,
      is_loop,
    } = req.body;
    const schedule = await Schedule.create({
      tenant_id: req.user.tenant_id,
      playlist_id,
      device_id,
      day_of_week,
      time_start,
      time_end,
      is_loop,
    });
    res.status(201).json(schedule);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /schedules/:id
router.get("/:id", async (req, res) => {
  if (!canManageSchedule(req))
    return res.status(403).json({ message: "Forbidden" });
  const schedule = await Schedule.findOne({
    where: { id: req.params.id, tenant_id: req.user.tenant_id },
    include: [Playlist, Device, Tenant],
  });
  if (!schedule) return res.status(404).json({ message: "Not found" });
  res.json(schedule);
});

// PUT /schedules/:id
router.put("/:id", async (req, res) => {
  if (!canManageSchedule(req))
    return res.status(403).json({ message: "Forbidden" });
  const schedule = await Schedule.findOne({
    where: { id: req.params.id, tenant_id: req.user.tenant_id },
  });
  if (!schedule) return res.status(404).json({ message: "Not found" });
  try {
    const {
      playlist_id,
      device_id,
      day_of_week,
      time_start,
      time_end,
      is_loop,
    } = req.body;
    if (playlist_id) schedule.playlist_id = playlist_id;
    if (device_id) schedule.device_id = device_id;
    if (day_of_week) schedule.day_of_week = day_of_week;
    if (time_start) schedule.time_start = time_start;
    if (time_end) schedule.time_end = time_end;
    if (is_loop !== undefined) schedule.is_loop = is_loop;
    await schedule.save();
    res.json(schedule);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /schedules/:id
router.delete("/:id", async (req, res) => {
  if (!canManageSchedule(req))
    return res.status(403).json({ message: "Forbidden" });
  const schedule = await Schedule.findOne({
    where: { id: req.params.id, tenant_id: req.user.tenant_id },
  });
  if (!schedule) return res.status(404).json({ message: "Not found" });
  await schedule.destroy();
  res.json({ message: "Deleted" });
});

module.exports = router;
