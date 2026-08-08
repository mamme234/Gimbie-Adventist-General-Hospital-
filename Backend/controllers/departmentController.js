const Department = require('../models/Department');
const User = require('../models/User');
const Staff = require('../models/Staff');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Public
exports.getDepartments = async (req, res) => {
    try {
        const { isActive } = req.query;
        const query = {};
        if (isActive !== undefined) query.isActive = isActive === 'true';

        const departments = await Department.find(query)
            .populate('head', 'fullName email phone')
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            count: departments.length,
            data: departments,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single department
// @route   GET /api/departments/:id
// @access  Public
exports.getDepartment = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id)
            .populate('head', 'fullName email phone');

        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found',
            });
        }

        res.status(200).json({
            success: true,
            data: department,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create department
// @route   POST /api/departments
// @access  Private (Admin)
exports.createDepartment = async (req, res) => {
    try {
        const { name, code, description, head, location, phone, email, workingHours } = req.body;

        const existingDept = await Department.findOne({
            $or: [{ name }, { code: code.toUpperCase() }]
        });

        if (existingDept) {
            return res.status(400).json({
                success: false,
                message: 'Department with this name or code already exists',
            });
        }

        const department = await Department.create({
            name,
            code: code.toUpperCase(),
            description,
            head,
            location,
            phone,
            email,
            workingHours,
            isActive: true,
        });

        res.status(201).json({
            success: true,
            data: department,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private (Admin)
exports.updateDepartment = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found',
            });
        }

        const updatedDepartment = await Department.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('head', 'fullName email phone');

        res.status(200).json({
            success: true,
            data: updatedDepartment,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private (Admin)
exports.deleteDepartment = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found',
            });
        }

        department.isActive = false;
        await department.save();

        res.status(200).json({
            success: true,
            message: 'Department deactivated successfully',
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get department stats
// @route   GET /api/departments/:id/stats
// @access  Private
exports.getDepartmentStats = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found',
            });
        }

        const staffCount = await Staff.countDocuments({
            department: department.name,
            status: 'Active',
        });

        const Bed = require('../models/Bed');
        const bedCount = await Bed.countDocuments({
            department: department.name,
        });

        res.status(200).json({
            success: true,
            data: {
                department: department.name,
                staffCount,
                bedCount,
                services: department.services || [],
                isActive: department.isActive,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get department staff
// @route   GET /api/departments/:id/staff
// @access  Private
exports.getDepartmentStaff = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found',
            });
        }

        const staff = await Staff.find({
            department: department.name,
            status: 'Active',
        }).populate('user', 'fullName email phone profileImage');

        res.status(200).json({
            success: true,
            data: staff,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get department services
// @route   GET /api/departments/:id/services
// @access  Private
exports.getDepartmentServices = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found',
            });
        }

        res.status(200).json({
            success: true,
            data: department.services || [],
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update department head
// @route   PUT /api/departments/:id/head
// @access  Private (Admin)
exports.updateDepartmentHead = async (req, res) => {
    try {
        const { headId } = req.body;
        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found',
            });
        }

        const user = await User.findById(headId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        department.head = headId;
        await department.save();

        const updatedDepartment = await Department.findById(req.params.id)
            .populate('head', 'fullName email phone');

        res.status(200).json({
            success: true,
            data: updatedDepartment,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get active departments
// @route   GET /api/departments/active
// @access  Public
exports.getActiveDepartments = async (req, res) => {
    try {
        const departments = await Department.find({
            isActive: true,
        }).sort({ name: 1 });

        res.status(200).json({
            success: true,
            data: departments,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
