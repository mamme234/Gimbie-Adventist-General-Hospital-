const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getHospitalSettings,
    updateHospitalSettings,
    getLogo,
    updateLogo,
    getContactSettings,
    updateContactSettings,
    getWorkingHours,
    updateWorkingHours,
    getAppointmentSettings,
    updateAppointmentSettings,
    getBillingSettings,
    updateBillingSettings,
    getNotificationSettings,
    updateNotificationSettings,
    getSystemSettings,
    updateSystemSettings,
    getLanguageSettings,
    updateLanguageSettings,
    resetSettings,
} = require('../controllers/settingsController');

// Protected routes
router.use(protect);
router.use(authorize('super_admin', 'admin'));

// Hospital settings
router.get('/', getHospitalSettings);
router.put('/', updateHospitalSettings);

// Logo
router.get('/logo', getLogo);
router.post('/logo', updateLogo);

// Contact
router.get('/contact', getContactSettings);
router.put('/contact', updateContactSettings);

// Working hours
router.get('/hours', getWorkingHours);
router.put('/hours', updateWorkingHours);

// Appointment
router.get('/appointment', getAppointmentSettings);
router.put('/appointment', updateAppointmentSettings);

// Billing
router.get('/billing', getBillingSettings);
router.put('/billing', updateBillingSettings);

// Notifications
router.get('/notifications', getNotificationSettings);
router.put('/notifications', updateNotificationSettings);

// System
router.get('/system', getSystemSettings);
router.put('/system', updateSystemSettings);

// Language
router.get('/language', getLanguageSettings);
router.put('/language', updateLanguageSettings);

// Reset
router.post('/reset', resetSettings);

module.exports = router;
