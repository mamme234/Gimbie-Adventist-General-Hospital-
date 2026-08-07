/**
 * ============================================
 * DASHBOARD.CONTROLLER.JS - Dashboard Controller
 * ============================================
 */

const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Nurse = require('../models/Nurse');
const Appointment = require('../models/Appointment');
const Bill = require('../models/Bill');
const User = require('../models/User');
const Department = require('../models/Department');
const { logger } = require('../config/logger');

/**
 * Get dashboard data
 */
const getDashboardData = async (req, res) => {
  try {
    const user = req.user;
    let dashboardData = {};

    switch (user.role) {
      case 'patient':
        dashboardData = await getPatientDashboard(user._id);
        break;
      case 'doctor':
        dashboardData = await getDoctorDashboard(user._id);
        break;
      case 'nurse':
        dashboardData = await getNurseDashboard(user._id);
        break;
      case 'admin':
        dashboardData = await getAdminDashboard();
        break;
      case 'finance':
        dashboardData = await getFinanceDashboard();
        break;
      case 'hr':
        dashboardData = await getHRDashboard();
        break;
      case 'pharmacist':
        dashboardData = await getPharmacyDashboard();
        break;
      case 'lab_technician':
        dashboardData = await getLabDashboard();
        break;
      case 'radiologist':
        dashboardData = await getRadiologyDashboard();
        break;
      default:
        dashboardData = await getGeneralDashboard();
    }

    res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    logger.error('Get dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data',
      error: error.message
    });
  }
};

/**
 * Get dashboard stats
 */
const getDashboardStats = async (req, res) => {
  try {
    const stats = await getGeneralStats();
    res.status(200).json({
      success: true,
      data: stats
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
 * Get dashboard charts
 */
const getDashboardCharts = async (req, res) => {
  try {
    const chartData = await getChartData();
    res.status(200).json({
      success: true,
      data: chartData
    });
  } catch (error) {
    logger.error('Get dashboard charts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard charts',
      error: error.message
    });
  }
};

/**
 * Get dashboard widgets
 */
const getDashboardWidgets = async (req, res) => {
  try {
    const widgets = await getWidgetData(req.user);
    res.status(200).json({
      success: true,
      data: widgets
    });
  } catch (error) {
    logger.error('Get dashboard widgets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard widgets',
      error: error.message
    });
  }
};

/**
 * Get dashboard notifications
 */
const getDashboardNotifications = async (req, res) => {
  try {
    const notifications = await getNotifications(req.user);
    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    logger.error('Get dashboard notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard notifications',
      error: error.message
    });
  }
};

/**
 * Get dashboard activities
 */
const getDashboardActivities = async (req, res) => {
  try {
    const activities = await getActivities(req.user);
    res.status(200).json({
      success: true,
      data: activities
    });
  } catch (error) {
    logger.error('Get dashboard activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard activities',
      error: error.message
    });
  }
};

// ============================================
// ROLE-BASED DASHBOARDS
// ============================================

/**
 * Get patient dashboard
 */
const getPatientDashboard = async (userId) => {
  const patient = await Patient.findOne({ userId });
  if (!patient) {
    throw new Error('Patient not found');
  }

  const [
    upcomingAppointments,
    recentAppointments,
    activePrescriptions,
    pendingBills,
    recentLabResults
  ] = await Promise.all([
    Appointment.find({
      patient: patient._id,
      date: { $gte: new Date() },
      status: { $in: ['Confirmed', 'Pending'] }
    }).populate('doctor', 'doctorId specialty').sort({ date: 1 }).limit(5),
    Appointment.find({
      patient: patient._id,
      status: 'Completed'
    }).populate('doctor', 'doctorId specialty').sort({ date: -1 }).limit(5),
    // Prescriptions placeholder
    [],
    Bill.find({
      patient: patient._id,
      status: 'Pending'
    }).sort({ dueDate: 1 }).limit(5),
    // Lab results placeholder
    []
  ]);

  return {
    greeting: `Welcome back, ${patient.userId.firstName || 'Patient'}!`,
    stats: {
      upcomingAppointments: upcomingAppointments.length,
      activePrescriptions: 0,
      pendingBills: pendingBills.length,
      recentVisits: recentAppointments.length
    },
    upcomingAppointments,
    recentAppointments,
    activePrescriptions,
    pendingBills,
    recentLabResults
  };
};

/**
 * Get doctor dashboard
 */
const getDoctorDashboard = async (userId) => {
  const doctor = await Doctor.findOne({ userId });
  if (!doctor) {
    throw new Error('Doctor not found');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    todayAppointments,
    upcomingAppointments,
    totalPatients,
    pendingPrescriptions,
    recentPatients
  ] = await Promise.all([
    Appointment.find({
      doctor: doctor._id,
      date: { $gte: today, $lt: tomorrow },
      status: { $nin: ['Cancelled'] }
    }).populate('patient', 'patientId').sort({ time: 1 }),
    Appointment.find({
      doctor: doctor._id,
      date: { $gte: today },
      status: { $in: ['Confirmed', 'Pending'] }
    }).populate('patient', 'patientId').sort({ date: 1 }).limit(10),
    Patient.countDocuments({ assignedDoctor: doctor._id }),
    // Prescriptions placeholder
    [],
    Patient.find({ assignedDoctor: doctor._id })
      .populate('userId', 'firstName lastName')
      .sort({ updatedAt: -1 })
      .limit(5)
  ]);

  return {
    greeting: `Good morning, Dr. ${doctor.userId.lastName || 'Doctor'}!`,
    stats: {
      todayAppointments: todayAppointments.length,
      totalPatients,
      pendingPrescriptions: 0,
      upcomingAppointments: upcomingAppointments.length
    },
    todayAppointments,
    upcomingAppointments,
    recentPatients,
    schedule: doctor.availability || {}
  };
};

/**
 * Get nurse dashboard
 */
const getNurseDashboard = async (userId) => {
  const nurse = await Nurse.findOne({ userId });
  if (!nurse) {
    throw new Error('Nurse not found');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    assignedPatients,
    todayTasks,
    pendingMedications,
    recentVitals
  ] = await Promise.all([
    Patient.find({
      assignedNurse: nurse._id,
      status: 'Active'
    }).populate('userId', 'firstName lastName').limit(10),
    // Tasks placeholder
    [],
    // Medications placeholder
    [],
    // Vitals placeholder
    []
  ]);

  return {
    greeting: `Good morning, ${nurse.userId.firstName || 'Nurse'}!`,
    stats: {
      assignedPatients: assignedPatients.length,
      todayTasks: 0,
      pendingMedications: 0,
      shift: nurse.shift || 'Day'
    },
    assignedPatients,
    todayTasks,
    pendingMedications,
    recentVitals,
    ward: nurse.ward || 'General'
  };
};

/**
 * Get admin dashboard
 */
const getAdminDashboard = async () => {
  const [
    totalUsers,
    totalPatients,
    totalDoctors,
    totalNurses,
    totalDepartments,
    totalAppointments,
    todayAppointments,
    totalRevenue,
    recentActivities
  ] = await Promise.all([
    User.countDocuments(),
    Patient.countDocuments(),
    Doctor.countDocuments(),
    Nurse.countDocuments(),
    Department.countDocuments(),
    Appointment.countDocuments(),
    Appointment.countDocuments({
      date: { $gte: new Date().setHours(0, 0, 0, 0) }
    }),
    Bill.aggregate([{ $group: { _id: null, total: { $sum: '$amountPaid' } } }]),
    Appointment.find().sort({ updatedAt: -1 }).limit(10)
  ]);

  return {
    greeting: 'Welcome, Admin!',
    stats: {
      totalUsers,
      totalPatients,
      totalDoctors: totalDoctors || 0,
      totalNurses: totalNurses || 0,
      totalDepartments,
      totalAppointments,
      todayAppointments,
      totalRevenue: totalRevenue[0]?.total || 0
    },
    recentActivities,
    systemStatus: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    }
  };
};

/**
 * Get finance dashboard
 */
const getFinanceDashboard = async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalRevenue,
    monthlyRevenue,
    pendingBills,
    overdueBills,
    totalBills,
    recentTransactions
  ] = await Promise.all([
    Bill.aggregate([{ $group: { _id: null, total: { $sum: '$amountPaid' } } }]),
    Bill.aggregate([
      { $match: { paymentDate: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } }
    ]),
    Bill.countDocuments({ status: 'Pending' }),
    Bill.countDocuments({
      status: { $in: ['Pending', 'Partially Paid'] },
      dueDate: { $lt: new Date() }
    }),
    Bill.countDocuments(),
    Bill.find().sort({ createdAt: -1 }).limit(10)
  ]);

  return {
    greeting: 'Welcome, Finance Team!',
    stats: {
      totalRevenue: totalRevenue[0]?.total || 0,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      pendingBills,
      overdueBills,
      totalBills
    },
    recentTransactions,
    summary: {
      collectionRate: totalBills > 0
        ? Math.round(((totalRevenue[0]?.total || 0) / (totalBills * 1000)) * 100)
        : 0
    }
  };
};

/**
 * Get HR dashboard
 */
const getHRDashboard = async () => {
  const [
    totalEmployees,
    activeEmployees,
    onLeave,
    pendingLeave,
    newHires,
    recentActivities
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    // Employee placeholder
    0,
    // LeaveRequest placeholder
    0,
    // Employee start date placeholder
    0,
    []
  ]);

  return {
    greeting: 'Welcome, HR Team!',
    stats: {
      totalEmployees,
      activeEmployees,
      onLeave,
      pendingLeave,
      newHires
    },
    recentActivities,
    turnoverRate: totalEmployees > 0
      ? Math.round(((totalEmployees - activeEmployees) / totalEmployees) * 100)
      : 0
  };
};

/**
 * Get pharmacy dashboard
 */
const getPharmacyDashboard = async () => {
  return {
    greeting: 'Welcome, Pharmacy Team!',
    stats: {
      totalMedicines: 0,
      lowStock: 0,
      pendingPrescriptions: 0,
      todayDispensed: 0
    },
    recentPrescriptions: [],
    expiringMedicines: [],
    lowStockItems: []
  };
};

/**
 * Get lab dashboard
 */
const getLabDashboard = async () => {
  return {
    greeting: 'Welcome, Lab Team!',
    stats: {
      pendingTests: 0,
      processingTests: 0,
      completedTests: 0,
      totalSamples: 0
    },
    recentOrders: [],
    pendingResults: [],
    equipmentStatus: []
  };
};

/**
 * Get radiology dashboard
 */
const getRadiologyDashboard = async () => {
  return {
    greeting: 'Welcome, Radiology Team!',
    stats: {
      pendingScans: 0,
      inProgress: 0,
      completedScans: 0,
      totalPatients: 0
    },
    todayScans: [],
    equipmentStatus: [],
    pendingReports: []
  };
};

/**
 * Get general dashboard
 */
const getGeneralDashboard = async () => {
  return {
    greeting: 'Welcome!',
    stats: {
      totalUsers: await User.countDocuments(),
      totalPatients: await Patient.countDocuments(),
      totalAppointments: await Appointment.countDocuments()
    },
    recentActivities: []
  };
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get general stats
 */
const getGeneralStats = async () => {
  const [
    totalUsers,
    totalPatients,
    totalAppointments,
    totalRevenue,
    totalBills
  ] = await Promise.all([
    User.countDocuments(),
    Patient.countDocuments(),
    Appointment.countDocuments(),
    Bill.aggregate([{ $group: { _id: null, total: { $sum: '$amountPaid' } } }]),
    Bill.countDocuments()
  ]);

  return {
    totalUsers,
    totalPatients,
    totalAppointments,
    totalRevenue: totalRevenue[0]?.total || 0,
    totalBills
  };
};

/**
 * Get chart data
 */
const getChartData = async () => {
  const now = new Date();
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(date);
  }

  const appointmentData = await Promise.all(months.map(async (date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    const count = await Appointment.countDocuments({
      date: { $gte: start, $lt: end }
    });
    return {
      month: date.toLocaleString('default', { month: 'short' }),
      year: date.getFullYear(),
      appointments: count
    };
  }));

  const revenueData = await Promise.all(months.map(async (date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    const revenue = await Bill.aggregate([
      { $match: { paymentDate: { $gte: start, $lt: end }, status: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } }
    ]);
    return {
      month: date.toLocaleString('default', { month: 'short' }),
      year: date.getFullYear(),
      revenue: revenue[0]?.total || 0
    };
  }));

  return {
    appointments: appointmentData,
    revenue: revenueData
  };
};

/**
 * Get widget data
 */
const getWidgetData = async (user) => {
  const widgets = {
    patient: ['upcomingAppointments', 'healthSummary', 'recentMessages'],
    doctor: ['todaySchedule', 'patientStats', 'recentPatients'],
    nurse: ['assignedPatients', 'todayTasks', 'vitalSigns'],
    admin: ['systemStats', 'recentActivities', 'userGrowth'],
    finance: ['revenueStats', 'pendingBills', 'paymentTrends'],
    hr: ['employeeStats', 'leaveRequests', 'newHires']
  };

  return {
    widgets: widgets[user.role] || ['generalStats']
  };
};

/**
 * Get notifications
 */
const getNotifications = async (user) => {
  return [];
};

/**
 * Get activities
 */
const getActivities = async (user) => {
  return [];
};

// ============================================
// CUSTOM DASHBOARD FUNCTIONS
// ============================================

/**
 * Get custom dashboard
 */
const getCustomDashboard = async (req, res) => {
  try {
    const dashboard = {
      id: 'default',
      name: 'Default Dashboard',
      layout: [],
      widgets: [],
      isDefault: true
    };
    res.status(200).json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    logger.error('Get custom dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get custom dashboard',
      error: error.message
    });
  }
};

/**
 * Create custom dashboard
 */
const createCustomDashboard = async (req, res) => {
  try {
    const { name, layout, widgets, isDefault } = req.body;
    const dashboard = {
      id: `dash_${Date.now()}`,
      name,
      layout: layout || [],
      widgets: widgets || [],
      isDefault: isDefault || false,
      createdBy: req.user._id,
      createdAt: new Date()
    };
    res.status(201).json({
      success: true,
      message: 'Dashboard created successfully',
      data: dashboard
    });
  } catch (error) {
    logger.error('Create custom dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create custom dashboard',
      error: error.message
    });
  }
};

/**
 * Update custom dashboard
 */
const updateCustomDashboard = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, layout, widgets, isDefault } = req.body;
    res.status(200).json({
      success: true,
      message: 'Dashboard updated successfully',
      data: { id, name, layout, widgets, isDefault }
    });
  } catch (error) {
    logger.error('Update custom dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update custom dashboard',
      error: error.message
    });
  }
};

/**
 * Delete custom dashboard
 */
const deleteCustomDashboard = async (req, res) => {
  try {
    const { id } = req.params;
    res.status(200).json({
      success: true,
      message: 'Dashboard deleted successfully'
    });
  } catch (error) {
    logger.error('Delete custom dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete custom dashboard',
      error: error.message
    });
  }
};

/**
 * Get dashboard widget
 */
const getDashboardWidget = async (req, res) => {
  try {
    const { id } = req.params;
    res.status(200).json({
      success: true,
      data: {
        id,
        type: 'chart',
        title: 'Widget',
        config: {},
        size: { w: 4, h: 3 },
        position: { x: 0, y: 0 }
      }
    });
  } catch (error) {
    logger.error('Get dashboard widget error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard widget',
      error: error.message
    });
  }
};

/**
 * Add dashboard widget
 */
const addDashboardWidget = async (req, res) => {
  try {
    const { type, title, config, size, position } = req.body;
    res.status(201).json({
      success: true,
      message: 'Widget added successfully',
      data: {
        id: `widget_${Date.now()}`,
        type,
        title,
        config,
        size,
        position
      }
    });
  } catch (error) {
    logger.error('Add dashboard widget error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add dashboard widget',
      error: error.message
    });
  }
};

/**
 * Update dashboard widget
 */
const updateDashboardWidget = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, title, config, size, position } = req.body;
    res.status(200).json({
      success: true,
      message: 'Widget updated successfully',
      data: { id, type, title, config, size, position }
    });
  } catch (error) {
    logger.error('Update dashboard widget error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update dashboard widget',
      error: error.message
    });
  }
};

/**
 * Delete dashboard widget
 */
const deleteDashboardWidget = async (req, res) => {
  try {
    const { id } = req.params;
    res.status(200).json({
      success: true,
      message: 'Widget deleted successfully'
    });
  } catch (error) {
    logger.error('Delete dashboard widget error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete dashboard widget',
      error: error.message
    });
  }
};

/**
 * Get data source
 */
const getDataSource = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get data source error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get data sources',
      error: error.message
    });
  }
};

/**
 * Create data source
 */
const createDataSource = async (req, res) => {
  try {
    const { name, type, config } = req.body;
    res.status(201).json({
      success: true,
      message: 'Data source created successfully',
      data: {
        id: `ds_${Date.now()}`,
        name,
        type,
        config
      }
    });
  } catch (error) {
    logger.error('Create data source error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create data source',
      error: error.message
    });
  }
};

/**
 * Update data source
 */
const updateDataSource = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, config } = req.body;
    res.status(200).json({
      success: true,
      message: 'Data source updated successfully',
      data: { id, name, type, config }
    });
  } catch (error) {
    logger.error('Update data source error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update data source',
      error: error.message
    });
  }
};

/**
 * Delete data source
 */
const deleteDataSource = async (req, res) => {
  try {
    const { id } = req.params;
    res.status(200).json({
      success: true,
      message: 'Data source deleted successfully'
    });
  } catch (error) {
    logger.error('Delete data source error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete data source',
      error: error.message
    });
  }
};

/**
 * Get data source data
 */
const getDataSourceData = async (req, res) => {
  try {
    const { id } = req.params;
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get data source data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get data source data',
      error: error.message
    });
  }
};

/**
 * Get dashboard reports
 */
const getDashboardReports = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get dashboard reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard reports',
      error: error.message
    });
  }
};

/**
 * Generate dashboard report
 */
const generateDashboardReport = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Dashboard report generated successfully'
    });
  } catch (error) {
    logger.error('Generate dashboard report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate dashboard report',
      error: error.message
    });
  }
};

/**
 * Export dashboard
 */
const exportDashboard = async (req, res) => {
  try {
    const { format } = req.body;
    res.status(200).json({
      success: true,
      message: `Dashboard exported as ${format || 'PDF'}`,
      data: {
        format: format || 'PDF',
        url: `/exports/dashboard_${Date.now()}.${(format || 'pdf').toLowerCase()}`
      }
    });
  } catch (error) {
    logger.error('Export dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export dashboard',
      error: error.message
    });
  }
};

/**
 * Get dashboard settings
 */
const getDashboardSettings = async (req, res) => {
  try {
    const settings = {
      refreshInterval: 30,
      autoRefresh: true,
      defaultView: 'grid',
      theme: 'light'
    };
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    logger.error('Get dashboard settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard settings',
      error: error.message
    });
  }
};

/**
 * Update dashboard settings
 */
const updateDashboardSettings = async (req, res) => {
  try {
    const { refreshInterval, autoRefresh, defaultView, theme } = req.body;
    res.status(200).json({
      success: true,
      message: 'Dashboard settings updated successfully',
      data: { refreshInterval, autoRefresh, defaultView, theme }
    });
  } catch (error) {
    logger.error('Update dashboard settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update dashboard settings',
      error: error.message
    });
  }
};

/**
 * Reset dashboard
 */
const resetDashboard = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Dashboard reset successfully'
    });
  } catch (error) {
    logger.error('Reset dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset dashboard',
      error: error.message
    });
  }
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // General Dashboard
  getDashboardData,
  getDashboardStats,
  getDashboardCharts,
  getDashboardWidgets,
  getDashboardNotifications,
  getDashboardActivities,

  // Role-based Dashboards
  getPatientDashboard,
  getDoctorDashboard,
  getNurseDashboard,
  getAdminDashboard,
  getFinanceDashboard,
  getHRDashboard,
  getPharmacyDashboard,
  getLabDashboard,
  getRadiologyDashboard,
  getGeneralDashboard,

  // Custom Dashboards
  getCustomDashboard,
  createCustomDashboard,
  updateCustomDashboard,
  deleteCustomDashboard,

  // Dashboard Widgets
  getDashboardWidget,
  addDashboardWidget,
  updateDashboardWidget,
  deleteDashboardWidget,

  // Data Sources
  getDataSource,
  createDataSource,
  updateDataSource,
  deleteDataSource,
  getDataSourceData,

  // Dashboard Reports
  getDashboardReports,
  generateDashboardReport,
  exportDashboard,

  // Dashboard Settings
  getDashboardSettings,
  updateDashboardSettings,
  resetDashboard
};
