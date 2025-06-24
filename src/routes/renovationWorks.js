const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(process.cwd(), 'uploads', 'renovation-works');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// POST /renovation-works - Create a new renovation work record
router.post('/', auth, upload.array('files', 10), async (req, res) => {
    try {
        const { 
            unitNumber, 
            startDate, 
            endDate, 
            damageDepositCheckNumber, 
            isExempted, 
            description 
        } = req.body;

        if (!unitNumber || !startDate || !endDate) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }

        // Create the renovation work record
        const renovationWork = await prisma.renovationWork.create({
            data: {
                unitNumber,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                damageDepositCheckNumber: damageDepositCheckNumber || null,
                isExempted: isExempted === 'true',
                description: description || null
            }
        });

        // Handle file uploads if any
        if (req.files && req.files.length > 0) {
            const fileRecords = req.files.map(file => ({
                renovationWorkId: renovationWork.id,
                fileName: file.originalname,
                fileUrl: `/uploads/renovation-works/${file.filename}`,
                fileType: file.mimetype
            }));

            await prisma.renovationWorkFile.createMany({
                data: fileRecords
            });
        }

        // Fetch the created record with files
        const createdRecord = await prisma.renovationWork.findUnique({
            where: { id: renovationWork.id },
            include: { files: true }
        });

        res.status(201).json(createdRecord);
    } catch (error) {
        console.error('Error creating renovation work:', error);
        res.status(500).json({ error: 'Failed to create renovation work record.' });
    }
});

// GET /renovation-works - Fetch renovation works with optional date filter
router.get('/', auth, async (req, res) => {
    try {
        const { startDate, endDate, unitNumber } = req.query;
        const where = {};

        if (startDate && endDate) {
            where.OR = [
                {
                    startDate: {
                        gte: new Date(startDate),
                        lte: new Date(endDate)
                    }
                },
                {
                    endDate: {
                        gte: new Date(startDate),
                        lte: new Date(endDate)
                    }
                },
                {
                    AND: [
                        { startDate: { lte: new Date(startDate) } },
                        { endDate: { gte: new Date(endDate) } }
                    ]
                }
            ];
        } else if (startDate) {
            where.endDate = {
                gte: new Date(startDate)
            };
        } else if (endDate) {
            where.startDate = {
                lte: new Date(endDate)
            };
        }

        if (unitNumber) {
            where.unitNumber = unitNumber;
        }

        const renovationWorks = await prisma.renovationWork.findMany({
            where,
            include: {
                files: true
            },
            orderBy: {
                startDate: 'desc'
            }
        });

        res.json(renovationWorks);
    } catch (error) {
        console.error('Error fetching renovation works:', error);
        res.status(500).json({ error: 'Failed to fetch renovation works.' });
    }
});

// GET /renovation-works/current-month - Get current month's renovation works
router.get('/current-month', auth, async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const renovationWorks = await prisma.renovationWork.findMany({
            where: {
                OR: [
                    {
                        startDate: {
                            gte: startOfMonth,
                            lte: endOfMonth
                        }
                    },
                    {
                        endDate: {
                            gte: startOfMonth,
                            lte: endOfMonth
                        }
                    },
                    {
                        AND: [
                            { startDate: { lte: startOfMonth } },
                            { endDate: { gte: endOfMonth } }
                        ]
                    }
                ]
            },
            include: {
                files: true
            },
            orderBy: {
                startDate: 'asc'
            }
        });

        res.json(renovationWorks);
    } catch (error) {
        console.error('Error fetching current month renovation works:', error);
        res.status(500).json({ error: 'Failed to fetch current month renovation works.' });
    }
});

// GET /renovation-works/:unitNumber - Get renovation works for a specific unit
router.get('/unit/:unitNumber', auth, async (req, res) => {
    try {
        const { unitNumber } = req.params;

        const renovationWorks = await prisma.renovationWork.findMany({
            where: {
                unitNumber: unitNumber
            },
            include: {
                files: true
            },
            orderBy: {
                startDate: 'desc'
            }
        });

        res.json(renovationWorks);
    } catch (error) {
        console.error('Error fetching renovation works for unit:', error);
        res.status(500).json({ error: 'Failed to fetch renovation works for unit.' });
    }
});

// PUT /renovation-works/:id - Update a renovation work record
router.put('/:id', auth, upload.array('files', 10), async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            unitNumber, 
            startDate, 
            endDate, 
            damageDepositCheckNumber, 
            isExempted, 
            description,
            status 
        } = req.body;

        const updateData = {
            unitNumber,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            damageDepositCheckNumber: damageDepositCheckNumber || null,
            isExempted: isExempted === 'true',
            description: description || null,
            status: status || 'ONGOING'
        };

        const renovationWork = await prisma.renovationWork.update({
            where: { id },
            data: updateData
        });

        // Handle new file uploads if any
        if (req.files && req.files.length > 0) {
            const fileRecords = req.files.map(file => ({
                renovationWorkId: id,
                fileName: file.originalname,
                fileUrl: `/uploads/renovation-works/${file.filename}`,
                fileType: file.mimetype
            }));

            await prisma.renovationWorkFile.createMany({
                data: fileRecords
            });
        }

        // Fetch the updated record with files
        const updatedRecord = await prisma.renovationWork.findUnique({
            where: { id },
            include: { files: true }
        });

        res.json(updatedRecord);
    } catch (error) {
        console.error('Error updating renovation work:', error);
        res.status(500).json({ error: 'Failed to update renovation work record.' });
    }
});

// DELETE /renovation-works/:id - Delete a renovation work record
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;

        // Delete associated files first
        await prisma.renovationWorkFile.deleteMany({
            where: { renovationWorkId: id }
        });

        // Delete the renovation work record
        await prisma.renovationWork.delete({
            where: { id }
        });

        res.json({ message: 'Renovation work record deleted successfully.' });
    } catch (error) {
        console.error('Error deleting renovation work:', error);
        res.status(500).json({ error: 'Failed to delete renovation work record.' });
    }
});

// DELETE /renovation-works/:id/files/:fileId - Delete a specific file
router.delete('/:id/files/:fileId', auth, async (req, res) => {
    try {
        const { id, fileId } = req.params;

        const file = await prisma.renovationWorkFile.findUnique({
            where: { id: fileId }
        });

        if (!file) {
            return res.status(404).json({ error: 'File not found.' });
        }

        // Delete the file from storage
        const filePath = path.join(process.cwd(), file.fileUrl.substring(1));
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete the file record
        await prisma.renovationWorkFile.delete({
            where: { id: fileId }
        });

        res.json({ message: 'File deleted successfully.' });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ error: 'Failed to delete file.' });
    }
});

module.exports = router; 