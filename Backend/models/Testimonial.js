const mongoose = require('mongoose');

const TestimonialSchema = new mongoose.Schema({
    patientName: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
    },
    comment: {
        type: String,
        required: true,
    },
    isApproved: {
        type: Boolean,
        default: true,
    },
    displayOrder: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Testimonial', TestimonialSchema);
