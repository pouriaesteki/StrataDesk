const express = require('express');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const { auth, restrictTo } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// File upload setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// GET /visitor/permits - Parking Report with filters
router.get('/permits', auth, async (req, res) => {
  try {
    const { startDate, endDate, unit, plate } = req.query;
    const where = {
      isExpired: false,
    };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    if (unit) {
      where.unit = { contains: unit, mode: 'insensitive' };
    }
    if (plate) {
      where.plateNumber = { contains: plate, mode: 'insensitive' };
    }
    const permits = await prisma.visitorParkingRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ permits });
  } catch (error) {
    console.error('Error fetching permits:', error);
    res.status(500).json({ error: 'Failed to fetch permits' });
  }
});

// POST /visitor/inspection - Patrol & Inspection
router.post('/inspection', auth, upload.single('photo'), async (req, res) => {
  // TODO: Implement inspection logic, violation check, and photo upload
  res.json({ message: 'Inspection endpoint (to be implemented)' });
});

// POST /visitor/violation/:id/letter - Generate violation letter PDF
router.post('/violation/:id/letter', auth, async (req, res) => {
  // TODO: Implement violation letter generation and save
  res.json({ message: 'Violation letter generation endpoint (to be implemented)' });
});

// GET /visitor/violation/:id/letter - Download violation letter PDF
router.get('/violation/:id/letter', auth, async (req, res) => {
  // TODO: Implement violation letter download
  res.json({ message: 'Violation letter download endpoint (to be implemented)' });
});

// GET /visitor/violations - Violation Report with filters
router.get('/violations', auth, async (req, res) => {
  // TODO: Implement violation report with filters
  res.json({ message: 'Violation Report endpoint (to be implemented)' });
});

// GET /visitor/violations/export - Export violation report
router.get('/violations/export', auth, async (req, res) => {
  // TODO: Implement export as PDF/CSV
  res.json({ message: 'Violation Report export endpoint (to be implemented)' });
});

module.exports = router; 