const express = require("express");
const { PlayerStat, Content, Device } = require("../models");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const { Op } = require("sequelize");
const router = express.Router();

function canExport(req, tenantId) {
  if (req.user.role === "super_admin") return true;
  if (req.user.role === "tenant_admin" && req.user.tenant_id === tenantId)
    return true;
  return false;
}

// GET /export/excel?tenant_id=xx&from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/excel", async (req, res) => {
  const { tenant_id, from, to } = req.query;
  if (!tenant_id || !canExport(req, parseInt(tenant_id)))
    return res.status(403).json({ message: "Forbidden" });
  const where = { tenant_id };
  if (from && to)
    where.played_at = { [Op.between]: [from + " 00:00:00", to + " 23:59:59"] };
  const stats = await PlayerStat.findAll({ where, include: [Content, Device] });
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Report");
  sheet.columns = [
    { header: "Tanggal", key: "played_at", width: 20 },
    { header: "Device", key: "device", width: 20 },
    { header: "Konten", key: "content", width: 30 },
    { header: "Durasi (detik)", key: "duration_sec", width: 15 },
  ];
  stats.forEach((s) => {
    sheet.addRow({
      played_at: s.played_at,
      device: s.Device ? s.Device.name : "",
      content: s.Content ? s.Content.filename : "",
      duration_sec: s.duration_sec,
    });
  });
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", 'attachment; filename="report.xlsx"');
  await workbook.xlsx.write(res);
  res.end();
});

// GET /export/pdf?tenant_id=xx&from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/pdf", async (req, res) => {
  const { tenant_id, from, to } = req.query;
  if (!tenant_id || !canExport(req, parseInt(tenant_id)))
    return res.status(403).json({ message: "Forbidden" });
  const where = { tenant_id };
  if (from && to)
    where.played_at = { [Op.between]: [from + " 00:00:00", to + " 23:59:59"] };
  const stats = await PlayerStat.findAll({ where, include: [Content, Device] });
  const doc = new PDFDocument({ margin: 30, size: "A4" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="report.pdf"');
  doc.pipe(res);
  doc.fontSize(16).text("Laporan Tayang Konten", { align: "center" });
  doc.moveDown();
  stats.forEach((s) => {
    doc
      .fontSize(10)
      .text(
        `Tanggal: ${s.played_at} | Device: ${
          s.Device ? s.Device.name : ""
        } | Konten: ${s.Content ? s.Content.filename : ""} | Durasi: ${
          s.duration_sec
        } detik`
      );
  });
  doc.end();
});

module.exports = router;
