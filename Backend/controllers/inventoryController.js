const Inventory = require('../models/Inventory');

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Private
exports.getInventoryItems = async (req, res) => {
    try {
        const { category, search, lowStock, page = 1, limit = 20 } = req.query;
        const query = {};

        if (category) query.category = category;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { itemId: { $regex: search, $options: 'i' } },
            ];
        }
        if (lowStock === 'true') {
            query.$expr = { $lte: ['$quantity', '$reorderLevel'] };
        }

        const items = await Inventory.find(query)
            .sort({ name: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Inventory.countDocuments(query);

        res.status(200).json({
            success: true,
            data: items,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get single inventory item
// @route   GET /api/inventory/:id
// @access  Private
exports.getInventoryItem = async (req, res) => {
    try {
        const item = await Inventory.findById(req.params.id);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found',
            });
        }
        res.status(200).json({
            success: true,
            data: item,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Create inventory item
// @route   POST /api/inventory
// @access  Private
exports.createInventoryItem = async (req, res) => {
    try {
        const itemData = req.body;
        itemData.itemId = `INV-${Date.now()}`;
        
        const item = await Inventory.create(itemData);
        res.status(201).json({
            success: true,
            data: item,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update inventory item
// @route   PUT /api/inventory/:id
// @access  Private
exports.updateInventoryItem = async (req, res) => {
    try {
        const item = await Inventory.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found',
            });
        }
        res.status(200).json({
            success: true,
            data: item,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Delete inventory item
// @route   DELETE /api/inventory/:id
// @access  Private
exports.deleteInventoryItem = async (req, res) => {
    try {
        const item = await Inventory.findById(req.params.id);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found',
            });
        }
        await item.deleteOne();
        res.status(200).json({
            success: true,
            message: 'Inventory item deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get low stock items
// @route   GET /api/inventory/low-stock
// @access  Private
exports.getLowStockItems = async (req, res) => {
    try {
        const items = await Inventory.getLowStock();
        res.status(200).json({
            success: true,
            data: items,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update stock
// @route   PUT /api/inventory/:id/stock
// @access  Private
exports.updateStock = async (req, res) => {
    try {
        const { quantity, notes } = req.body;
        const item = await Inventory.findById(req.params.id);
        
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found',
            });
        }

        const newQuantity = item.quantity + quantity;
        if (newQuantity < 0) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock',
            });
        }

        item.quantity = newQuantity;
        item.lastUsed = new Date();
        item.notes = notes || item.notes;

        if (item.quantity <= 0) {
            item.status = 'Out of Stock';
        } else if (item.quantity <= item.reorderLevel) {
            item.status = 'Low Stock';
        } else {
            item.status = 'Available';
        }

        await item.save();

        res.status(200).json({
            success: true,
            data: item,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Transfer stock
// @route   POST /api/inventory/transfer
// @access  Private
exports.transferStock = async (req, res) => {
    try {
        const { fromItemId, toItemId, quantity, notes } = req.body;

        const fromItem = await Inventory.findById(fromItemId);
        if (!fromItem) {
            return res.status(404).json({
                success: false,
                message: 'Source item not found',
            });
        }

        const toItem = await Inventory.findById(toItemId);
        if (!toItem) {
            return res.status(404).json({
                success: false,
                message: 'Destination item not found',
            });
        }

        // Reduce from source
        if (fromItem.quantity < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock in source',
            });
        }

        fromItem.quantity -= quantity;
        await fromItem.save();

        // Add to destination
        toItem.quantity += quantity;
        await toItem.save();

        res.status(200).json({
            success: true,
            message: 'Stock transferred successfully',
            data: {
                from: fromItem,
                to: toItem,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get inventory by category
// @route   GET /api/inventory/category/:category
// @access  Private
exports.getInventoryByCategory = async (req, res) => {
    try {
        const items = await Inventory.find({
            category: req.params.category,
        }).sort({ name: 1 });

        res.status(200).json({
            success: true,
            data: items,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get inventory dashboard
// @route   GET /api/inventory/dashboard
// @access  Private
exports.getInventoryDashboard = async (req, res) => {
    try {
        const total = await Inventory.countDocuments();
        const lowStock = await Inventory.countDocuments({
            $expr: { $lte: ['$quantity', '$reorderLevel'] },
        });
        const outOfStock = await Inventory.countDocuments({
            quantity: 0,
        });

        // Get categories summary
        const byCategory = await Inventory.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        res.status(200).json({
            success: true,
            data: {
                total,
                lowStock,
                outOfStock,
                byCategory,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get expiring items
// @route   GET /api/inventory/expiring
// @access  Private
exports.getExpiringItems = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const date = new Date();
        date.setDate(date.getDate() + Number(days));

        const items = await Inventory.find({
            expiryDate: { $lte: date, $gt: new Date() },
        }).sort({ expiryDate: 1 });

        res.status(200).json({
            success: true,
            data: items,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
