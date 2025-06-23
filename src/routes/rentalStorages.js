const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');

const prisma = new PrismaClient();

// Seed initial storage units
router.post('/seed', auth, async (req, res) => {
    try {
        const count = await prisma.storageUnit.count();
        if (count === 0) {
            const units = [];
            for (let i = 1; i <= 15; i++) {
                units.push({ name: `STG${i}` });
            }
            await prisma.storageUnit.createMany({
                data: units,
            });
            return res.status(201).json({ message: 'Seeded 15 storage units.' });
        }
        res.status(200).json({ message: 'Storage units already exist.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to seed storage units.' });
    }
});

// Get all storage units
router.get('/', auth, async (req, res) => {
    try {
        const storageUnits = await prisma.storageUnit.findMany({
            orderBy: { name: 'asc' },
        });
        res.json(storageUnits);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch storage units.' });
    }
});

// Assign a storage unit
router.put('/:id/assign', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { unitNumber, startDate } = req.body;
        const updatedUnit = await prisma.storageUnit.update({
            where: { id },
            data: {
                unitNumber,
                startDate: new Date(startDate),
                status: 'RENTED',
            },
        });
        res.json(updatedUnit);
    } catch (error) {
        res.status(500).json({ error: 'Failed to assign storage unit.' });
    }
});

// Vacate a storage unit
router.put('/:id/vacate', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const updatedUnit = await prisma.storageUnit.update({
            where: { id },
            data: {
                unitNumber: null,
                startDate: null,
                status: 'VACANT',
            },
        });
        res.json(updatedUnit);
    } catch (error) {
        res.status(500).json({ error: 'Failed to vacate storage unit.' });
    }
});

// --- Waitlist Routes ---

// Get waitlist
router.get('/waitlist', auth, async (req, res) => {
    try {
        const waitlist = await prisma.storageWaitlistEntry.findMany({
            orderBy: { requestDate: 'asc' },
        });
        res.json(waitlist);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch waitlist.' });
    }
});

// Add to waitlist
router.post('/waitlist', auth, async (req, res) => {
    try {
        const { unitNumber } = req.body;
        const newEntry = await prisma.storageWaitlistEntry.create({
            data: { unitNumber },
        });
        res.status(201).json(newEntry);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add to waitlist.' });
    }
});

// Remove from waitlist
router.delete('/waitlist/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.storageWaitlistEntry.delete({
            where: { id },
        });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove from waitlist.' });
    }
});

module.exports = router; 