const express = require('express');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');

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

// GET /visitor-management/permits - Parking Report with filters
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
      include: {
        violations: { select: { id: true } }
      }
    });
    res.json({ permits });
  } catch (error) {
    console.error('Error fetching permits:', error);
    res.status(500).json({ error: 'Failed to fetch permits' });
  }
});

// POST /visitor-management/violation/from-permit - Create violation from expired permit
router.post('/violation/from-permit', auth, async (req, res) => {
  try {
    const { permitId } = req.body;
    const inspectorId = req.user.id;

    const permit = await prisma.visitorParkingRequest.findUnique({
      where: { id: permitId }
    });

    if (!permit) {
      return res.status(404).json({ error: 'Permit not found.' });
    }

    // Check if a violation for this permit already exists
    const existingViolation = await prisma.violation.findFirst({
      where: { permitId: permitId }
    });

    if (existingViolation) {
      return res.status(400).json({ error: 'A violation for this permit already exists.' });
    }

    // Create Violation
    const violation = await prisma.violation.create({
      data: {
        permitId: permit.id,
        plateNumber: permit.plateNumber,
        vehicleMake: permit.vehicleMake,
        violationType: 'Expired Permit',
        notes: 'Violation automatically generated from an expired permit marked as "Still There".'
      }
    });

    // Create a corresponding inspection record
    await prisma.parkingInspection.create({
      data: {
        inspectorId,
        plateNumber: permit.plateNumber,
        vehicleMake: permit.vehicleMake,
        violationId: violation.id,
        notes: 'Inspection automatically generated alongside violation for expired permit.'
      }
    });

    res.status(201).json({ success: true, violationId: violation.id });

  } catch (error) {
    console.error('Error creating violation from permit:', error);
    res.status(500).json({ error: 'Failed to create violation.' });
  }
});

// POST /visitor-management/inspection - Manual Patrol & Inspection
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

// POST /visitor-management/violation/:id/letter
router.post('/violation/:id/letter', auth, async (req, res) => {
  try {
    const violationId = req.params.id;
    const { reasons = [] } = req.body;
    const violation = await prisma.violation.findUnique({
      where: { id: violationId }
    });
    if (!violation) {
      return res.status(404).json({ error: 'Violation not found' });
    }

    // Count previous violations for this plate (excluding this one)
    const previousViolations = await prisma.violation.findMany({
      where: {
        plateNumber: violation.plateNumber,
        id: { not: violationId }
      },
      orderBy: { issuedAt: 'asc' }
    });
    let letterType = 'First Violation';
    let letterParagraph = 'This vehicle is in violation of the Visitor Parking Rules of Strata Plan LMS-2518.';
    if (previousViolations.length === 1) {
      letterType = 'Second Notice';
      letterParagraph = 'This is the second notice of violation, next time vehicle in violation of any bylaws or rules will be towed without notice at the vehicle owner\'s expense.';
    } else if (previousViolations.length >= 2) {
      letterType = 'Tow Request';
      letterParagraph = 'This vehicle is subject to immediate tow due to repeated violations.';
      // Optionally, update violationType to Tow Request
      await prisma.violation.update({ where: { id: violationId }, data: { violationType: 'Tow Request' } });
    } else {
      await prisma.violation.update({ where: { id: violationId }, data: { violationType: letterType } });
    }

    // Allow multiple letters for the same plate (one per violation)
    const existingLetter = await prisma.violationLetter.findUnique({ where: { violationId } });
    if (existingLetter) {
      return res.status(400).json({ error: 'A letter for this violation already exists.', pdfUrl: existingLetter.pdfUrl });
    }

    // Prepare data for the letter
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();

    // Generate PDF
    console.log('Starting PDF generation for violation', violationId);
    const doc = new PDFDocument();
    const pdfDir = path.join(process.cwd(), 'uploads', 'letters');
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
    const pdfPath = path.join(pdfDir, `${violationId}.pdf`);
    const pdfUrl = `/uploads/letters/${violationId}.pdf`;
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    // Letter content
    doc.fontSize(16).text('PARKING VIOLATION NOTICE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text('Strata Plan LMS-2518', { align: 'center' });
    doc.moveDown();
    doc.text(`Date: ${dateStr}`);
    doc.text(`Time: ${timeStr}`);
    doc.text(`Parking Stall #: ${violation.stallNumber}`);
    doc.moveDown();
    doc.text('Vehicle Details:');
    doc.text(`• License Plate: ${violation.plateNumber}`);
    doc.text(`• Make/Model: ${violation.vehicleMake}`);
    doc.text(`• Color: ${violation.vehicleColor}`);
    doc.moveDown();
    doc.text('Violation Description:');
    reasons.forEach(r => doc.text(`[x] ${r}`));
    doc.moveDown();
    doc.text(`Notes: ${violation.notes || ''}`);
    doc.moveDown();
    doc.text(letterParagraph);
    doc.moveDown();
    doc.text('Visitor parking is strictly reserved for guests of residents on a first-come, first-served basis. The following restrictions apply:');
    doc.text('• Maximum of 12 hours per visit');
    doc.text('• No more than 2 consecutive days');
    doc.text('• No more than 7 days per month');
    doc.text('• All visitor vehicles must clearly display the name and suite number of the resident being visited');
    doc.moveDown();
    doc.text('Resident vehicles are not permitted in visitor parking stalls. Prior written approval must be obtained from the Property Manager or Council for any exception.');
    doc.moveDown();
    doc.text('Failure to comply may result in vehicle removal (towing) at the owner\'s expense and further enforcement action under strata bylaws.');
    doc.moveDown();
    doc.text('Issued by:');
    doc.text('Concierge Team');
    doc.text('For and on behalf of Strata Council LMS-2518');
    doc.end();

    let responded = false;
    stream.on('finish', async () => {
      if (responded) return;
      responded = true;
      console.log('PDF generation finished for violation', violationId);
      await prisma.violationLetter.create({
        data: {
          violationId,
          pdfUrl,
          type: letterType
        }
      });
      res.json({ pdfUrl, type: letterType });
    });
    stream.on('error', (err) => {
      if (responded) return;
      responded = true;
      console.error('PDF stream error for violation', violationId, err);
      res.status(500).json({ error: 'Failed to generate violation letter PDF.' });
    });
  } catch (error) {
    console.error('Error generating violation letter:', error);
    res.status(500).json({ error: 'Failed to generate violation letter.' });
  }
});

// GET /visitor/violation/:id/letter - Download violation letter PDF
   router.get('/violations', auth, async (req, res) => {
     try {
       const { startDate, endDate, onlyViolations } = req.query;
       const where = {};
       if (startDate || endDate) {
         where.issuedAt = {};
         if (startDate) where.issuedAt.gte = new Date(startDate);
         if (endDate) where.issuedAt.lte = new Date(endDate);
       }
       if (onlyViolations === 'true') {
         where.violationType = { not: 'WARNING' };
       }
       const violations = await prisma.violation.findMany({
         where,
         orderBy: { issuedAt: 'desc' },
         include: {
           letter: true,
         },
       });
       res.json({ violations });
     } catch (error) {
       console.error('Error fetching violations:', error);
       res.status(500).json({ error: 'Failed to fetch violations' });
     }
   });

// GET /visitor-management/violations - Violation Report with filters
router.get('/violations', auth, async (req, res) => {
  try {
    const { startDate, endDate, onlyViolations } = req.query;
    const where = {};
    if (startDate || endDate) {
      where.issuedAt = {};
      if (startDate) where.issuedAt.gte = new Date(startDate);
      if (endDate) where.issuedAt.lte = new Date(endDate);
    }
    if (onlyViolations === 'true') {
      where.violationType = { not: 'WARNING' };
    }
    const violations = await prisma.violation.findMany({
      where,
      orderBy: { issuedAt: 'desc' },
      include: {
        letter: true,
      },
    });
    res.json({ violations });
  } catch (error) {
    console.error('Error fetching violations:', error);
    res.status(500).json({ error: 'Failed to fetch violations' });
  }
});

// GET /visitor-management/violations/export - Export violation report
router.get('/violations/export', auth, async (req, res) => {
  try {
    const { format = 'csv', startDate, endDate, onlyViolations } = req.query;
    const where = {};
    if (startDate || endDate) {
      where.issuedAt = {};
      if (startDate) where.issuedAt.gte = new Date(startDate);
      if (endDate) where.issuedAt.lte = new Date(endDate);
    }
    if (onlyViolations === 'true') {
      where.violationType = { not: 'WARNING' };
    }
    const violations = await prisma.violation.findMany({
      where,
      orderBy: { issuedAt: 'desc' },
      include: { letter: true },
    });

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="violations.csv"');
      const csvStream = csv.format({ headers: true });
      csvStream.pipe(res);
      violations.forEach(v => {
        csvStream.write({
          ID: v.id,
          Plate: v.plateNumber,
          Make: v.vehicleMake,
          Color: v.vehicleColor,
          Stall: v.stallNumber,
          Type: v.violationType,
          Notes: v.notes || '',
          IssuedAt: v.issuedAt,
          NoticeIssued: v.noticeIssued,
          LetterURL: v.letter ? v.letter.pdfUrl : ''
        });
      });
      csvStream.end();
    } else if (format === 'pdf') {
      // TODO: Implement PDF export
      res.status(501).json({ error: 'PDF export not implemented yet.' });
    } else {
      res.status(400).json({ error: 'Invalid format. Use csv or pdf.' });
    }
  } catch (error) {
    console.error('Error exporting violations:', error);
    res.status(500).json({ error: 'Failed to export violations' });
  }
});

module.exports = router; 