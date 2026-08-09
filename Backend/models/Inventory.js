const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
    itemId: {
        type: String,
        unique: true,
        required: true,
        // REMOVED: index: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    category: {
        type: String,
        enum: [
            'Medical Supplies',
            'Medical Equipment',
            'Consumables',
            'Instruments',
            'Surgical Supplies',
            'Wound Care',
            'Diagnostic Equipment',
            'Office Supplies',
            'Cleaning Supplies',
            'Other',
        ],
        required: true,
    },
    subCategory: String,
    description: String,
    manufacturer: String,
    supplier: String,
    quantity: {
        type: Number,
        required: true,
        min: 0,
    },
    reorderLevel: {
        type: Number,
        default: 10,
    },
    maximumStock: Number,
    unitOfMeasure: {
        type: String,
        enum: ['Units', 'Boxes', 'Packs', 'Sets', 'Bottles', 'Each', 'KG', 'Liters'],
        default: 'Units',
    },
    costPerUnit: {
        type: Number,
        default: 0,
    },
    location: {
        warehouse: String,
        shelf: String,
        rack: String,
        bin: String,
    },
    department: String,
    batchNumber: String,
    expiryDate: Date,
    lastRestocked: Date,
    lastUsed: Date,
    status: {
        type: String,
        enum: ['Available', 'Low Stock', 'Out of Stock', 'Discontinued'],
        default: 'Available',
    },
    notes: String,
}, {
    timestamps: true,
});

// ===== INDEXES - Defined once here =====
InventorySchema.index({ itemId: 1 });
InventorySchema.index({ name: 1 });
InventorySchema.index({ category: 1 });
InventorySchema.index({ status: 1 });

// Static method to get low stock items
InventorySchema.statics.getLowStock = function() {
    return this.find({
        $expr: { $lte: ['$quantity', '$reorderLevel'] },
        status: { $ne: 'Discontinued' },
    });
};

// Method to update quantity
InventorySchema.methods.updateQuantity = function(change, notes) {
    const newQuantity = this.quantity + change;
    if (newQuantity < 0) {
        throw new Error('Insufficient stock');
    }
    
    this.quantity = newQuantity;
    this.lastUsed = new Date();
    
    if (this.quantity <= 0) {
        this.status = 'Out of Stock';
    } else if (this.quantity <= this.reorderLevel) {
        this.status = 'Low Stock';
    } else {
        this.status = 'Available';
    }
    
    return this.save();
};

// Method to check stock availability
InventorySchema.methods.hasStock = function(quantity = 1) {
    return this.quantity >= quantity && this.status !== 'Discontinued';
};

module.exports = mongoose.model('Inventory', InventorySchema);
