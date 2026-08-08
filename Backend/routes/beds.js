const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getBeds,
    getBed,
    createBed,
    updateBed,
    deleteBed,
    getAvailableBeds,
    getOccupiedBeds,
    getBedStats,
    assignBed,
    dischargeBed,
    getBedByWard,
    getBedByDepartment,
    getBedDashboard,
} = require('../controllers/bedController');

// Protected routes
router.use(protect);

// Bed routes
router.route('/')
    .get(authorize('super_admin', 'admin', 'nurse'), getBeds)
    .post(authorize('super_admin', 'admin'), createBed);

router.get('/available', authorize('super_admin', 'admin', 'nurse'), getAvailableBeds);
router.get('/occupied', authorize('super_admin', 'admin', 'nurse'), getOccupiedBeds);
router.get('/stats', authorize('super_admin', 'admin', 'nurse'), getBedStats);
router.get('/ward/:ward', authorize('super_admin', 'admin', 'nurse'), getBedByWard);
router.get('/department/:department', authorize('super_admin', 'admin', 'nurse'), getBedByDepartment);
router.get('/dashboard', authorize('super_admin', 'admin', 'nurse'), getBedDashboard);

router.route('/:id')
    .get(getBed)
    .put(authorize('super_admin', 'admin'), updateBed)
    .delete(authorize('super_admin', 'admin'), deleteBed);

router.put('/:id/assign', authorize('super_admin', 'admin', 'nurse'), assignBed);
router.put('/:id/discharge', authorize('super_admin', 'admin', 'nurse'), dischargeBed);

module.exports = router;
