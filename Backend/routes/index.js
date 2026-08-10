// routes/index.js - REMOVE THE CATCH-ALL
const express = require('express');
const router = express.Router();

// ============================================
// IMPORT ALL ROUTE FILES
// ============================================
const authRoutes = require('./auth');
const patientRoutes = require('./patients');
const doctorRoutes = require('./doctors');
const appointmentRoutes = require('./appointments');
const pharmacyRoutes = require('./pharmacy');
const laboratoryRoutes = require('./laboratory');
const radiologyRoutes = require('./radiology');
const billingRoutes = require('./billing');
const departmentRoutes = require('./departments');
const testimonialRoutes = require('./testimonials');
const notificationRoutes = require('./notifications');
const bedRoutes = require('./beds');
const staffRoutes = require('./staff');
const reportsRoutes = require('./reports');
const dashboardRoutes = require('./dashboard');
const insuranceRoutes = require('./insurance');
const inventoryRoutes = require('./inventory');
const procurementRoutes = require('./procurement');
const settingsRoutes = require('./settings');
const uploadRoutes = require('./upload');
const nursingRoutes = require('./nursing');

// ============================================
// MOUNT ROUTES
// ============================================

// Authentication routes (Public)
router.use('/auth', authRoutes);

// Patient routes
router.use('/patients', patientRoutes);

// Doctor routes
router.use('/doctors', doctorRoutes);

// Appointment routes
router.use('/appointments', appointmentRoutes);

// Pharmacy routes
router.use('/pharmacy', pharmacyRoutes);

// Laboratory routes
router.use('/laboratory', laboratoryRoutes);

// Radiology routes
router.use('/radiology', radiologyRoutes);

// Billing routes
router.use('/billing', billingRoutes);

// Department routes
router.use('/departments', departmentRoutes);

// Testimonial routes
router.use('/testimonials', testimonialRoutes);

// Notification routes
router.use('/notifications', notificationRoutes);

// Bed management routes
router.use('/beds', bedRoutes);

// Staff management routes
router.use('/staff', staffRoutes);

// Reports routes
router.use('/reports', reportsRoutes);

// Dashboard routes
router.use('/dashboard', dashboardRoutes);

// Insurance routes
router.use('/insurance', insuranceRoutes);

// Inventory routes
router.use('/inventory', inventoryRoutes);

// Procurement routes
router.use('/procurement', procurementRoutes);

// Settings routes
router.use('/settings', settingsRoutes);

// Upload routes
router.use('/upload', uploadRoutes);

// Nursing routes
router.use('/nursing', nursingRoutes);

// ============================================
// HEALTH CHECK
// ============================================
router.get('/health', (req, res) => {
    const mongoose = require('mongoose');
    res.status(200).json({
        success: true,
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development',
        hospital: 'Gimbie Adventist General Hospital',
        version: '1.0.0',
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    });
});

// ============================================
// API DOCS
// ============================================
router.get('/docs', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Gimbie Adventist General Hospital API Documentation',
        version: '1.0.0',
        baseUrl: 'https://alpha-af1q.onrender.com/api',
        authentication: {
            type: 'Bearer Token',
            header: 'Authorization: Bearer <token>',
            login: 'POST /api/auth/login',
            register: 'POST /api/auth/register',
        },
        staffCredentials: {
            admin: {
                email: 'daniel.bekele@gimbiehospital.com',
                password: 'Admin@2026#Secure$Gimbie'
            },
            doctor: {
                email: 'michael.abebe@gimbiehospital.com',
                password: 'DrMike@GP2026#Gimbie!'
            },
            nurse: {
                email: 'almaz.tesfaye@gimbiehospital.com',
                password: 'Almaz@NurseMgr2026#Gimbie'
            }
        },
        endpoints: {
            seed: {
                path: '/seed',
                description: 'Seed management (Super Admin only)',
                routes: [
                    { method: 'GET', path: '/', description: 'Check seed status' },
                    { method: 'POST', path: '/staff', description: 'Seed staff from config' },
                    { method: 'GET', path: '/status', description: 'Get seed status' },
                    { method: 'DELETE', path: '/clear?confirm=YES', description: 'Clear seed data' },
                ],
            },
            auth: {
                path: '/auth',
                description: 'Authentication endpoints',
                routes: [
                    { method: 'POST', path: '/register', description: 'Register new user' },
                    { method: 'POST', path: '/login', description: 'Login user' },
                    { method: 'GET', path: '/me', description: 'Get current user (Authenticated)' },
                    { method: 'PUT', path: '/profile', description: 'Update profile (Authenticated)' },
                    { method: 'PUT', path: '/change-password', description: 'Change password (Authenticated)' },
                    { method: 'POST', path: '/forgot-password', description: 'Forgot password' },
                    { method: 'POST', path: '/reset-password', description: 'Reset password' },
                ],
            },
            appointments: {
                path: '/appointments',
                description: 'Appointment management',
                routes: [
                    { method: 'POST', path: '/book', description: 'Book appointment (Public)' },
                    { method: 'GET', path: '/', description: 'Get all appointments (Authenticated)' },
                    { method: 'POST', path: '/', description: 'Create appointment (Authenticated)' },
                    { method: 'GET', path: '/:id', description: 'Get appointment (Authenticated)' },
                    { method: 'PUT', path: '/:id', description: 'Update appointment (Authenticated)' },
                    { method: 'PUT', path: '/:id/cancel', description: 'Cancel appointment (Authenticated)' },
                    { method: 'PUT', path: '/:id/reschedule', description: 'Reschedule appointment (Authenticated)' },
                    { method: 'GET', path: '/today', description: 'Get today\'s appointments (Authenticated)' },
                    { method: 'GET', path: '/queue', description: 'Get appointment queue (Authenticated)' },
                ],
            },
            patients: {
                path: '/patients',
                description: 'Patient management',
                routes: [
                    { method: 'GET', path: '/me', description: 'Get current patient (Authenticated)' },
                    { method: 'GET', path: '/', description: 'Get all patients (Authenticated)' },
                    { method: 'POST', path: '/', description: 'Create patient (Authenticated)' },
                    { method: 'GET', path: '/:id', description: 'Get patient (Authenticated)' },
                    { method: 'PUT', path: '/:id', description: 'Update patient (Authenticated)' },
                    { method: 'GET', path: '/:id/appointments', description: 'Get patient appointments (Authenticated)' },
                    { method: 'GET', path: '/:id/bills', description: 'Get patient bills (Authenticated)' },
                    { method: 'GET', path: '/:id/history', description: 'Get patient history (Authenticated)' },
                ],
            },
            doctors: {
                path: '/doctors',
                description: 'Doctor management',
                routes: [
                    { method: 'GET', path: '/', description: 'Get all doctors' },
                    { method: 'GET', path: '/:id', description: 'Get doctor' },
                    { method: 'GET', path: '/by-department/:department', description: 'Get doctors by department' },
                    { method: 'GET', path: '/:id/appointments', description: 'Get doctor appointments' },
                    { method: 'GET', path: '/:id/patients', description: 'Get doctor patients' },
                    { method: 'GET', path: '/:id/availability', description: 'Get doctor availability' },
                    { method: 'PUT', path: '/:id/availability', description: 'Update doctor availability' },
                ],
            },
            pharmacy: {
                path: '/pharmacy',
                description: 'Pharmacy management',
                routes: [
                    { method: 'GET', path: '/', description: 'Get all medications' },
                    { method: 'POST', path: '/', description: 'Create medication' },
                    { method: 'GET', path: '/:id', description: 'Get medication' },
                    { method: 'PUT', path: '/:id', description: 'Update medication' },
                    { method: 'DELETE', path: '/:id', description: 'Delete medication' },
                    { method: 'GET', path: '/low-stock', description: 'Get low stock medications' },
                    { method: 'GET', path: '/expiring', description: 'Get expiring medications' },
                ],
            },
            laboratory: {
                path: '/laboratory',
                description: 'Laboratory management',
                routes: [
                    { method: 'GET', path: '/', description: 'Get all lab tests' },
                    { method: 'POST', path: '/', description: 'Create lab test' },
                    { method: 'GET', path: '/:id', description: 'Get lab test' },
                    { method: 'PUT', path: '/:id', description: 'Update lab test' },
                    { method: 'GET', path: '/pending', description: 'Get pending lab tests' },
                    { method: 'GET', path: '/patient/:patientId', description: 'Get patient lab results' },
                ],
            },
            billing: {
                path: '/billing',
                description: 'Billing management',
                routes: [
                    { method: 'GET', path: '/', description: 'Get all invoices' },
                    { method: 'POST', path: '/', description: 'Create invoice' },
                    { method: 'GET', path: '/:id', description: 'Get invoice' },
                    { method: 'PUT', path: '/:id/pay', description: 'Pay invoice' },
                    { method: 'GET', path: '/patient/:patientId', description: 'Get patient invoices' },
                    { method: 'GET', path: '/outstanding', description: 'Get outstanding invoices' },
                    { method: 'GET', path: '/revenue', description: 'Get revenue statistics' },
                ],
            },
            dashboard: {
                path: '/dashboard',
                description: 'Dashboard statistics',
                routes: [
                    { method: 'GET', path: '/', description: 'Get dashboard stats' },
                    { method: 'GET', path: '/admin', description: 'Get admin dashboard stats' },
                    { method: 'GET', path: '/doctor', description: 'Get doctor dashboard stats' },
                    { method: 'GET', path: '/nurse', description: 'Get nurse dashboard stats' },
                ],
            },
            reports: {
                path: '/reports',
                description: 'Reports',
                routes: [
                    { method: 'GET', path: '/patients', description: 'Get patient reports' },
                    { method: 'GET', path: '/doctors', description: 'Get doctor reports' },
                    { method: 'GET', path: '/departments', description: 'Get department reports' },
                    { method: 'GET', path: '/admissions', description: 'Get admission reports' },
                    { method: 'GET', path: '/bed-occupancy', description: 'Get bed occupancy reports' },
                    { method: 'GET', path: '/revenue', description: 'Get revenue reports' },
                    { method: 'GET', path: '/financial', description: 'Get financial reports' },
                    { method: 'GET', path: '/medical', description: 'Get medical reports' },
                ],
            },
        },
    });
});

// ============================================
// ⭐ EXPORT ROUTER - NO CATCH-ALL HERE!
// ============================================
module.exports = router;
