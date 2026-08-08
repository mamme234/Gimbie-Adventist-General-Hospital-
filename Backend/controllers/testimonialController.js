const Testimonial = require('../models/Testimonial');

// @desc    Get all testimonials
// @route   GET /api/testimonials
// @access  Public
exports.getTestimonials = async (req, res) => {
    try {
        const testimonials = await Testimonial.find()
            .sort({ displayOrder: 1, createdAt: -1 });

        res.status(200).json({
            success: true,
            data: testimonials,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single testimonial
// @route   GET /api/testimonials/:id
// @access  Public
exports.getTestimonial = async (req, res) => {
    try {
        const testimonial = await Testimonial.findById(req.params.id);
        if (!testimonial) {
            return res.status(404).json({
                success: false,
                message: 'Testimonial not found',
            });
        }
        res.status(200).json({
            success: true,
            data: testimonial,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create testimonial
// @route   POST /api/testimonials
// @access  Private
exports.createTestimonial = async (req, res) => {
    try {
        const testimonial = await Testimonial.create(req.body);
        res.status(201).json({
            success: true,
            data: testimonial,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update testimonial
// @route   PUT /api/testimonials/:id
// @access  Private (Admin)
exports.updateTestimonial = async (req, res) => {
    try {
        const testimonial = await Testimonial.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!testimonial) {
            return res.status(404).json({
                success: false,
                message: 'Testimonial not found',
            });
        }
        res.status(200).json({
            success: true,
            data: testimonial,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete testimonial
// @route   DELETE /api/testimonials/:id
// @access  Private (Admin)
exports.deleteTestimonial = async (req, res) => {
    try {
        const testimonial = await Testimonial.findById(req.params.id);
        if (!testimonial) {
            return res.status(404).json({
                success: false,
                message: 'Testimonial not found',
            });
        }
        await testimonial.deleteOne();
        res.status(200).json({
            success: true,
            message: 'Testimonial deleted successfully',
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Approve testimonial
// @route   PUT /api/testimonials/:id/approve
// @access  Private (Admin)
exports.approveTestimonial = async (req, res) => {
    try {
        const testimonial = await Testimonial.findById(req.params.id);
        if (!testimonial) {
            return res.status(404).json({
                success: false,
                message: 'Testimonial not found',
            });
        }

        testimonial.isApproved = !testimonial.isApproved;
        await testimonial.save();

        res.status(200).json({
            success: true,
            data: testimonial,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get approved testimonials
// @route   GET /api/testimonials/approved
// @access  Public
exports.getApprovedTestimonials = async (req, res) => {
    try {
        const testimonials = await Testimonial.getApproved();
        res.status(200).json({
            success: true,
            data: testimonials,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get featured testimonials
// @route   GET /api/testimonials/featured
// @access  Public
exports.getFeaturedTestimonials = async (req, res) => {
    try {
        const testimonials = await Testimonial.getFeatured();
        res.status(200).json({
            success: true,
            data: testimonials,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
