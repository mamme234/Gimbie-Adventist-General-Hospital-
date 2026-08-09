const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getAppointments,
    getAppointment,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    rescheduleAppointment,
    confirmAppointment,
    completeAppointment,
    getDoctorAvailability,
    getTodayAppointments,
    getAppointmentQueue,
    updateQueueStatus,
    getPatientAppointments,
    bookAppointment,
} = require('../controllers/appointmentController');

// ===== PUBLIC ROUTES =====
router.post('/book', bookAppointment);

// ===== PROTECTED ROUTES =====
router.use(protect);

router.route('/')
    .get(getAppointments)
    .post(authorize('super_admin', 'admin', 'receptionist', 'patient'), createAppointment);

router.get('/today', getTodayAppointments);
router.get('/queue', authorize('super_admin', 'admin', 'receptionist', 'nurse'), getAppointmentQueue);
router.get('/availability/:doctorId', getDoctorAvailability);
router.get('/patient/:patientId', getPatientAppointments);

router.route('/:id')
    .get(getAppointment)
    .put(authorize('super_admin', 'admin', 'doctor', 'receptionist'), updateAppointment);

router.put('/:id/cancel', cancelAppointment);
router.put('/:id/reschedule', rescheduleAppointment);
router.put('/:id/confirm', authorize('super_admin', 'admin', 'receptionist'), confirmAppointment);
router.put('/:id/complete', authorize('super_admin', 'admin', 'doctor'), completeAppointment);
router.put('/:id/queue', authorize('super_admin', 'admin', 'receptionist', 'nurse'), updateQueueStatus);

module.exports = router;
