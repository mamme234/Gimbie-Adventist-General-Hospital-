const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getAssignedPatients,
    getPatientVitals,
    updateVitals,
    getNursingNotes,
    createNursingNote,
    getWardPatients,
    assignBed,
    dischargePatient,
    getShiftSchedule,
    updateShiftSchedule,
    getNurseDashboard,
} = require('../controllers/nursingController');

// Protected routes - Nurses only
router.use(protect);
router.use(authorize('super_admin', 'admin', 'nurse'));

// Dashboard
router.get('/dashboard', getNurseDashboard);

// Assigned patients
router.get('/assigned-patients', getAssignedPatients);

// Vitals
router.get('/vitals/:patientId', getPatientVitals);
router.post('/vitals/:patientId', updateVitals);

// Nursing notes
router.get('/notes/:patientId', getNursingNotes);
router.post('/notes/:patientId', createNursingNote);

// Ward management
router.get('/ward/:wardId', getWardPatients);
router.put('/assign-bed/:patientId', assignBed);
router.put('/discharge/:patientId', dischargePatient);

// Shift management
router.get('/shift', getShiftSchedule);
router.put('/shift', updateShiftSchedule);

module.exports = router;
