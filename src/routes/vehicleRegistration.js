console.log('Vehicle Registration routes loaded');
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Register vehicles (multiple at once)
router.post('/', async (req, res) => {
  try {
    const { vehicles, unitNumber, residentType, noVehicle } = req.body;
    if (!unitNumber) {
      return res.status(400).json({ error: 'Unit number is required.' });
    }
    if (noVehicle) {
      // Optionally, mark unit as no vehicle (could be a separate table/flag)
      return res.json({ message: 'No vehicle registered for this unit.' });
    }
    if (!Array.isArray(vehicles) || vehicles.length === 0) {
      return res.status(400).json({ error: 'At least one vehicle is required unless noVehicle is set.' });
    }
    // Remove previous vehicles for this unit (optional, or allow multiple per unit)
    await prisma.registeredVehicle.deleteMany({ where: { unitNumber } });
    // Create new vehicles
    const created = await prisma.registeredVehicle.createMany({
      data: vehicles.map(v => ({
        ...v,
        unitNumber,
        residentType
      }))
    });
    res.json({ message: 'Vehicles registered successfully.', count: created.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all unit numbers with registered vehicles
router.get('/units', async (req, res) => {
  try {
    const units = await prisma.registeredVehicle.findMany({
      select: { unitNumber: true },
      distinct: ['unitNumber']
    });
    res.json(units.map(u => u.unitNumber));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all vehicles for a specific unit
router.get('/unit/:unitNumber', async (req, res) => {
  try {
    const { unitNumber } = req.params;
    const vehicles = await prisma.registeredVehicle.findMany({
      where: { unitNumber },
      orderBy: { createdAt: 'desc' }
    });
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 