const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const prisma = new PrismaClient();

// File upload setup for patrol photos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/patrols/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// POST /patrol-report - Create a new patrol log entry
router.post('/', auth, upload.single('photo'), async (req, res) => {
    try {
        const { reportedAt, notes, isNothingToReport } = req.body;
        const reporterId = req.user.id;

        let data = {
            reporterId,
            reportedAt: new Date(reportedAt),
            isNothingToReport: isNothingToReport === 'true',
            notes: notes || ''
        };

        if (data.isNothingToReport) {
            data.notes = 'Nothing to report.';
        } else if (!notes) {
            return res.status(400).json({ error: 'Notes are required for a report with issues.' });
        }
        
        if (req.file) {
            data.photoUrl = `/uploads/patrols/${req.file.filename}`;
        }

        const newLog = await prisma.patrolLog.create({ data });
        res.status(201).json(newLog);
    } catch (error) {
        console.error('Error creating patrol log:', error);
        res.status(500).json({ error: 'Failed to create patrol log.' });
    }
});

// GET /patrol-report - Fetch patrol logs
router.get('/', auth, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let where = {};
        if (startDate && endDate) {
            where.reportedAt = {
                gte: new Date(startDate),
                lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
            };
        }

        const logs = await prisma.patrolLog.findMany({
            where,
            include: {
                reporter: {
                    select: { firstName: true, lastName: true }
                }
            },
            orderBy: { reportedAt: 'desc' }
        });
        res.json(logs);
    } catch (error) {
        console.error('Error fetching patrol logs:', error);
        res.status(500).json({ error: 'Failed to fetch patrol logs.' });
    }
});

module.exports = router; 