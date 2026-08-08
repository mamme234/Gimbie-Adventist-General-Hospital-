const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getStaff,
    getStaffMember,
    createStaff,
    updateStaff,
    deleteStaff,
    getStaffByDepartment,
    getStaffByPosition,
    getStaffDashboard,
    updateStaffStatus,
    getStaffAttendance,
    updateStaffAttendance,
    getStaffSchedule,
    updateStaffSchedule,
} = require('../controllers/staffController');

// Protected routes
router.use(protect);
router.use(authorize('super_admin', 'admin', 'hr_manager'));

// Staff routes
router.route('/')
    .get(getStaff)
    .post(createStaff);

router.get('/department/:department', getStaffByDepartment);
router.get('/position/:position', getStaffByPosition);
router.get('/dashboard', getStaffDashboard);
router.get('/attendance', getStaffAttendance);
router.put('/attendance', updateStaffAttendance);
router.get('/schedule', getStaffSchedule);
router.put('/schedule', updateStaffSchedule);

router.route('/:id')
    .get(getStaffMember)
    .put(updateStaff)
    .delete(deleteStaff);

router.put('/:id/status', updateStaffStatus);

module.exports = router;
