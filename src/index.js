require('dotenv').config();
console.log('JWT_SECRET in production:', process.env.JWT_SECRET);
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const authRoutes = require('./routes/auth');
const visitorParkingRoutes = require('./routes/visitorParking');
const visitorParkingManagementRoutes = require('./routes/visitorParkingManagement');
const settingsRoutes = require('./routes/settings');
const elevatorBookingRoutes = require('./routes/elevatorBooking');
const rentalStoragesRoutes = require('./routes/rentalStorages');
const patrolReportRoutes = require('./routes/patrolReport');

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // Logging middleware

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to StrataDesk API',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /auth/register',
        login: 'POST /auth/login',
        me: 'GET /auth/me'
      },
      visitor: {
        register: 'POST /visitor/register',
        dashboard: 'GET /visitor/dashboard'
      },
      health: 'GET /health'
    }
  });
});

// HTML Routes
app.get('/visitor', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'visitor.html'));
});

app.get('/auth/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'auth', 'login.html'));
});

app.get('/auth/forgot-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'auth', 'forgot-password.html'));
});

app.get('/auth/reset-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'auth', 'reset-password.html'));
});

app.get('/dashboard/visitor-parking', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard', 'visitor-parking.html'));
});

// API Routes
app.use('/auth', authRoutes);
app.use('/visitor-parking', visitorParkingRoutes);
app.use('/visitor-management', visitorParkingManagementRoutes);
app.use('/settings', settingsRoutes);
app.use('/elevator-booking', elevatorBookingRoutes);
app.use('/rental-storages', rentalStoragesRoutes);
app.use('/patrol-report', patrolReportRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Global error handler for unhandled exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 