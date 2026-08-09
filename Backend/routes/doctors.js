const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getDoctors,
    getDoctor,
    createDoctor,
    updateDoctor,
    deleteDoctor,
    getDoctorAppointments,
    getDoctorPatients,
    getDoctorAvailability,
    updateAvailability,
    getDoctorStats,
    getDoctorsByDepartment,
} = require('../controllers/doctorController');

// Public routes
router.get('/', getDoctors);
router.get('/by-department/:department', getDoctorsByDepartment);

// Protected routes
router.post('/', protect, authorize('super_admin', 'admin'), createDoctor);
router.get('/stats/:id', protect, authorize('super_admin', 'admin'), getDoctorStats);

router.route('/:id')
    .get(getDoctor)
    .put(protect, authorize('super_admin', 'admin', 'doctor'), updateDoctor)
    .delete(protect, authorize('super_admin', 'admin'), deleteDoctor);

router.get('/:id/appointments', protect, getDoctorAppointments);
router.get('/:id/patients', protect, getDoctorPatients);
router.get('/:id/availability', protect, getDoctorAvailability);
router.put('/:id/availability', protect, authorize('super_admin', 'admin', 'doctor'), updateAvailability);

module.exports = router;
