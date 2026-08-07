/**
 * ============================================
 * ADMIN.CONTROLLER.JS - Admin Controller
 * ============================================
 */

const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Nurse = require('../models/Nurse');
const Department = require('../models/Department');
const Appointment = require('../models/Appointment');
const { validationResult } = require('express-validator');
const { logger } = require('../config/logger');

/**
 * Dashboard Stats
 */
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalPatients,
      totalDoctors,
      totalNurses,
      totalDepartments,
      totalAppointments,
      todayAppointments
    ] = await Promise.all([
      User.countDocuments(),
      Patient.countDocuments(),
      Doctor.countDocuments(),
      Nurse.countDocuments(),
      Department.countDocuments(),
      Appointment.countDocuments(),
      Appointment.countDocuments({
        date: { $gte: new Date().setHours(0, 0, 0, 0) }
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalPatients,
        totalDoctors,
        totalNurses,
        totalDepartments,
        totalAppointments,
        todayAppointments
      }
    });
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard stats',
      error: error.message
    });
  }
};

/**
 * System Overview
 */
const getSystemOverview = async (req, res) => {
  try {
    const [
      activeUsers,
      inactiveUsers,
      recentAppointments,
      pendingAppointments,
      departments
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      Appointment.find().sort({ createdAt: -1 }).limit(10),
      Appointment.countDocuments({ status: 'Pending' }),
      Department.find().select('name code isActive')
    ]);

    res.status(200).json({
      success: true,
      data: {
        activeUsers,
        inactiveUsers,
        pendingAppointments,
        departments: departments.length,
        recentAppointments,
        departmentList: departments
      }
    });
  } catch (error) {
    logger.error('Get system overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system overview',
      error: error.message
    });
  }
};

/**
 * Recent Activities
 */
const getRecentActivities = async (req, res) => {
  try {
    const activities = await Appointment.find()
      .sort({ updatedAt: -1 })
      .limit(20)
      .populate('patient', 'patientId')
      .populate('doctor', 'doctorId')
      .select('status date time updatedAt');

    res.status(200).json({
      success: true,
      data: activities
    });
  } catch (error) {
    logger.error('Get recent activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent activities',
      error: error.message
    });
  }
};

/**
 * Get all users
 */
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (role) query.role = role;
    if (status !== undefined) query.isActive = status === 'active';
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password -refreshToken')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message
    });
  }
};

/**
 * Get user by ID
 */
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -refreshToken');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
      error: error.message
    });
  }
};

/**
 * Create user (Admin)
 */
const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { firstName, lastName, email, password, phone, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const user = new User({
      firstName,
      lastName,
      email,
      password,
      phone,
      role: role || 'patient',
      isActive: true
    });

    await user.save();

    // Create role-specific profile
    if (role === 'patient') {
      const patientId = `PAT-${new Date().getFullYear()}-${String(await Patient.countDocuments() + 1).padStart(4, '0')}`;
      const patient = new Patient({
        userId: user._id,
        patientId,
        dateOfBirth: new Date(),
        gender: 'Other'
      });
      await patient.save();
    } else if (role === 'doctor') {
      // Basic doctor profile
    }

    logger.info(`Admin created user: ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user
    });
  } catch (error) {
    logger.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
};

/**
 * Update user (Admin)
 */
const updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { firstName, lastName, phone, role, isActive } = req.body;

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    logger.info(`Admin updated user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};

/**
 * Delete user (Admin)
 */
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = false;
    await user.save();

    logger.info(`Admin deactivated user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

/**
 * Toggle user status
 */
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    logger.info(`Admin toggled user status: ${user.email} -> ${user.isActive}`);

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { isActive: user.isActive }
    });
  } catch (error) {
    logger.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle user status',
      error: error.message
    });
  }
};

/**
 * Reset user password (Admin)
 */
const resetUserPassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const newPassword = Math.random().toString(36).slice(-8);
    user.password = newPassword;
    user.refreshToken = null;
    await user.save();

    logger.info(`Admin reset password for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      data: { newPassword }
    });
  } catch (error) {
    logger.error('Reset user password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
};

/**
 * Get roles
 */
const getRoles = async (req, res) => {
  try {
    const roles = [
      { id: 'admin', name: 'Administrator', description: 'Full system access' },
      { id: 'doctor', name: 'Doctor', description: 'Medical staff with patient access' },
      { id: 'nurse', name: 'Nurse', description: 'Nursing staff with patient care access' },
      { id: 'patient', name: 'Patient', description: 'Patient portal access' },
      { id: 'staff', name: 'Staff', description: 'General staff access' },
      { id: 'finance', name: 'Finance', description: 'Financial and billing access' },
      { id: 'hr', name: 'HR', description: 'Human resources access' },
      { id: 'lab_technician', name: 'Lab Technician', description: 'Laboratory access' },
      { id: 'radiologist', name: 'Radiologist', description: 'Radiology access' },
      { id: 'pharmacist', name: 'Pharmacist', description: 'Pharmacy access' }
    ];

    res.status(200).json({
      success: true,
      data: roles
    });
  } catch (error) {
    logger.error('Get roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get roles',
      error: error.message
    });
  }
};

/**
 * Get role by ID
 */
const getRoleById = async (req, res) => {
  try {
    // Placeholder - would get role from database
    res.status(200).json({
      success: true,
      data: { id: req.params.id, name: 'Role Name' }
    });
  } catch (error) {
    logger.error('Get role by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get role',
      error: error.message
    });
  }
};

/**
 * Create role
 */
const createRole = async (req, res) => {
  try {
    // Placeholder - would create role in database
    res.status(201).json({
      success: true,
      message: 'Role created successfully'
    });
  } catch (error) {
    logger.error('Create role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create role',
      error: error.message
    });
  }
};

/**
 * Update role
 */
const updateRole = async (req, res) => {
  try {
    // Placeholder - would update role in database
    res.status(200).json({
      success: true,
      message: 'Role updated successfully'
    });
  } catch (error) {
    logger.error('Update role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update role',
      error: error.message
    });
  }
};

/**
 * Delete role
 */
const deleteRole = async (req, res) => {
  try {
    // Placeholder - would delete role from database
    res.status(200).json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    logger.error('Delete role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete role',
      error: error.message
    });
  }
};

/**
 * Get permissions
 */
const getPermissions = async (req, res) => {
  try {
    const permissions = [
      { id: 'users.view', name: 'View Users', module: 'Users' },
      { id: 'users.create', name: 'Create Users', module: 'Users' },
      { id: 'users.edit', name: 'Edit Users', module: 'Users' },
      { id: 'users.delete', name: 'Delete Users', module: 'Users' },
      { id: 'patients.view', name: 'View Patients', module: 'Patients' },
      { id: 'patients.edit', name: 'Edit Patients', module: 'Patients' },
      { id: 'appointments.view', name: 'View Appointments', module: 'Appointments' },
      { id: 'appointments.create', name: 'Create Appointments', module: 'Appointments' },
      { id: 'billing.view', name: 'View Billing', module: 'Billing' },
      { id: 'billing.edit', name: 'Edit Billing', module: 'Billing' },
      { id: 'reports.view', name: 'View Reports', module: 'Reports' },
      { id: 'settings.edit', name: 'Edit Settings', module: 'Settings' }
    ];

    res.status(200).json({
      success: true,
      data: permissions
    });
  } catch (error) {
    logger.error('Get permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get permissions',
      error: error.message
    });
  }
};

/**
 * Update permissions
 */
const updatePermissions = async (req, res) => {
  try {
    // Placeholder - would update permissions in database
    res.status(200).json({
      success: true,
      message: 'Permissions updated successfully'
    });
  } catch (error) {
    logger.error('Update permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update permissions',
      error: error.message
    });
  }
};

/**
 * Get system logs
 */
const getSystemLogs = async (req, res) => {
  try {
    // Placeholder - would get logs from database/file
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get system logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system logs',
      error: error.message
    });
  }
};

/**
 * Get system settings
 */
const getSystemSettings = async (req, res) => {
  try {
    // Placeholder - would get settings from database
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error('Get system settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system settings',
      error: error.message
    });
  }
};

/**
 * Update system settings
 */
const updateSystemSettings = async (req, res) => {
  try {
    // Placeholder - would update settings in database
    res.status(200).json({
      success: true,
      message: 'System settings updated successfully'
    });
  } catch (error) {
    logger.error('Update system settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update system settings',
      error: error.message
    });
  }
};

/**
 * Get system info
 */
const getSystemInfo = async (req, res) => {
  try {
    const info = {
      name: 'Adventist General Hospital',
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version
    };

    res.status(200).json({
      success: true,
      data: info
    });
  } catch (error) {
    logger.error('Get system info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system info',
      error: error.message
    });
  }
};

/**
 * Clear cache
 */
const clearCache = async (req, res) => {
  try {
    // Placeholder - would clear cache
    res.status(200).json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    logger.error('Clear cache error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message
    });
  }
};

/**
 * Create backup
 */
const createBackup = async (req, res) => {
  try {
    // Placeholder - would create backup
    res.status(200).json({
      success: true,
      message: 'Backup created successfully'
    });
  } catch (error) {
    logger.error('Create backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create backup',
      error: error.message
    });
  }
};

/**
 * Get backups
 */
const getBackups = async (req, res) => {
  try {
    // Placeholder - would get backups from storage
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get backups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get backups',
      error: error.message
    });
  }
};

/**
 * Restore backup
 */
const restoreBackup = async (req, res) => {
  try {
    // Placeholder - would restore backup
    res.status(200).json({
      success: true,
      message: 'Backup restored successfully'
    });
  } catch (error) {
    logger.error('Restore backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore backup',
      error: error.message
    });
  }
};

/**
 * Delete backup
 */
const deleteBackup = async (req, res) => {
  try {
    // Placeholder - would delete backup
    res.status(200).json({
      success: true,
      message: 'Backup deleted successfully'
    });
  } catch (error) {
    logger.error('Delete backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete backup',
      error: error.message
    });
  }
};

/**
 * Get audit logs
 */
const getAuditLogs = async (req, res) => {
  try {
    // Placeholder - would get audit logs from database
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get audit logs',
      error: error.message
    });
  }
};

/**
 * Get audit log by ID
 */
const getAuditLogById = async (req, res) => {
  try {
    // Placeholder - would get audit log from database
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error('Get audit log by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get audit log',
      error: error.message
    });
  }
};

/**
 * Get admin reports
 */
const getAdminReports = async (req, res) => {
  try {
    // Placeholder - would generate reports
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get admin reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get admin reports',
      error: error.message
    });
  }
};

/**
 * Generate report
 */
const generateReport = async (req, res) => {
  try {
    // Placeholder - would generate report
    res.status(200).json({
      success: true,
      message: 'Report generated successfully'
    });
  } catch (error) {
    logger.error('Generate report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error.message
    });
  }
};

/**
 * Run maintenance
 */
const runMaintenance = async (req, res) => {
  try {
    // Placeholder - would run maintenance tasks
    res.status(200).json({
      success: true,
      message: 'Maintenance tasks completed successfully'
    });
  } catch (error) {
    logger.error('Run maintenance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run maintenance',
      error: error.message
    });
  }
};

/**
 * Get maintenance status
 */
const getMaintenanceStatus = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        isMaintenanceMode: false,
        lastRun: new Date(),
        tasks: []
      }
    });
  } catch (error) {
    logger.error('Get maintenance status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get maintenance status',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardStats,
  getSystemOverview,
  getRecentActivities,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  resetUserPassword,
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getPermissions,
  updatePermissions,
  getSystemLogs,
  getSystemSettings,
  updateSystemSettings,
  getSystemInfo,
  clearCache,
  createBackup,
  getBackups,
  restoreBackup,
  deleteBackup,
  getAuditLogs,
  getAuditLogById,
  getAdminReports,
  generateReport,
  runMaintenance,
  getMaintenanceStatus
};
