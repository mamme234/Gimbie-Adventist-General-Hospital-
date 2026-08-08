const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    code: {
        type: String,
        required: true,
        unique: true,
    },
    description: String,
    head: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    staffCount: {
        type: Number,
        default: 0,
    },
    bedCount: {
        type: Number,
        default: 0,
    },
    services: [String],
    location: String,
    phone: String,
    email: String,
    workingHours: {
        start: String,
        end: String,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Department', DepartmentSchema);
