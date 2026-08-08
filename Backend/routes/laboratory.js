const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getLabTests,
    getLabTest,
    createLabTest,
    updateLabTest,
    deleteLabTest,
    collectSample,
    receiveSample,
    enterResults,
    verifyResults,
    getPendingTests,
    getTodayTests,
    getLabDashboard,
    getPatientLabResults,
    generateLabReport,
} = require('../controllers/laboratoryController');

router.route('/')
    .get(protect, getLabTests)
    .post(protect, authorize('super_admin', 'admin', 'doctor'), createLabTest);

router.get('/pending', protect, authorize('super_admin', 'admin', 'lab_technician'), getPendingTests);
router.get('/today', protect, authorize('super_admin', 'admin', 'lab_technician'), getTodayTests);
router.get('/dashboard', protect, authorize('super_admin', 'admin', 'lab_technician'), getLabDashboard);
router.get('/patient/:patientId', protect, getPatientLabResults);

router.route('/:id')
    .get(protect, getLabTest)
    .put(protect, authorize('super_admin', 'admin', 'lab_technician'), updateLabTest)
    .delete(protect, authorize('super_admin', 'admin'), deleteLabTest);

router.put('/:id/collect-sample', protect, authorize('super_admin', 'admin', 'lab_technician', 'nurse'), collectSample);
router.put('/:id/receive-sample', protect, authorize('super_admin', 'admin', 'lab_technician'), receiveSample);
router.put('/:id/enter-results', protect, authorize('super_admin', 'admin', 'lab_technician'), enterResults);
router.put('/:id/verify-results', protect, authorize('super_admin', 'admin', 'lab_technician'), verifyResults);
router.get('/:id/report', protect, generateLabReport);

module.exports = router;
