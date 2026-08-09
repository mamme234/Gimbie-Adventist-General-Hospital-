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

// Protected routes
router.use(protect);

// Laboratory routes
router.route('/')
    .get(getLabTests)
    .post(authorize('super_admin', 'admin', 'doctor'), createLabTest);

router.get('/pending', authorize('super_admin', 'admin', 'lab_technician'), getPendingTests);
router.get('/today', authorize('super_admin', 'admin', 'lab_technician'), getTodayTests);
router.get('/dashboard', authorize('super_admin', 'admin', 'lab_technician'), getLabDashboard);
router.get('/patient/:patientId', getPatientLabResults);

router.route('/:id')
    .get(getLabTest)
    .put(authorize('super_admin', 'admin', 'lab_technician'), updateLabTest)
    .delete(authorize('super_admin', 'admin'), deleteLabTest);

router.put('/:id/collect-sample', authorize('super_admin', 'admin', 'lab_technician', 'nurse'), collectSample);
router.put('/:id/receive-sample', authorize('super_admin', 'admin', 'lab_technician'), receiveSample);
router.put('/:id/enter-results', authorize('super_admin', 'admin', 'lab_technician'), enterResults);
router.put('/:id/verify-results', authorize('super_admin', 'admin', 'lab_technician'), verifyResults);
router.get('/:id/report', generateLabReport);

module.exports = router;
