const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    getAdminDashboard,
    getDoctorDashboard,
    getNurseDashboard,
    getPatientDashboard,
    getReceptionDashboard,
    getPharmacyDashboard,
    getLabDashboard,
    getRadiologyDashboard,
    getAccountantDashboard,
    getHRDashboard,
    getInventoryDashboard,
    getProcurementDashboard,
    getSuperAdminDashboard,
} = require('../controllers/dashboardController');

// Protected routes
router.use(protect);

// Role-based dashboards
router.get('/super-admin', getSuperAdminDashboard);
router.get('/admin', getAdminDashboard);
router.get('/doctor', getDoctorDashboard);
router.get('/nurse', getNurseDashboard);
router.get('/patient', getPatientDashboard);
router.get('/reception', getReceptionDashboard);
router.get('/pharmacy', getPharmacyDashboard);
router.get('/laboratory', getLabDashboard);
router.get('/radiology', getRadiologyDashboard);
router.get('/accountant', getAccountantDashboard);
router.get('/hr', getHRDashboard);
router.get('/inventory', getInventoryDashboard);
router.get('/procurement', getProcurementDashboard);

module.exports = router;
