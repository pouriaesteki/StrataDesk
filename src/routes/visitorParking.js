const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');

const prisma = new PrismaClient();

// Public route for visitor parking registration
router.post('/register', async (req, res) => {
  try {
    const { vehicleMake, plateNumber, unit, durationInHours } = req.body;

    // Calculate expiresAt
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + durationInHours);

    // Create parking request
    const parkingRequest = await prisma.visitorParkingRequest.create({
      data: {
        vehicleMake,
        plateNumber,
        unit,
        durationInHours,
        expiresAt,
        violationStatus: 'NONE',
        isExpired: false
      }
    });

    res.status(201).json({
      message: 'Parking request registered successfully',
      request: parkingRequest
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Protected route for users to view parking requests
router.get('/dashboard', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Base query for active requests
    const baseQuery = {
      createdAt: {
        gte: today,
        lt: tomorrow
      }
    };

    // Fetch settings
    let settings = await prisma.setting.findUnique({ where: { id: 1 } });
    if (!settings) {
      settings = { maxDurationHours: 12, consecutiveDaysLimit: 2, monthlyVisitLimit: 7 };
    }

    // Get all active requests
    const activeRequests = await prisma.visitorParkingRequest.findMany({
      where: baseQuery,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Process requests to add violation status
    const processedRequests = await Promise.all(activeRequests.map(async (request) => {
      // Check for violations
      let violationStatus = 'NONE';
      
      // Check duration violation
      if (request.durationInHours > settings.maxDurationHours) {
        violationStatus = 'VIOLATION';
      }

      // Check consecutive days violation
      const previousDay = new Date(today);
      previousDay.setDate(previousDay.getDate() - (settings.consecutiveDaysLimit - 1));
      
      const consecutiveRequests = await prisma.visitorParkingRequest.count({
        where: {
          unit: request.unit,
          createdAt: {
            gte: previousDay,
            lt: tomorrow
          }
        }
      });

      if (consecutiveRequests >= settings.consecutiveDaysLimit) {
        violationStatus = 'VIOLATION';
      }

      // Check monthly limit violation
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const monthlyRequests = await prisma.visitorParkingRequest.count({
        where: {
          unit: request.unit,
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      });

      if (monthlyRequests > settings.monthlyVisitLimit) {
        violationStatus = 'VIOLATION';
      }

      // Update violation status if changed
      if (violationStatus !== request.violationStatus) {
        await prisma.visitorParkingRequest.update({
          where: { id: request.id },
          data: { violationStatus }
        });
      }

      return {
        ...request,
        violationStatus,
        isExpired: new Date() > request.expiresAt
      };
    }));

    res.json({
      requests: processedRequests
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 