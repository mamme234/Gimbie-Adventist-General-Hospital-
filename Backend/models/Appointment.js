const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    appointmentId: {
        type: String,
        unique: true,
        required: true,
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true,
    },
    department: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    time: {
        type: String,
        required: true,
    },
    duration: {
        type: Number,
        default: 30,
    },
    type: {
        type: String,
        enum: ['New Patient', 'Follow-up', 'Emergency', 'Consultation'],
        default: 'Consultation',
    },
    status: {
        type: String,
        enum: ['Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No Show'],
        default: 'Scheduled',
    },
    symptoms: [String],
    notes: String,
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Emergency'],
        default: 'Medium',
    },
    queueNumber: Number,
    reminderSent: {
        type: Boolean,
        default: false,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
