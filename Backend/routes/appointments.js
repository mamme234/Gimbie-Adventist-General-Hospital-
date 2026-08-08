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
} = require('../controllers/appointmentController');

router.route('/')
    .get(protect, getAppointments)
    .post(protect, authorize('super_admin', 'admin', 'receptionist'), createAppointment);

router.get('/today', protect, getTodayAppointments);
router.get('/queue', protect, authorize('super_admin', 'admin', 'receptionist', 'nurse'), getAppointmentQueue);
router.get('/availability/:doctorId', protect, getDoctorAvailability);
router.get('/patient/:patientId', protect, getPatientAppointments);

router.route('/:id')
    .get(protect, getAppointment)
    .put(protect, authorize('super_admin', 'admin', 'doctor', 'receptionist'), updateAppointment);

router.put('/:id/cancel', protect, cancelAppointment);
router.put('/:id/reschedule', protect, rescheduleAppointment);
router.put('/:id/confirm', protect, authorize('super_admin', 'admin', 'receptionist'), confirmAppointment);
router.put('/:id/complete', protect, authorize('super_admin', 'admin', 'doctor'), completeAppointment);
router.put('/:id/queue', protect, authorize('super_admin', 'admin', 'receptionist', 'nurse'), updateQueueStatus);

module.exports = router;
