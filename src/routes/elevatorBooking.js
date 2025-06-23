const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');

const prisma = new PrismaClient();

// POST /elevator-booking - Create a new booking
router.post('/', auth, async (req, res) => {
    try {
        const { unitNumber, bookingDate, duration, reason, notes } = req.body;

        if (!unitNumber || !bookingDate || !duration || !reason) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }

        const newBooking = await prisma.elevatorBooking.create({
            data: {
                unitNumber,
                bookingDate: new Date(bookingDate),
                duration,
                reason,
                notes
            }
        });

        res.status(201).json(newBooking);
    } catch (error) {
        console.error('Error creating elevator booking:', error);
        res.status(500).json({ error: 'Failed to create booking.' });
    }
});

// GET /elevator-booking - Fetch bookings with optional date filter
router.get('/', auth, async (req, res) => {
    try {
        const { date } = req.query;
        const where = {};

        if (date) {
            const startDate = new Date(date);
            startDate.setUTCHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setUTCHours(23, 59, 59, 999);
            where.bookingDate = {
                gte: startDate,
                lte: endDate
            };
        }

        const bookings = await prisma.elevatorBooking.findMany({
            where,
            orderBy: {
                bookingDate: 'desc'
            }
        });

        res.json(bookings);
    } catch (error) {
        console.error('Error fetching elevator bookings:', error);
        res.status(500).json({ error: 'Failed to fetch bookings.' });
    }
});

module.exports = router; 