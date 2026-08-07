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
    Employee.countDocuments({ status: 'On Leave' }),
    LeaveRequest.countDocuments({ status: 'Pending' }),
    Employee.countDocuments({
      startDate: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) }
    }),
    // Activities placeholder
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
  // Placeholder - would get pharmacy specific data
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
  // Placeholder - would get lab specific data
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
  // Placeholder - would get radiology specific data
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
  // Return widget data based on user role
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
  // Placeholder - would get notifications
  return [];
};

/**
 * Get activities
 */
const getActivities = async (user) => {
  // Placeholder - would get activities
  return [];
};

module.exports = {
  getDashboardData,
  getDashboardStats,
  getDashboardCharts,
  getDashboardWidgets,
  getDashboardNotifications,
  getDashboardActivities,
  // Role-specific dashboards
  getPatientDashboard,
  getDoctorDashboard,
  getNurseDashboard,
  getAdminDashboard,
  getFinanceDashboard,
  getHRDashboard,
  getPharmacyDashboard,
  getLabDashboard,
  getRadiologyDashboard,
  getGeneralDashboard
};
