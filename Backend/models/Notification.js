const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: [
            'Appointment',
            'Reminder',
            'Lab Result',
            'Prescription',
            'Payment',
            'Admission',
            'Discharge',
            'Stock Alert',
            'System',
            'General'
        ],
        required: true,
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium',
    },
    read: {
        type: Boolean,
        default: false,
    },
    readAt: Date,
    link: String,
    sentEmail: {
        type: Boolean,
        default: false,
    },
    sentSMS: {
        type: Boolean,
        default: false,
    },
    sentPush: {
        type: Boolean,
        default: false,
    },
    expiresAt: Date,
}, {
    timestamps: true,
});

module.exports = mongoose.model('Notification', NotificationSchema);
