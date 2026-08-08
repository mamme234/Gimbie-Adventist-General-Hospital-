const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getRadiology,
    getRadiologyExam,
    createRadiology,
    updateRadiology,
    deleteRadiology,
    getPendingRadiology,
    getTodayRadiology,
    getRadiologyDashboard,
    getPatientRadiology,
    generateRadiologyReport,
    addRadiologyImage,
    verifyRadiologyReport,
} = require('../controllers/radiologyController');

// Protected routes
router.use(protect);

// Radiology routes
router.route('/')
    .get(getRadiology)
    .post(authorize('super_admin', 'admin', 'doctor'), createRadiology);

router.get('/pending', authorize('super_admin', 'admin', 'radiologist'), getPendingRadiology);
router.get('/today', authorize('super_admin', 'admin', 'radiologist'), getTodayRadiology);
router.get('/dashboard', authorize('super_admin', 'admin', 'radiologist'), getRadiologyDashboard);
router.get('/patient/:patientId', getPatientRadiology);

router.route('/:id')
    .get(getRadiologyExam)
    .put(authorize('super_admin', 'admin', 'radiologist'), updateRadiology)
    .delete(authorize('super_admin', 'admin'), deleteRadiology);

router.post('/:id/images', authorize('super_admin', 'admin', 'radiologist'), addRadiologyImage);
router.put('/:id/verify', authorize('super_admin', 'admin', 'radiologist'), verifyRadiologyReport);
router.get('/:id/report', generateRadiologyReport);

module.exports = router;
