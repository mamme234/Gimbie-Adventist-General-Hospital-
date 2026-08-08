const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    specialty: {
        type: String,
        required: true,
    },
    licenseNumber: {
        type: String,
        required: true,
        unique: true,
    },
    qualifications: [{
        degree: String,
        institution: String,
        year: Number,
    }],
    experience: {
        type: Number,
        default: 0,
    },
    consultationFee: {
        type: Number,
        default: 0,
    },
    availableDays: [{
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    }],
    availableTime: {
        start: String,
        end: String,
    },
    maxPatientsPerDay: {
        type: Number,
        default: 20,
    },
    department: {
        type: String,
        enum: [
            'Internal Medicine',
            'Pediatrics',
            'Surgery',
            'Obstetrics & Gynecology',
            'Emergency',
            'Family Medicine',
            'Cardiology',
            'Neurology',
            'Orthopedics',
            'Ophthalmology',
            'ENT',
            'Dermatology',
            'Psychiatry',
            'Radiology',
            'Pathology',
            'Anesthesia'
        ],
        required: true,
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
    },
    totalPatients: {
        type: Number,
        default: 0,
    },
    isAvailable: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Doctor', DoctorSchema);
