const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        unique: true,
        required: true,
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
    },
    patientName: String,
    items: [{
        description: String,
        category: {
            type: String,
            enum: ['Consultation', 'Laboratory', 'Radiology', 'Pharmacy', 'Procedure', 'Admission', 'Surgery', 'Other'],
        },
        quantity: Number,
        unitPrice: Number,
        total: Number,
    }],
    subtotal: {
        type: Number,
        required: true,
    },
    discount: {
        type: Number,
        default: 0,
    },
    tax: {
        type: Number,
        default: 0,
    },
    total: {
        type: Number,
        required: true,
    },
    paidAmount: {
        type: Number,
        default: 0,
    },
    balance: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['Draft', 'Pending', 'Paid', 'Partially Paid', 'Overdue', 'Cancelled'],
        default: 'Pending',
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Card', 'Bank Transfer', 'Telebirr', 'Insurance', 'Other'],
    },
    paymentDate: Date,
    insuranceClaim: {
        submitted: {
            type: Boolean,
            default: false,
        },
        claimNumber: String,
        status: String,
        amount: Number,
    },
    issuedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    notes: String,
}, {
    timestamps: true,
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
