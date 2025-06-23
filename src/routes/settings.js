const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET settings
router.get('/', auth, async (req, res) => {
    try {
        let settings = await prisma.setting.findUnique({
            where: { id: 1 }
        });
        if (!settings) {
            settings = await prisma.setting.create({
                data: { id: 1 } // Defaults are set in schema
            });
        }
        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// UPDATE settings
router.put('/', auth, async (req, res) => {
    try {
        const { maxDurationHours, consecutiveDaysLimit, monthlyVisitLimit } = req.body;
        const updatedSettings = await prisma.setting.update({
            where: { id: 1 },
            data: {
                maxDurationHours: parseInt(maxDurationHours, 10),
                consecutiveDaysLimit: parseInt(consecutiveDaysLimit, 10),
                monthlyVisitLimit: parseInt(monthlyVisitLimit, 10)
            }
        });
        res.json(updatedSettings);
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

module.exports = router; 