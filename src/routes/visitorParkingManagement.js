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
  try {
    const { plateNumber, vehicleMake, vehicleColor, stallNumber, notes } = req.body;
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const inspectorId = req.user.id;

    // Validate required fields
    if (!plateNumber || !vehicleMake || !vehicleColor || !stallNumber) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    // 1. Check for valid permit
    const now = new Date();
    const permit = await prisma.visitorParkingRequest.findFirst({
      where: {
        plateNumber: { equals: plateNumber, mode: 'insensitive' },
        isExpired: false,
        expiresAt: { gte: now }
      }
    });

    // 2. Check for previous violations
    const previousViolation = await prisma.violation.findFirst({
      where: { plateNumber: { equals: plateNumber, mode: 'insensitive' } }
    });

    let violation = null;
    if (!permit || previousViolation) {
      // 3. Create violation
      violation = await prisma.violation.create({
        data: {
          permitId: permit ? permit.id : null,
          plateNumber,
          vehicleMake,
          vehicleColor,
          stallNumber,
          photoUrl,
          violationType: !permit ? 'No Permit' : 'Previous Violation',
          notes,
          noticeIssued: false
        }
      });
    }

    // 4. Create inspection record
    const inspection = await prisma.parkingInspection.create({
      data: {
        inspectorId,
        plateNumber,
        vehicleMake,
        vehicleColor,
        stallNumber,
        photoUrl,
        notes,
        violationId: violation ? violation.id : null
      }
    });

    res.json({
      inspection,
      violation,
      permit
    });
  } catch (error) {
    console.error('Error during inspection:', error);
    res.status(500).json({ error: 'Failed to process inspection.' });
  }
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