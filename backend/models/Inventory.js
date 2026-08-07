/**
 * ============================================
 * INVENTORY.JS - Inventory Model
 * ============================================
 */

const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    itemId: {
      type: String,
      unique: true,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    sku: {
      type: String,
      unique: true,
      trim: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InventoryCategory'
    },
    description: {
      type: String,
      trim: true
    },
    unit: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      default: 0
    },
    reorderLevel: {
      type: Number,
      default: 5
    },
    maxStockLevel: {
      type: Number,
      default: 100
    },
    unitPrice: {
      type: Number,
      default: 0
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InventoryLocation'
    },
    expiryDate: {
      type: Date
    },
    batchNumber: {
      type: String,
      trim: true
    },
    manufacturer: {
      type: String,
      trim: true
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier'
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Discontinued'],
      default: 'Active'
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
inventorySchema.index({ itemId: 1 });
inventorySchema.index({ sku: 1 });
inventorySchema.index({ name: 1 });
inventorySchema.index({ category: 1 });
inventorySchema.index({ location: 1 });
inventorySchema.index({ status: 1 });
inventorySchema.index({ quantity: 1 });

// Virtual for total value
inventorySchema.virtual('totalValue').get(function() {
  return this.quantity * this.unitPrice;
});

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;
