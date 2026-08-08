const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getDepartments,
    getDepartment,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getDepartmentStats,
    getDepartmentStaff,
    getDepartmentServices,
    updateDepartmentHead,
    getActiveDepartments,
} = require('../controllers/departmentController');

// Public routes
router.get('/', getDepartments);
router.get('/active', getActiveDepartments);

// Protected routes
router.post('/', protect, authorize('super_admin', 'admin'), createDepartment);

router.route('/:id')
    .get(getDepartment)
    .put(protect, authorize('super_admin', 'admin'), updateDepartment)
    .delete(protect, authorize('super_admin', 'admin'), deleteDepartment);

router.get('/:id/stats', protect, authorize('super_admin', 'admin'), getDepartmentStats);
router.get('/:id/staff', protect, getDepartmentStaff);
router.get('/:id/services', protect, getDepartmentServices);
router.put('/:id/head', protect, authorize('super_admin', 'admin'), updateDepartmentHead);

module.exports = router;
