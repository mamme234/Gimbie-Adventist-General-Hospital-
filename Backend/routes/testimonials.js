const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getTestimonials,
    getTestimonial,
    createTestimonial,
    updateTestimonial,
    deleteTestimonial,
    approveTestimonial,
    getApprovedTestimonials,
    getFeaturedTestimonials,
} = require('../controllers/testimonialController');

// Public routes
router.get('/', getTestimonials);
router.get('/approved', getApprovedTestimonials);
router.get('/featured', getFeaturedTestimonials);

// Protected routes
router.post('/', protect, createTestimonial);

router.route('/:id')
    .get(getTestimonial)
    .put(protect, authorize('super_admin', 'admin'), updateTestimonial)
    .delete(protect, authorize('super_admin', 'admin'), deleteTestimonial);

router.put('/:id/approve', protect, authorize('super_admin', 'admin'), approveTestimonial);

module.exports = router;
