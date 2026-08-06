/**
 * ============================================
 * SERVER.JS - Main Application Entry Point
 * Adventist General Hospital Backend API
 * ============================================
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const patientRoutes = require('./routes/patient.routes');
const doctorRoutes = require('./routes/doctor.routes');
const nurseRoutes = require('./routes/nurse.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const departmentRoutes = require('./routes/department.routes');
const pharmacyRoutes = require('./routes/pharmacy.routes');
const laboratoryRoutes = require('./routes/laboratory.routes');
const radiologyRoutes = require('./routes/radiology.routes');
const billingRoutes = require('./routes/billing.routes');
const hrRoutes = require('./routes/hr.routes');
const adminRoutes = require('./routes/admin.routes');
const uploadRoutes = require('./routes/upload.routes');

// Import middleware
const { errorHandler, notFound } = require('./middleware/error.middleware');
const { authenticate } = require('./middleware/auth.middleware');

// Initialize Express app
const app = express();

// ============================================
// Security & Middleware
// ============================================

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));
app.use('/api', limiter);

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// Database Connection
// ============================================

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

connectDB();

// ============================================
// API Routes
// ============================================

// Public routes
app.use('/api/auth', authRoutes);
app.use('/api/uploads', uploadRoutes);

// Protected routes (require authentication)
app.use('/api/patients', authenticate, patientRoutes);
app.use('/api/doctors', authenticate, doctorRoutes);
app.use('/api/nurses', authenticate, nurseRoutes);
app.use('/api/appointments', authenticate, appointmentRoutes);
app.use('/api/departments', authenticate, departmentRoutes);
app.use('/api/pharmacy', authenticate, pharmacyRoutes);
app.use('/api/laboratory', authenticate, laboratoryRoutes);
app.use('/api/radiology', authenticate, radiologyRoutes);
app.use('/api/billing', authenticate, billingRoutes);
app.use('/api/hr', authenticate, hrRoutes);
app.use('/api/admin', authenticate, adminRoutes);

// ============================================
// Health Check Route
// ============================================

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Adventist General Hospital API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// ============================================
// Error Handling
// ============================================

app.use(notFound);
app.use(errorHandler);

// ============================================
// Start Server
// ============================================

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  server.close(() => process.exit(1));
});

module.exports = app;
