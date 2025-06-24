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

        // Check if this is a renovation booking and if there's an existing renovation work record
        let renovationWorkExists = false;
        if (reason === 'RENO') {
            const existingRenovationWork = await prisma.renovationWork.findFirst({
                where: {
                    unitNumber: unitNumber,
                    status: {
                        in: ['ONGOING', 'COMPLETED']
                    }
                },
                orderBy: {
                    startDate: 'desc'
                }
            });
            renovationWorkExists = !!existingRenovationWork;
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

        // Return additional information for renovation bookings
        const response = {
            ...newBooking,
            renovationWorkExists: renovationWorkExists
        };

        res.status(201).json(response);
    } catch (error) {
        console.error('Error creating elevator booking:', error);
        res.status(500).json({ error: 'Failed to create booking.' });
    }
});

// GET /elevator-booking - Fetch bookings with optional date filter
router.get('/', auth, async (req, res) => {
    try {
        const { date, unitNumber } = req.query;
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

        if (unitNumber) {
            where.unitNumber = unitNumber;
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

// GET /elevator-booking/unit/:unitNumber - Get elevator bookings for a specific unit
router.get('/unit/:unitNumber', auth, async (req, res) => {
    try {
        const { unitNumber } = req.params;

        const bookings = await prisma.elevatorBooking.findMany({
            where: {
                unitNumber: unitNumber
            },
            orderBy: {
                bookingDate: 'desc'
            }
        });

        res.json(bookings);
    } catch (error) {
        console.error('Error fetching elevator bookings for unit:', error);
        res.status(500).json({ error: 'Failed to fetch elevator bookings for unit.' });
    }
});

module.exports = router; 