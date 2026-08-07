/**
 * ============================================
 * HR.CONTROLLER.JS - Human Resources Controller
 * ============================================
 */

const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const JobPosting = require('../models/JobPosting');
const Application = require('../models/Application');
const PerformanceReview = require('../models/PerformanceReview');
const Payroll = require('../models/Payroll');
const Training = require('../models/Training');
const User = require('../models/User');
const Department = require('../models/Department');
const { validationResult } = require('express-validator');
const { logger } = require('../config/logger');
const { sendEmail } = require('../config/email');

/**
 * Get all employees
 */
const getEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 20, department, position, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (department) query.department = department;
    if (position) query.position = position;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    const employees = await Employee.find(query)
      .populate('userId', 'email phone')
      .populate('department', 'name code')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Employee.countDocuments(query);

    res.status(200).json({
      success: true,
      data: employees,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get employees',
      error: error.message
    });
  }
};

/**
 * Get employee by ID
 */
const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('userId', 'email phone')
      .populate('department', 'name code');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    logger.error('Get employee by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get employee',
      error: error.message
    });
  }
};

/**
 * Create employee
 */
const createEmployee = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      position,
      department,
      employmentType,
      dateOfBirth,
      gender,
      maritalStatus,
      nationality,
      address,
      emergencyContact,
      bankDetails,
      salary,
      startDate,
      notes
    } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      const tempPassword = Math.random().toString(36).slice(-8);
      user = new User({
        firstName,
        lastName,
        email,
        phone,
        password: tempPassword,
        role: 'staff'
      });
      await user.save();
    }

    const employeeId = `EMP-${new Date().getFullYear()}-${String(await Employee.countDocuments() + 1).padStart(4, '0')}`;

    const employee = new Employee({
      employeeId,
      userId: user._id,
      firstName,
      lastName,
      email,
      phone,
      position,
      department,
      employmentType: employmentType || 'Full-Time',
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      gender,
      maritalStatus,
      nationality,
      address,
      emergencyContact,
      bankDetails,
      salary: salary || 0,
      startDate: startDate ? new Date(startDate) : new Date(),
      notes,
      status: 'Active'
    });

    await employee.save();

    logger.info(`Employee created: ${employee.employeeId}`);

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee
    });
  } catch (error) {
    logger.error('Create employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create employee',
      error: error.message
    });
  }
};

/**
 * Update employee
 */
const updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const {
      position,
      department,
      employmentType,
      phone,
      address,
      emergencyContact,
      bankDetails,
      salary,
      status,
      notes
    } = req.body;

    if (position) employee.position = position;
    if (department) employee.department = department;
    if (employmentType) employee.employmentType = employmentType;
    if (phone) employee.phone = phone;
    if (address) employee.address = address;
    if (emergencyContact) employee.emergencyContact = emergencyContact;
    if (bankDetails) employee.bankDetails = bankDetails;
    if (salary) employee.salary = salary;
    if (status) employee.status = status;
    if (notes) employee.notes = notes;

    await employee.save();

    logger.info(`Employee updated: ${employee.employeeId}`);

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: employee
    });
  } catch (error) {
    logger.error('Update employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update employee',
      error: error.message
    });
  }
};

/**
 * Delete employee
 */
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    employee.status = 'Inactive';
    await employee.save();

    logger.info(`Employee deactivated: ${employee.employeeId}`);

    res.status(200).json({
      success: true,
      message: 'Employee deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate employee',
      error: error.message
    });
  }
};

/**
 * Get employees by department
 */
const getEmployeesByDepartment = async (req, res) => {
  try {
    const { department } = req.params;

    const employees = await Employee.find({
      department,
      status: 'Active'
    })
      .populate('userId', 'email phone')
      .sort({ firstName: 1, lastName: 1 });

    res.status(200).json({
      success: true,
      data: employees
    });
  } catch (error) {
    logger.error('Get employees by department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get employees by department',
      error: error.message
    });
  }
};

/**
 * Get employees by position
 */
const getEmployeesByPosition = async (req, res) => {
  try {
    const { position } = req.params;

    const employees = await Employee.find({
      position,
      status: 'Active'
    })
      .populate('userId', 'email phone')
      .sort({ firstName: 1, lastName: 1 });

    res.status(200).json({
      success: true,
      data: employees
    });
  } catch (error) {
    logger.error('Get employees by position error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get employees by position',
      error: error.message
    });
  }
};

/**
 * Get active employees
 */
const getActiveEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({
      status: 'Active'
    })
      .populate('userId', 'email phone')
      .populate('department', 'name code')
      .sort({ firstName: 1, lastName: 1 });

    res.status(200).json({
      success: true,
      data: employees
    });
  } catch (error) {
    logger.error('Get active employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active employees',
      error: error.message
    });
  }
};

/**
 * Get inactive employees
 */
const getInactiveEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({
      status: { $ne: 'Active' }
    })
      .populate('userId', 'email phone')
      .populate('department', 'name code')
      .sort({ firstName: 1, lastName: 1 });

    res.status(200).json({
      success: true,
      data: employees
    });
  } catch (error) {
    logger.error('Get inactive employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get inactive employees',
      error: error.message
    });
  }
};

/**
 * Search employees
 */
const searchEmployees = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const employees = await Employee.find({
      $or: [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { employeeId: { $regex: q, $options: 'i' } },
        { position: { $regex: q, $options: 'i' } }
      ],
      status: 'Active'
    })
      .populate('userId', 'email phone')
      .populate('department', 'name code')
      .limit(20);

    res.status(200).json({
      success: true,
      data: employees
    });
  } catch (error) {
    logger.error('Search employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search employees',
      error: error.message
    });
  }
};

/**
 * Get attendance
 */
const getAttendance = async (req, res) => {
  try {
    const { page = 1, limit = 20, employeeId, dateFrom, dateTo } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (employeeId) query.employee = employeeId;
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo);
    }

    const attendance = await Attendance.find(query)
      .populate('employee', 'firstName lastName employeeId')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ date: -1 });

    const total = await Attendance.countDocuments(query);

    res.status(200).json({
      success: true,
      data: attendance,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance',
      error: error.message
    });
  }
};

/**
 * Get attendance by ID
 */
const getAttendanceById = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
      .populate('employee', 'firstName lastName employeeId');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    logger.error('Get attendance by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance record',
      error: error.message
    });
  }
};

/**
 * Create attendance
 */
const createAttendance = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const {
      employeeId,
      date,
      checkIn,
      checkOut,
      status,
      notes
    } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if attendance already exists for this date
    const existingAttendance = await Attendance.findOne({
      employee: employeeId,
      date: new Date(date)
    });

    if (existingAttendance) {
      return res.status(409).json({
        success: false,
        message: 'Attendance already recorded for this date'
      });
    }

    const attendance = new Attendance({
      employee: employeeId,
      date: new Date(date),
      checkIn,
      checkOut,
      status: status || 'Present',
      notes
    });

    await attendance.save();

    logger.info(`Attendance created for employee: ${employee.employeeId}`);

    res.status(201).json({
      success: true,
      message: 'Attendance recorded successfully',
      data: attendance
    });
  } catch (error) {
    logger.error('Create attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record attendance',
      error: error.message
    });
  }
};

/**
 * Update attendance
 */
const updateAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    const { checkIn, checkOut, status, notes } = req.body;

    if (checkIn) attendance.checkIn = checkIn;
    if (checkOut) attendance.checkOut = checkOut;
    if (status) attendance.status = status;
    if (notes) attendance.notes = notes;

    await attendance.save();

    logger.info(`Attendance updated: ${attendance._id}`);

    res.status(200).json({
      success: true,
      message: 'Attendance updated successfully',
      data: attendance
    });
  } catch (error) {
    logger.error('Update attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update attendance',
      error: error.message
    });
  }
};

/**
 * Delete attendance
 */
const deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    await attendance.remove();

    logger.info(`Attendance deleted: ${attendance._id}`);

    res.status(200).json({
      success: true,
      message: 'Attendance record deleted successfully'
    });
  } catch (error) {
    logger.error('Delete attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete attendance record',
      error: error.message
    });
  }
};

/**
 * Get employee attendance
 */
const getEmployeeAttendance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query;

    let query = { employee: employeeId };

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);
      query.date = { $gte: startDate, $lt: endDate };
    }

    const attendance = await Attendance.find(query)
      .sort({ date: 1 });

    const summary = {
      present: attendance.filter(a => a.status === 'Present').length,
      absent: attendance.filter(a => a.status === 'Absent').length,
      late: attendance.filter(a => a.status === 'Late').length,
      leave: attendance.filter(a => a.status === 'Leave').length,
      holiday: attendance.filter(a => a.status === 'Holiday').length,
      total: attendance.length
    };

    res.status(200).json({
      success: true,
      data: {
        attendance,
        summary
      }
    });
  } catch (error) {
    logger.error('Get employee attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get employee attendance',
      error: error.message
    });
  }
};

/**
 * Get today's attendance
 */
const getTodayAttendance = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.find({
      date: today
    })
      .populate('employee', 'firstName lastName employeeId position')
      .sort({ checkIn: 1 });

    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    logger.error('Get today attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get today attendance',
      error: error.message
    });
  }
};

/**
 * Get monthly attendance
 */
const getMonthlyAttendance = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const attendance = await Attendance.find({
      date: { $gte: startDate, $lt: endDate }
    })
      .populate('employee', 'firstName lastName employeeId department')
      .sort({ date: 1, checkIn: 1 });

    // Group by employee
    const grouped = {};
    for (const record of attendance) {
      const key = record.employee._id.toString();
      if (!grouped[key]) {
        grouped[key] = {
          employee: record.employee,
          records: []
        };
      }
      grouped[key].records.push(record);
    }

    res.status(200).json({
      success: true,
      data: {
        month: month,
        year: year,
        totalRecords: attendance.length,
        employees: Object.values(grouped)
      }
    });
  } catch (error) {
    logger.error('Get monthly attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get monthly attendance',
      error: error.message
    });
  }
};

/**
 * Mark attendance
 */
const markAttendance = async (req, res) => {
  try {
    const { employeeId, status, notes } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({
      employee: employeeId,
      date: today
    });

    if (attendance) {
      attendance.status = status || attendance.status;
      if (notes) attendance.notes = notes;
      await attendance.save();
    } else {
      attendance = new Attendance({
        employee: employeeId,
        date: today,
        checkIn: new Date().toTimeString().slice(0, 5),
        status: status || 'Present',
        notes
      });
      await attendance.save();
    }

    logger.info(`Attendance marked for employee: ${employee.employeeId}`);

    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendance
    });
  } catch (error) {
    logger.error('Mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance',
      error: error.message
    });
  }
};

/**
 * Get leave requests
 */
const getLeaveRequests = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, employeeId, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (status) query.status = status;
    if (employeeId) query.employee = employeeId;
    if (type) query.type = type;

    const leaveRequests = await LeaveRequest.find(query)
      .populate('employee', 'firstName lastName employeeId position')
      .populate('approvedBy', 'firstName lastName')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await LeaveRequest.countDocuments(query);

    res.status(200).json({
      success: true,
      data: leaveRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get leave requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leave requests',
      error: error.message
    });
  }
};

/**
 * Get leave request by ID
 */
const getLeaveRequestById = async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id)
      .populate('employee', 'firstName lastName employeeId position')
      .populate('approvedBy', 'firstName lastName');

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    res.status(200).json({
      success: true,
      data: leaveRequest
    });
  } catch (error) {
    logger.error('Get leave request by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leave request',
      error: error.message
    });
  }
};

/**
 * Create leave request
 */
const createLeaveRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const {
      employeeId,
      type,
      startDate,
      endDate,
      reason,
      notes
    } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Calculate days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const leaveRequest = new LeaveRequest({
      employee: employeeId,
      type,
      startDate: start,
      endDate: end,
      days,
      reason,
      notes,
      status: 'Pending'
    });

    await leaveRequest.save();

    // Notify HR/Manager
    // Placeholder - would send notification

    logger.info(`Leave request created for employee: ${employee.employeeId}`);

    res.status(201).json({
      success: true,
      message: 'Leave request created successfully',
      data: leaveRequest
    });
  } catch (error) {
    logger.error('Create leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create leave request',
      error: error.message
    });
  }
};

/**
 * Update leave request
 */
const updateLeaveRequest = async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id);
    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    const { type, startDate, endDate, reason, notes } = req.body;

    if (type) leaveRequest.type = type;
    if (startDate) {
      leaveRequest.startDate = new Date(startDate);
      const end = new Date(endDate || leaveRequest.endDate);
      leaveRequest.days = Math.ceil((end - leaveRequest.startDate) / (1000 * 60 * 60 * 24)) + 1;
    }
    if (endDate) {
      leaveRequest.endDate = new Date(endDate);
      const start = new Date(startDate || leaveRequest.startDate);
      leaveRequest.days = Math.ceil((leaveRequest.endDate - start) / (1000 * 60 * 60 * 24)) + 1;
    }
    if (reason) leaveRequest.reason = reason;
    if (notes) leaveRequest.notes = notes;

    await leaveRequest.save();

    logger.info(`Leave request updated: ${leaveRequest._id}`);

    res.status(200).json({
      success: true,
      message: 'Leave request updated successfully',
      data: leaveRequest
    });
  } catch (error) {
    logger.error('Update leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update leave request',
      error: error.message
    });
  }
};

/**
 * Delete leave request
 */
const deleteLeaveRequest = async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id);
    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    await leaveRequest.remove();

    logger.info(`Leave request deleted: ${leaveRequest._id}`);

    res.status(200).json({
      success: true,
      message: 'Leave request deleted successfully'
    });
  } catch (error) {
    logger.error('Delete leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete leave request',
      error: error.message
    });
  }
};

/**
 * Get employee leave requests
 */
const getEmployeeLeaveRequests = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const leaveRequests = await LeaveRequest.find({ employee: employeeId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: leaveRequests
    });
  } catch (error) {
    logger.error('Get employee leave requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get employee leave requests',
      error: error.message
    });
  }
};

/**
 * Get pending leave requests
 */
const getPendingLeaveRequests = async (req, res) => {
  try {
    const leaveRequests = await LeaveRequest.find({
      status: 'Pending'
    })
      .populate('employee', 'firstName lastName employeeId position')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: leaveRequests
    });
  } catch (error) {
    logger.error('Get pending leave requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending leave requests',
      error: error.message
    });
  }
};

/**
 * Get approved leave requests
 */
const getApprovedLeaveRequests = async (req, res) => {
  try {
    const leaveRequests = await LeaveRequest.find({
      status: 'Approved'
    })
      .populate('employee', 'firstName lastName employeeId position')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: leaveRequests
    });
  } catch (error) {
    logger.error('Get approved leave requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get approved leave requests',
      error: error.message
    });
  }
};

/**
 * Get rejected leave requests
 */
const getRejectedLeaveRequests = async (req, res) => {
  try {
    const leaveRequests = await LeaveRequest.find({
      status: 'Rejected'
    })
      .populate('employee', 'firstName lastName employeeId position')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: leaveRequests
    });
  } catch (error) {
    logger.error('Get rejected leave requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get rejected leave requests',
      error: error.message
    });
  }
};

/**
 * Approve leave request
 */
const approveLeaveRequest = async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id);
    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    leaveRequest.status = 'Approved';
    leaveRequest.approvedBy = req.user._id;
    leaveRequest.approvedAt = new Date();
    await leaveRequest.save();

    logger.info(`Leave request approved: ${leaveRequest._id}`);

    res.status(200).json({
      success: true,
      message: 'Leave request approved successfully',
      data: leaveRequest
    });
  } catch (error) {
    logger.error('Approve leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve leave request',
      error: error.message
    });
  }
};

/**
 * Reject leave request
 */
const rejectLeaveRequest = async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id);
    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    const { rejectionReason } = req.body;

    leaveRequest.status = 'Rejected';
    leaveRequest.rejectionReason = rejectionReason;
    await leaveRequest.save();

    logger.info(`Leave request rejected: ${leaveRequest._id}`);

    res.status(200).json({
      success: true,
      message: 'Leave request rejected successfully',
      data: leaveRequest
    });
  } catch (error) {
    logger.error('Reject leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject leave request',
      error: error.message
    });
  }
};

/**
 * Get leave balance
 */
const getLeaveBalance = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Calculate leave balance based on employment type and used leaves
    // Placeholder logic
    const balance = {
      annual: 20,
      sick: 10,
      maternity: 60,
      paternity: 10,
      educational: 15,
      other: 5
    };

    // Get used leaves
    const usedLeaves = await LeaveRequest.aggregate([
      { $match: { employee: employeeId, status: 'Approved' } },
      { $group: { _id: '$type', total: { $sum: '$days' } } }
    ]);

    const used = {};
    for (const item of usedLeaves) {
      used[item._id] = item.total;
    }

    // Calculate remaining
    const remaining = {};
    for (const [key, value] of Object.entries(balance)) {
      remaining[key] = value - (used[key] || 0);
    }

    res.status(200).json({
      success: true,
      data: {
        balance,
        used,
        remaining
      }
    });
  } catch (error) {
    logger.error('Get leave balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leave balance',
      error: error.message
    });
  }
};

/**
 * Get job postings
 */
const getJobPostings = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, department } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (status) query.status = status;
    if (department) query.department = department;

    const jobPostings = await JobPosting.find(query)
      .populate('department', 'name code')
      .populate('hiringManager', 'firstName lastName')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await JobPosting.countDocuments(query);

    res.status(200).json({
      success: true,
      data: jobPostings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get job postings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job postings',
      error: error.message
    });
  }
};

/**
 * Get job posting by ID
 */
const getJobPostingById = async (req, res) => {
  try {
    const jobPosting = await JobPosting.findById(req.params.id)
      .populate('department', 'name code')
      .populate('hiringManager', 'firstName lastName');

    if (!jobPosting) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    res.status(200).json({
      success: true,
      data: jobPosting
    });
  } catch (error) {
    logger.error('Get job posting by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job posting',
      error: error.message
    });
  }
};

/**
 * Create job posting
 */
const createJobPosting = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const {
      title,
      department,
      description,
      requirements,
      responsibilities,
      employmentType,
      salary,
      location,
      deadline,
      hiringManager,
      status
    } = req.body;

    const jobPosting = new JobPosting({
      title,
      department,
      description,
      requirements: requirements || [],
      responsibilities: responsibilities || [],
      employmentType: employmentType || 'Full-Time',
      salary,
      location,
      deadline: new Date(deadline),
      hiringManager,
      status: status || 'Active',
      postedDate: new Date()
    });

    await jobPosting.save();

    logger.info(`Job posting created: ${jobPosting.title}`);

    res.status(201).json({
      success: true,
      message: 'Job posting created successfully',
      data: jobPosting
    });
  } catch (error) {
    logger.error('Create job posting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create job posting',
      error: error.message
    });
  }
};

/**
 * Update job posting
 */
const updateJobPosting = async (req, res) => {
  try {
    const jobPosting = await JobPosting.findById(req.params.id);
    if (!jobPosting) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    const {
      title,
      description,
      requirements,
      responsibilities,
      employmentType,
      salary,
      location,
      deadline,
      status
    } = req.body;

    if (title) jobPosting.title = title;
    if (description) jobPosting.description = description;
    if (requirements) jobPosting.requirements = requirements;
    if (responsibilities) jobPosting.responsibilities = responsibilities;
    if (employmentType) jobPosting.employmentType = employmentType;
    if (salary) jobPosting.salary = salary;
    if (location) jobPosting.location = location;
    if (deadline) jobPosting.deadline = new Date(deadline);
    if (status) jobPosting.status = status;

    await jobPosting.save();

    logger.info(`Job posting updated: ${jobPosting.title}`);

    res.status(200).json({
      success: true,
      message: 'Job posting updated successfully',
      data: jobPosting
    });
  } catch (error) {
    logger.error('Update job posting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update job posting',
      error: error.message
    });
  }
};

/**
 * Delete job posting
 */
const deleteJobPosting = async (req, res) => {
  try {
    const jobPosting = await JobPosting.findById(req.params.id);
    if (!jobPosting) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    jobPosting.status = 'Closed';
    await jobPosting.save();

    logger.info(`Job posting closed: ${jobPosting.title}`);

    res.status(200).json({
      success: true,
      message: 'Job posting closed successfully'
    });
  } catch (error) {
    logger.error('Delete job posting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to close job posting',
      error: error.message
    });
  }
};

/**
 * Get active job postings
 */
const getActiveJobPostings = async (req, res) => {
  try {
    const jobPostings = await JobPosting.find({
      status: 'Active',
      deadline: { $gte: new Date() }
    })
      .populate('department', 'name code')
      .sort({ postedDate: -1 });

    res.status(200).json({
      success: true,
      data: jobPostings
    });
  } catch (error) {
    logger.error('Get active job postings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active job postings',
      error: error.message
    });
  }
};

/**
 * Get applications
 */
const getApplications = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, jobPostingId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (status) query.status = status;
    if (jobPostingId) query.jobPosting = jobPostingId;

    const applications = await Application.find(query)
      .populate('jobPosting', 'title department')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Application.countDocuments(query);

    res.status(200).json({
      success: true,
      data: applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get applications',
      error: error.message
    });
  }
};

/**
 * Get application by ID
 */
const getApplicationById = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('jobPosting', 'title department');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    logger.error('Get application by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get application',
      error: error.message
    });
  }
};

/**
 * Create application
 */
const createApplication = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const {
      jobPostingId,
      applicantName,
      email,
      phone,
      resume,
      coverLetter,
      experience,
      education,
      skills
    } = req.body;

    const jobPosting = await JobPosting.findById(jobPostingId);
    if (!jobPosting) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    // Check if applicant already applied
    const existingApplication = await Application.findOne({
      jobPosting: jobPostingId,
      email
    });

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        message: 'You have already applied for this position'
      });
    }

    const applicationId = `APP-${new Date().getFullYear()}-${String(await Application.countDocuments() + 1).padStart(4, '0')}`;

    const application = new Application({
      applicationId,
      jobPosting: jobPostingId,
      applicantName,
      email,
      phone,
      resume,
      coverLetter,
      experience: experience || [],
      education: education || [],
      skills: skills || [],
      status: 'Submitted'
    });

    await application.save();

    // Send confirmation email
    try {
      await sendEmail({
        to: email,
        subject: `Application Received - ${jobPosting.title}`,
        template: 'application-confirmation',
        templateData: {
          name: applicantName,
          jobTitle: jobPosting.title,
          applicationId: application.applicationId
        }
      });
    } catch (emailError) {
      logger.error('Application confirmation email error:', emailError);
    }

    logger.info(`Application created: ${application.applicationId}`);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application
    });
  } catch (error) {
    logger.error('Create application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: error.message
    });
  }
};

/**
 * Update application
 */
const updateApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const { status, notes, interviewDate } = req.body;

    if (status) application.status = status;
    if (notes) application.notes = notes;
    if (interviewDate) application.interviewDate = new Date(interviewDate);

    await application.save();

    logger.info(`Application updated: ${application.applicationId}`);

    res.status(200).json({
      success: true,
      message: 'Application updated successfully',
      data: application
    });
  } catch (error) {
    logger.error('Update application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application',
      error: error.message
    });
  }
};

/**
 * Delete application
 */
const deleteApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    await application.remove();

    logger.info(`Application deleted: ${application.applicationId}`);

    res.status(200).json({
      success: true,
      message: 'Application deleted successfully'
    });
  } catch (error) {
    logger.error('Delete application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete application',
      error: error.message
    });
  }
};

/**
 * Get job applications
 */
const getJobApplications = async (req, res) => {
  try {
    const { jobPostingId } = req.params;

    const applications = await Application.find({
      jobPosting: jobPostingId
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: applications
    });
  } catch (error) {
    logger.error('Get job applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job applications',
      error: error.message
    });
  }
};

/**
 * Shortlist application
 */
const shortlistApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    application.status = 'Shortlisted';
    await application.save();

    logger.info(`Application shortlisted: ${application.applicationId}`);

    res.status(200).json({
      success: true,
      message: 'Application shortlisted successfully',
      data: application
    });
  } catch (error) {
    logger.error('Shortlist application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to shortlist application',
      error: error.message
    });
  }
};

/**
 * Schedule interview
 */
const scheduleInterview = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const { interviewDate, interviewType, interviewers, notes } = req.body;

    application.interviewDate = new Date(interviewDate);
    application.interviewType = interviewType || 'In-Person';
    application.interviewers = interviewers || [];
    application.notes = notes || application.notes;
    application.status = 'Interview Scheduled';
    await application.save();

    // Send interview invitation email
    try {
      await sendEmail({
        to: application.email,
        subject: `Interview Invitation - ${application.jobPosting.title}`,
        template: 'interview-invitation',
        templateData: {
          name: application.applicantName,
          jobTitle: application.jobPosting.title,
          interviewDate: application.interviewDate,
          interviewType: application.interviewType,
          location: application.interviewType === 'In-Person' ? 'Adventist General Hospital' : 'Virtual'
        }
      });
    } catch (emailError) {
      logger.error('Interview invitation email error:', emailError);
    }

    logger.info(`Interview scheduled for application: ${application.applicationId}`);

    res.status(200).json({
      success: true,
      message: 'Interview scheduled successfully',
      data: application
    });
  } catch (error) {
    logger.error('Schedule interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule interview',
      error: error.message
    });
  }
};

/**
 * Update interview status
 */
const updateInterviewStatus = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const { status, feedback, notes } = req.body;

    application.interviewStatus = status;
    application.interviewFeedback = feedback;
    if (notes) application.notes = notes;

    if (status === 'Passed') {
      application.status = 'Interview Passed';
    } else if (status === 'Failed') {
      application.status = 'Interview Failed';
    }

    await application.save();

    logger.info(`Interview status updated for application: ${application.applicationId}`);

    res.status(200).json({
      success: true,
      message: 'Interview status updated successfully',
      data: application
    });
  } catch (error) {
    logger.error('Update interview status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update interview status',
      error: error.message
    });
  }
};

/**
 * Offer job
 */
const offerJob = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const { offerDetails, salary, startDate, notes } = req.body;

    application.status = 'Offered';
    application.offerDetails = offerDetails || {};
    application.offerDetails.salary = salary;
    application.offerDetails.startDate = new Date(startDate);
    application.offerDetails.offeredDate = new Date();
    if (notes) application.notes = notes;
    await application.save();

    // Send job offer email
    try {
      await sendEmail({
        to: application.email,
        subject: `Job Offer - ${application.jobPosting.title}`,
        template: 'job-offer',
        templateData: {
          name: application.applicantName,
          jobTitle: application.jobPosting.title,
          salary: salary,
          startDate: startDate
        }
      });
    } catch (emailError) {
      logger.error('Job offer email error:', emailError);
    }

    logger.info(`Job offered to application: ${application.applicationId}`);

    res.status(200).json({
      success: true,
      message: 'Job offer sent successfully',
      data: application
    });
  } catch (error) {
    logger.error('Offer job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send job offer',
      error: error.message
    });
  }
};

/**
 * Get performance reviews
 */
const getPerformanceReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20, employeeId, status, reviewerId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (employeeId) query.employee = employeeId;
    if (status) query.status = status;
    if (reviewerId) query.reviewer = reviewerId;

    const reviews = await PerformanceReview.find(query)
      .populate('employee', 'firstName lastName employeeId position')
      .populate('reviewer', 'firstName lastName')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await PerformanceReview.countDocuments(query);

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get performance reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get performance reviews',
      error: error.message
    });
  }
};

/**
 * Get performance review by ID
 */
const getPerformanceReviewById = async (req, res) => {
  try {
    const review = await PerformanceReview.findById(req.params.id)
      .populate('employee', 'firstName lastName employeeId position')
      .populate('reviewer', 'firstName lastName');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Performance review not found'
      });
    }

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    logger.error('Get performance review by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get performance review',
      error: error.message
    });
  }
};

/**
 * Create performance review
 */
const createPerformanceReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const {
      employeeId,
      reviewerId,
      periodStart,
      periodEnd,
      rating,
      feedback,
      strengths,
      weaknesses,
      goals,
      recommendations,
      notes
    } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const review = new PerformanceReview({
      employee: employeeId,
      reviewer: reviewerId || req.user._id,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      rating,
      feedback,
      strengths: strengths || [],
      weaknesses: weaknesses || [],
      goals: goals || [],
      recommendations,
      notes,
      status: 'Pending'
    });

    await review.save();

    logger.info(`Performance review created for employee: ${employee.employeeId}`);

    res.status(201).json({
      success: true,
      message: 'Performance review created successfully',
      data: review
    });
  } catch (error) {
    logger.error('Create performance review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create performance review',
      error: error.message
    });
  }
};

/**
 * Update performance review
 */
const updatePerformanceReview = async (req, res) => {
  try {
    const review = await PerformanceReview.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Performance review not found'
      });
    }

    const {
      rating,
      feedback,
      strengths,
      weaknesses,
      goals,
      recommendations,
      status,
      notes
    } = req.body;

    if (rating) review.rating = rating;
    if (feedback) review.feedback = feedback;
    if (strengths) review.strengths = strengths;
    if (weaknesses) review.weaknesses = weaknesses;
    if (goals) review.goals = goals;
    if (recommendations) review.recommendations = recommendations;
    if (status) review.status = status;
    if (notes) review.notes = notes;

    await review.save();

    logger.info(`Performance review updated: ${review._id}`);

    res.status(200).json({
      success: true,
      message: 'Performance review updated successfully',
      data: review
    });
  } catch (error) {
    logger.error('Update performance review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update performance review',
      error: error.message
    });
  }
};

/**
 * Delete performance review
 */
const deletePerformanceReview = async (req, res) => {
  try {
    const review = await PerformanceReview.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Performance review not found'
      });
    }

    await review.remove();

    logger.info(`Performance review deleted: ${review._id}`);

    res.status(200).json({
      success: true,
      message: 'Performance review deleted successfully'
    });
  } catch (error) {
    logger.error('Delete performance review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete performance review',
      error: error.message
    });
  }
};

/**
 * Get employee reviews
 */
const getEmployeeReviews = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const reviews = await PerformanceReview.find({ employee: employeeId })
      .populate('reviewer', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: reviews
    });
  } catch (error) {
    logger.error('Get employee reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get employee reviews',
      error: error.message
    });
  }
};

/**
 * Get pending reviews
 */
const getPendingReviews = async (req, res) => {
  try {
    const reviews = await PerformanceReview.find({
      status: 'Pending'
    })
      .populate('employee', 'firstName lastName employeeId position')
      .populate('reviewer', 'firstName lastName')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: reviews
    });
  } catch (error) {
    logger.error('Get pending reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending reviews',
      error: error.message
    });
  }
};

/**
 * Get completed reviews
 */
const getCompletedReviews = async (req, res) => {
  try {
    const reviews = await PerformanceReview.find({
      status: 'Completed'
    })
      .populate('employee', 'firstName lastName employeeId position')
      .populate('reviewer', 'firstName lastName')
      .sort({ completedAt: -1 });

    res.status(200).json({
      success: true,
      data: reviews
    });
  } catch (error) {
    logger.error('Get completed reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get completed reviews',
      error: error.message
    });
  }
};

/**
 * Submit review
 */
const submitReview = async (req, res) => {
  try {
    const review = await PerformanceReview.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Performance review not found'
      });
    }

    review.status = 'Completed';
    review.completedAt = new Date();
    await review.save();

    logger.info(`Performance review submitted: ${review._id}`);

    res.status(200).json({
      success: true,
      message: 'Performance review submitted successfully',
      data: review
    });
  } catch (error) {
    logger.error('Submit review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit performance review',
      error: error.message
    });
  }
};

/**
 * Get payroll
 */
const getPayroll = async (req, res) => {
  try {
    const { page = 1, limit = 20, employeeId, month, year } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (employeeId) query.employee = employeeId;
    if (month && year) {
      query.month = parseInt(month);
      query.year = parseInt(year);
    }

    const payroll = await Payroll.find(query)
      .populate('employee', 'firstName lastName employeeId position')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ year: -1, month: -1 });

    const total = await Payroll.countDocuments(query);

    res.status(200).json({
      success: true,
      data: payroll,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payroll',
      error: error.message
    });
  }
};

/**
 * Get payroll by ID
 */
const getPayrollById = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate('employee', 'firstName lastName employeeId position');

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: payroll
    });
  } catch (error) {
    logger.error('Get payroll by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payroll record',
      error: error.message
    });
  }
};

/**
 * Create payroll
 */
const createPayroll = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const {
      employeeId,
      month,
      year,
      basicSalary,
      allowances,
      deductions,
      overtime,
      bonus,
      notes
    } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if payroll already exists
    const existingPayroll = await Payroll.findOne({
      employee: employeeId,
      month,
      year
    });

    if (existingPayroll) {
      return res.status(409).json({
        success: false,
        message: 'Payroll already exists for this month'
      });
    }

    const payroll = new Payroll({
      employee: employeeId,
      month,
      year,
      basicSalary: basicSalary || employee.salary || 0,
      allowances: allowances || {},
      deductions: deductions || {},
      overtime: overtime || 0,
      bonus: bonus || 0,
      notes,
      status: 'Draft'
    });

    // Calculate total
    payroll.calculateTotal();

    await payroll.save();

    logger.info(`Payroll created for employee: ${employee.employeeId}`);

    res.status(201).json({
      success: true,
      message: 'Payroll created successfully',
      data: payroll
    });
  } catch (error) {
    logger.error('Create payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payroll',
      error: error.message
    });
  }
};

/**
 * Update payroll
 */
const updatePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    const {
      basicSalary,
      allowances,
      deductions,
      overtime,
      bonus,
      status,
      notes
    } = req.body;

    if (basicSalary) payroll.basicSalary = basicSalary;
    if (allowances) payroll.allowances = allowances;
    if (deductions) payroll.deductions = deductions;
    if (overtime) payroll.overtime = overtime;
    if (bonus) payroll.bonus = bonus;
    if (status) payroll.status = status;
    if (notes) payroll.notes = notes;

    payroll.calculateTotal();
    await payroll.save();

    logger.info(`Payroll updated: ${payroll._id}`);

    res.status(200).json({
      success: true,
      message: 'Payroll updated successfully',
      data: payroll
    });
  } catch (error) {
    logger.error('Update payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payroll',
      error: error.message
    });
  }
};

/**
 * Delete payroll
 */
const deletePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    await payroll.remove();

    logger.info(`Payroll deleted: ${payroll._id}`);

    res.status(200).json({
      success: true,
      message: 'Payroll record deleted successfully'
    });
  } catch (error) {
    logger.error('Delete payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payroll record',
      error: error.message
    });
  }
};

/**
 * Get employee payroll
 */
const getEmployeePayroll = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const payroll = await Payroll.find({ employee: employeeId })
      .sort({ year: -1, month: -1 });

    res.status(200).json({
      success: true,
      data: payroll
    });
  } catch (error) {
    logger.error('Get employee payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get employee payroll',
      error: error.message
    });
  }
};

/**
 * Get monthly payroll
 */
const getMonthlyPayroll = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }

    const payroll = await Payroll.find({
      month: parseInt(month),
      year: parseInt(year)
    })
      .populate('employee', 'firstName lastName employeeId position department')
      .sort({ employee: 1 });

    const summary = {
      totalEmployees: payroll.length,
      totalBasicSalary: payroll.reduce((sum, p) => sum + p.basicSalary, 0),
      totalAllowances: payroll.reduce((sum, p) => sum + p.totalAllowances, 0),
      totalDeductions: payroll.reduce((sum, p) => sum + p.totalDeductions, 0),
      totalNetPay: payroll.reduce((sum, p) => sum + p.netPay, 0)
    };

    res.status(200).json({
      success: true,
      data: {
        month: parseInt(month),
        year: parseInt(year),
        payroll,
        summary
      }
    });
  } catch (error) {
    logger.error('Get monthly payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get monthly payroll',
      error: error.message
    });
  }
};

/**
 * Process payroll
 */
const processPayroll = async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }

    // Find all payroll records for the month
    const payrolls = await Payroll.find({
      month: parseInt(month),
      year: parseInt(year),
      status: 'Draft'
    });

    if (payrolls.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No payroll records found for this month'
      });
    }

    // Process each payroll
    for (const payroll of payrolls) {
      payroll.calculateTotal();
      payroll.status = 'Processed';
      payroll.processedAt = new Date();
      await payroll.save();
    }

    logger.info(`Payroll processed for ${month}/${year}`);

    res.status(200).json({
      success: true,
      message: `Payroll processed for ${payrolls.length} employees`,
      data: {
        month,
        year,
        processed: payrolls.length
      }
    });
  } catch (error) {
    logger.error('Process payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payroll',
      error: error.message
    });
  }
};

/**
 * Generate payslip
 */
const generatePaySlip = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate('employee', 'firstName lastName employeeId position department');

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    // Generate payslip data
    const payslip = {
      employee: payroll.employee,
      month: payroll.month,
      year: payroll.year,
      basicSalary: payroll.basicSalary,
      allowances: payroll.allowances,
      deductions: payroll.deductions,
      overtime: payroll.overtime,
      bonus: payroll.bonus,
      totalAllowances: payroll.totalAllowances,
      totalDeductions: payroll.totalDeductions,
      netPay: payroll.netPay,
      generatedAt: new Date()
    };

    res.status(200).json({
      success: true,
      message: 'Payslip generated successfully',
      data: payslip
    });
  } catch (error) {
    logger.error('Generate payslip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate payslip',
      error: error.message
    });
  }
};

/**
 * Get trainings
 */
const getTrainings = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const trainings = await Training.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ date: 1 });

    const total = await Training.countDocuments(query);

    res.status(200).json({
      success: true,
      data: trainings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get trainings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trainings',
      error: error.message
    });
  }
};

/**
 * Get training by ID
 */
const getTrainingById = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({
        success: false,
        message: 'Training not found'
      });
    }

    res.status(200).json({
      success: true,
      data: training
    });
  } catch (error) {
    logger.error('Get training by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get training',
      error: error.message
    });
  }
};

/**
 * Create training
 */
const createTraining = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const {
      title,
      description,
      type,
      date,
      duration,
      trainer,
      capacity,
      location,
      materials,
      notes
    } = req.body;

    const training = new Training({
      title,
      description,
      type: type || 'Internal',
      date: new Date(date),
      duration,
      trainer,
      capacity: capacity || 20,
      location,
      materials: materials || [],
      notes,
      status: 'Scheduled'
    });

    await training.save();

    logger.info(`Training created: ${training.title}`);

    res.status(201).json({
      success: true,
      message: 'Training created successfully',
      data: training
    });
  } catch (error) {
    logger.error('Create training error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create training',
      error: error.message
    });
  }
};

/**
 * Update training
 */
const updateTraining = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({
        success: false,
        message: 'Training not found'
      });
    }

    const {
      title,
      description,
      type,
      date,
      duration,
      trainer,
      capacity,
      location,
      materials,
      status,
      notes
    } = req.body;

    if (title) training.title = title;
    if (description) training.description = description;
    if (type) training.type = type;
    if (date) training.date = new Date(date);
    if (duration) training.duration = duration;
    if (trainer) training.trainer = trainer;
    if (capacity) training.capacity = capacity;
    if (location) training.location = location;
    if (materials) training.materials = materials;
    if (status) training.status = status;
    if (notes) training.notes = notes;

    await training.save();

    logger.info(`Training updated: ${training.title}`);

    res.status(200).json({
      success: true,
      message: 'Training updated successfully',
      data: training
    });
  } catch (error) {
    logger.error('Update training error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update training',
      error: error.message
    });
  }
};

/**
 * Delete training
 */
const deleteTraining = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({
        success: false,
        message: 'Training not found'
      });
    }

    training.status = 'Cancelled';
    await training.save();

    logger.info(`Training cancelled: ${training.title}`);

    res.status(200).json({
      success: true,
      message: 'Training cancelled successfully'
    });
  } catch (error) {
    logger.error('Delete training error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel training',
      error: error.message
    });
  }
};

/**
 * Get upcoming trainings
 */
const getUpcomingTrainings = async (req, res) => {
  try {
    const trainings = await Training.find({
      date: { $gte: new Date() },
      status: 'Scheduled'
    }).sort({ date: 1 });

    res.status(200).json({
      success: true,
      data: trainings
    });
  } catch (error) {
    logger.error('Get upcoming trainings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get upcoming trainings',
      error: error.message
    });
  }
};

/**
 * Get employee trainings
 */
const getEmployeeTrainings = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Placeholder - would query employee training enrollment
    const trainings = [];

    res.status(200).json({
      success: true,
      data: trainings
    });
  } catch (error) {
    logger.error('Get employee trainings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get employee trainings',
      error: error.message
    });
  }
};

/**
 * Enroll employee in training
 */
const enrollEmployee = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({
        success: false,
        message: 'Training not found'
      });
    }

    const { employeeId } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Placeholder - would add employee to training enrollment

    logger.info(`Employee ${employee.employeeId} enrolled in training: ${training.title}`);

    res.status(200).json({
      success: true,
      message: 'Employee enrolled in training successfully'
    });
  } catch (error) {
    logger.error('Enroll employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll employee',
      error: error.message
    });
  }
};

/**
 * Complete training
 */
const completeTraining = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({
        success: false,
        message: 'Training not found'
      });
    }

    // Placeholder - would mark training as completed

    training.status = 'Completed';
    await training.save();

    logger.info(`Training completed: ${training.title}`);

    res.status(200).json({
      success: true,
      message: 'Training marked as completed successfully'
    });
  } catch (error) {
    logger.error('Complete training error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete training',
      error: error.message
    });
  }
};

/**
 * Get HR stats
 */
const getHRStats = async (req, res) => {
  try {
    const [
      totalEmployees,
      activeEmployees,
      onLeave,
      departments,
      pendingLeave,
      pendingReviews
    ] = await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ status: 'Active' }),
      Employee.countDocuments({ status: 'On Leave' }),
      Department.countDocuments(),
      LeaveRequest.countDocuments({ status: 'Pending' }),
      PerformanceReview.countDocuments({ status: 'Pending' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        onLeave,
        departments,
        pendingLeave,
        pendingReviews,
        employeeTurnover: activeEmployees > 0 ? Math.round((totalEmployees - activeEmployees) / totalEmployees * 100) : 0
      }
    });
  } catch (error) {
    logger.error('Get HR stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get HR stats',
      error: error.message
    });
  }
};

/**
 * Get daily stats
 */
const getDailyStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      attendanceToday,
      leaveToday,
      newEmployees
    ] = await Promise.all([
      Attendance.countDocuments({ date: { $gte: today, $lt: tomorrow } }),
      LeaveRequest.countDocuments({
        startDate: { $lte: today },
        endDate: { $gte: today },
        status: 'Approved'
      }),
      Employee.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } })
    ]);

    res.status(200).json({
      success: true,
      data: {
        date: today,
        attendanceToday,
        leaveToday,
        newEmployees
      }
    });
  } catch (error) {
    logger.error('Get daily stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get daily stats',
      error: error.message
    });
  }
};

/**
 * Get monthly stats
 */
const getMonthlyStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [
      newEmployees,
      leavesMonth,
      attendanceMonth
    ] = await Promise.all([
      Employee.countDocuments({ createdAt: { $gte: startOfMonth, $lt: endOfMonth } }),
      LeaveRequest.countDocuments({ createdAt: { $gte: startOfMonth, $lt: endOfMonth } }),
      Attendance.countDocuments({ date: { $gte: startOfMonth, $lt: endOfMonth } })
    ]);

    res.status(200).json({
      success: true,
      data: {
        month: startOfMonth,
        newEmployees,
        leavesMonth,
        attendanceMonth
      }
    });
  } catch (error) {
    logger.error('Get monthly stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get monthly stats',
      error: error.message
    });
  }
};

/**
 * Get reports
 */
const getReports = async (req, res) => {
  try {
    // Placeholder - would generate HR reports
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reports',
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

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeesByDepartment,
  getEmployeesByPosition,
  getActiveEmployees,
  getInactiveEmployees,
  searchEmployees,
  getAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getEmployeeAttendance,
  getTodayAttendance,
  getMonthlyAttendance,
  markAttendance,
  getLeaveRequests,
  getLeaveRequestById,
  createLeaveRequest,
  updateLeaveRequest,
  deleteLeaveRequest,
  getEmployeeLeaveRequests,
  getPendingLeaveRequests,
  getApprovedLeaveRequests,
  getRejectedLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
  getLeaveBalance,
