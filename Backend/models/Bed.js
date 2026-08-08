const mongoose = require('mongoose');

const BedSchema = new mongoose.Schema({
    bedNumber: {
        type: String,
        required: true,
        unique: true,
    },
    ward: {
        type: String,
        required: true,
    },
    room: {
        type: String,
        required: true,
    },
    floor: {
        type: String,
        required: true,
    },
    building: {
        type: String,
        required: true,
    },
    department: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['Available', 'Occupied', 'Reserved', 'Under Maintenance', 'Cleaning'],
        default: 'Available',
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
    },
    admissionDate: Date,
    expectedDischargeDate: Date,
    assignedNurse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    notes: String,
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Bed', BedSchema);
