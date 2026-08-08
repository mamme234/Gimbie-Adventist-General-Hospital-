const mongoose = require('mongoose');

const MedicationSchema = new mongoose.Schema({
    medicationId: {
        type: String,
        unique: true,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        enum: [
            'Antibiotics',
            'Analgesics',
            'Antipyretics',
            'Antihistamines',
            'Antidepressants',
            'Antidiabetics',
            'Antihypertensives',
            'Anticoagulants',
            'Anticonvulsants',
            'Antivirals',
            'Antifungals',
            'Antiparasitics',
            'Vitamins',
            'Supplements',
            'IV Fluids',
            'Topical',
            'Other'
        ],
        required: true,
    },
    form: {
        type: String,
        enum: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Cream', 'Drops', 'Inhaler', 'IV Fluid', 'Other'],
        required: true,
    },
    strength: String,
    manufacturer: String,
    supplier: String,
    costPrice: Number,
    sellingPrice: Number,
    batchNumber: String,
    expiryDate: Date,
    stockQuantity: {
        type: Number,
        default: 0,
    },
    reorderLevel: {
        type: Number,
        default: 10,
    },
    maximumStock: Number,
    location: {
        shelf: String,
        rack: String,
        room: String,
    },
    requiresPrescription: {
        type: Boolean,
        default: true,
    },
    sideEffects: [String],
    precautions: [String],
    interactions: [String],
    storage: String,
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Medication', MedicationSchema);
