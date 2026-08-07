/**
 * ============================================
 * ANALYTICS.CONTROLLER.JS - Analytics Controller
 * ============================================
 */

const Analytics = require('../models/Analytics');
const CustomQuery = require('../models/CustomQuery');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Bill = require('../models/Bill');
const User = require('../models/User');
const Department = require('../models/Department');
const { validationResult } = require('express-validator');
const { logger } = require('../config/logger');

/**
 * Get dashboard analytics
 */
const getDashboardAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalPatients,
      totalDoctors,
      totalAppointments,
      totalRevenue,
      todayAppointments,
      todayRevenue,
      weeklyAppointments,
      weeklyRevenue,
      monthlyAppointments,
      monthlyRevenue,
      yearlyAppointments,
      yearlyRevenue,
      departments
    ] = await Promise.all([
      Patient.countDocuments(),
      User.countDocuments({ role: 'doctor' }),
      Appointment.countDocuments(),
      Bill.aggregate([{ $group: { _id: null, total: { $sum: '$amountPaid' } } }]),
      Appointment.countDocuments({ date: { $gte: startOfDay } }),
      Bill.aggregate([
        { $match: { paymentDate: { $gte: startOfDay } } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } }
      ]),
      Appointment.countDocuments({ date: { $gte: startOfWeek } }),
      Bill.aggregate([
        { $match: { paymentDate: { $gte: startOfWeek } } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } }
      ]),
      Appointment.countDocuments({ date: { $gte: startOfMonth } }),
      Bill.aggregate([
        { $match: { paymentDate: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } }
      ]),
      Appointment.countDocuments({ date: { $gte: startOfYear } }),
      Bill.aggregate([
        { $match: { paymentDate: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } }
      ]),
      Department.find().select('name')
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalPatients,
          totalDoctors: totalDoctors || 0,
          totalAppointments,
          totalRevenue: totalRevenue[0]?.total || 0,
          departments: departments.length
        },
        period: {
          today: {
            appointments: todayAppointments,
            revenue: todayRevenue[0]?.total || 0
          },
          week: {
            appointments: weeklyAppointments,
            revenue: weeklyRevenue[0]?.total || 0
          },
          month: {
            appointments: monthlyAppointments,
            revenue: monthlyRevenue[0]?.total || 0
          },
          year: {
            appointments: yearlyAppointments,
            revenue: yearlyRevenue[0]?.total || 0
          }
        }
      }
    });
  } catch (error) {
    logger.error('Get dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard analytics',
      error: error.message
    });
  }
};

/**
 * Get system overview
 */
const getSystemOverview = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalPatients,
      totalDoctors,
      totalNurses,
      totalDepartments,
      totalAppointments,
      totalBills,
      totalRevenue,
      totalExpenses
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Patient.countDocuments(),
      User.countDocuments({ role: 'doctor' }),
      User.countDocuments({ role: 'nurse' }),
      Department.countDocuments(),
      Appointment.countDocuments(),
      Bill.countDocuments(),
      Bill.aggregate([{ $group: { _id: null, total: { $sum: '$amountPaid' } } }]),
      Bill.aggregate([
        { $match: { status: 'Paid' } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } }
      ])
    ]);

    const revenue = totalRevenue[0]?.total || 0;
    const expenses = totalExpenses[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers
        },
        staff: {
          doctors: totalDoctors || 0,
          nurses: totalNurses || 0,
          total: (totalDoctors || 0) + (totalNurses || 0)
        },
        patients: {
          total: totalPatients
        },
        departments: {
          total: totalDepartments
        },
        appointments: {
          total: totalAppointments
        },
        financial: {
          totalBills,
          revenue,
          expenses,
          profit: revenue - expenses
        }
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
 * Get key metrics
 */
const getKeyMetrics = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      patientSatisfaction,
      avgWaitTime,
      bedOccupancy,
      appointmentFillRate,
      revenueGrowth,
      patientGrowth
    ] = await Promise.all([
      // Patient satisfaction (placeholder)
      4.5,
      // Average wait time (placeholder)
      15,
      // Bed occupancy (placeholder)
      75,
      // Appointment fill rate (placeholder)
      92,
      // Revenue growth (placeholder)
      12.5,
      // Patient growth (placeholder)
      8.3
    ]);

    res.status(200).json({
      success: true,
      data: {
        patientSatisfaction,
        avgWaitTime,
        bedOccupancy,
        appointmentFillRate,
        revenueGrowth,
        patientGrowth
      }
    });
  } catch (error) {
    logger.error('Get key metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get key metrics',
      error: error.message
    });
  }
};

/**
 * Get patient analytics
 */
const getPatientAnalytics = async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    const startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'quarter') {
      startDate.setMonth(startDate.getMonth() - 3);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const [
      totalPatients,
      activePatients,
      newPatients,
      returningPatients,
      byDepartment,
      byGender,
      byAgeGroup
    ] = await Promise.all([
      Patient.countDocuments(),
      Patient.countDocuments({ status: 'Active' }),
      Patient.countDocuments({ createdAt: { $gte: startDate } }),
      Patient.countDocuments({ 
        createdAt: { $lt: startDate },
        status: 'Active'
      }),
      Patient.aggregate([
        { $group: { _id: '$assignedDoctor', count: { $sum: 1 } } }
      ]),
      Patient.aggregate([
        { $group: { _id: '$gender', count: { $sum: 1 } } }
      ]),
      Patient.aggregate([
        { 
          $project: {
            ageGroup: {
              $switch: {
                branches: [
                  { case: { $lt: ['$age', 18] }, then: '0-17' },
                  { case: { $lt: ['$age', 30] }, then: '18-29' },
                  { case: { $lt: ['$age', 45] }, then: '30-44' },
                  { case: { $lt: ['$age', 60] }, then: '45-59' },
                ],
                default: '60+'
              }
            }
          }
        },
        { $group: { _id: '$ageGroup', count: { $sum: 1 } } }
      ])
    ]);

    // Get patient trends (placeholder)
    const trends = [];

    res.status(200).json({
      success: true,
      data: {
        summary: {
          total: totalPatients,
          active: activePatients,
          new: newPatients,
          returning: returningPatients
        },
        demographics: {
          byDepartment: byDepartment || [],
          byGender: byGender || [],
          byAgeGroup: byAgeGroup || []
        },
        trends
      }
    });
  } catch (error) {
    logger.error('Get patient analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get patient analytics',
      error: error.message
    });
  }
};

/**
 * Get patient demographics
 */
const getPatientDemographics = async (req, res) => {
  try {
    const [
      byGender,
      byAgeGroup,
      byDepartment,
      byStatus,
      byBloodType
    ] = await Promise.all([
      Patient.aggregate([
        { $group: { _id: '$gender', count: { $sum: 1 } } }
      ]),
      Patient.aggregate([
        {
          $project: {
            ageGroup: {
              $switch: {
                branches: [
                  { case: { $lt: ['$age', 18] }, then: '0-17' },
                  { case: { $lt: ['$age', 30] }, then: '18-29' },
                  { case: { $lt: ['$age', 45] }, then: '30-44' },
                  { case: { $lt: ['$age', 60] }, then: '45-59' },
                ],
                default: '60+'
              }
            }
          }
        },
        { $group: { _id: '$ageGroup', count: { $sum: 1 } } }
      ]),
      Patient.aggregate([
        { $group: { _id: '$assignedDoctor', count: { $sum: 1 } } }
      ]),
      Patient.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Patient.aggregate([
        { $group: { _id: '$bloodType', count: { $sum: 1 } } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        byGender: byGender || [],
        byAgeGroup: byAgeGroup || [],
        byDepartment: byDepartment || [],
        byStatus: byStatus || [],
        byBloodType: byBloodType || []
      }
    });
  } catch (error) {
    logger.error('Get patient demographics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get patient demographics',
      error: error.message
    });
  }
};

/**
 * Get patient trends
 */
const getPatientTrends = async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    // Generate trend data (placeholder)
    const trends = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (const month of months) {
      trends.push({
        period: month,
        newPatients: Math.floor(Math.random() * 100) + 50,
        returningPatients: Math.floor(Math.random() * 200) + 100
      });
    }

    res.status(200).json({
      success: true,
      data: trends
    });
  } catch (error) {
    logger.error('Get patient trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get patient trends',
      error: error.message
    });
  }
};

/**
 * Get patient satisfaction
 */
const getPatientSatisfaction = async (req, res) => {
  try {
    // Placeholder - would get from survey data
    const satisfaction = {
      overall: 4.5,
      byDepartment: [
        { department: 'Cardiology', rating: 4.8 },
        { department: 'Neurology', rating: 4.6 },
        { department: 'Orthopedics', rating: 4.4 },
        { department: 'Pediatrics', rating: 4.7 },
        { department: 'Emergency', rating: 4.2 }
      ],
      byCategory: {
        communication: 4.6,
        care: 4.7,
        environment: 4.3,
        waiting: 3.8,
        billing: 4.1
      },
      trends: []
    };

    res.status(200).json({
      success: true,
      data: satisfaction
    });
  } catch (error) {
    logger.error('Get patient satisfaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get patient satisfaction',
      error: error.message
    });
  }
};

/**
 * Get patient retention
 */
const getPatientRetention = async (req, res) => {
  try {
    // Placeholder - would calculate retention rate
    const retention = {
      overall: 78,
      byDepartment: [
        { department: 'Cardiology', rate: 85 },
        { department: 'Neurology', rate: 82 },
        { department: 'Orthopedics', rate: 76 },
        { department: 'Pediatrics', rate: 80 },
        { department: 'Emergency', rate: 68 }
      ],
      trends: []
    };

    res.status(200).json({
      success: true,
      data: retention
    });
  } catch (error) {
    logger.error('Get patient retention error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get patient retention',
      error: error.message
    });
  }
};

/**
 * Get financial analytics
 */
const getFinancialAnalytics = async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    const startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'quarter') {
      startDate.setMonth(startDate.getMonth() - 3);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const [
      totalRevenue,
      totalExpenses,
      netProfit,
      pendingPayments,
      overduePayments,
      byDepartment,
      byPaymentMethod
    ] = await Promise.all([
      Bill.aggregate([
        { $match: { status: 'Paid' } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } }
      ]),
      Bill.aggregate([
        { $group: { _id: null, total: { $sum: '$amountPaid' } } }
      ]),
      Bill.aggregate([
        { $group: { _id: null, profit: { $sum: { $subtract: ['$amountPaid', '$amountDue'] } } } }
      ]),
      Bill.aggregate([
        { $match: { status: 'Pending' } },
        { $group: { _id: null, total: { $sum: '$amountDue' } } }
      ]),
      Bill.aggregate([
        { $match: { status: 'Overdue' } },
        { $group: { _id: null, total: { $sum: '$amountDue' } } }
      ]),
      Bill.aggregate([
        { $group: { _id: '$billingType', total: { $sum: '$amountPaid' } } }
      ]),
      Bill.aggregate([
        { $group: { _id: '$paymentMethod', total: { $sum: '$amountPaid' } } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          revenue: totalRevenue[0]?.total || 0,
          expenses: totalExpenses[0]?.total || 0,
          profit: netProfit[0]?.profit || 0,
          pending: pendingPayments[0]?.total || 0,
          overdue: overduePayments[0]?.total || 0
        },
        breakdown: {
          byDepartment: byDepartment || [],
          byPaymentMethod: byPaymentMethod || []
        }
      }
    });
  } catch (error) {
    logger.error('Get financial analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get financial analytics',
      error: error.message
    });
  }
};

/**
 * Get revenue analytics
 */
const getRevenueAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(date);
    }

    const revenueData = await Promise.all(months.map(async (date) => {
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);

      const revenue = await Bill.aggregate([
        { $match: { paymentDate: { $gte: start, $lt: end }, status: 'Paid' } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } }
      ]);

      const patients = await Patient.countDocuments({
        createdAt: { $gte: start, $lt: end }
      });

      return {
        month: date.toLocaleString('default', { month: 'short' }),
        year: date.getFullYear(),
        revenue: revenue[0]?.total || 0,
        patients: patients,
        averagePerPatient: patients > 0 ? (revenue[0]?.total || 0) / patients : 0
      };
    }));

    res.status(200).json({
      success: true,
      data: revenueData
    });
  } catch (error) {
    logger.error('Get revenue analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get revenue analytics',
      error: error.message
    });
  }
};

/**
 * Get expense analytics
 */
const getExpenseAnalytics = async (req, res) => {
  try {
    // Placeholder - would get expense data
    const expenses = {
      total: 5600000,
      byCategory: [
        { category: 'Salaries', amount: 3200000, percentage: 57 },
        { category: 'Medical Supplies', amount: 1200000, percentage: 21 },
        { category: 'Utilities', amount: 400000, percentage: 7 },
        { category: 'Maintenance', amount: 350000, percentage: 6 },
        { category: 'Administrative', amount: 450000, percentage: 8 }
      ],
      trends: []
    };

    res.status(200).json({
      success: true,
      data: expenses
    });
  } catch (error) {
    logger.error('Get expense analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get expense analytics',
      error: error.message
    });
  }
};

/**
 * Get profitability analytics
 */
const getProfitabilityAnalytics = async (req, res) => {
  try {
    // Placeholder - would calculate profitability
    const profitability = {
      overall: {
        revenue: 8200000,
        expenses: 5600000,
        profit: 2600000,
        margin: 31.7
      },
      byDepartment: [
        { department: 'Cardiology', revenue: 2400000, expenses: 1500000, profit: 900000 },
        { department: 'Neurology', revenue: 2000000, expenses: 1300000, profit: 700000 },
        { department: 'Orthopedics', revenue: 1600000, expenses: 1100000, profit: 500000 },
        { department: 'ICU', revenue: 1200000, expenses: 900000, profit: 300000 },
        { department: 'Other', revenue: 1000000, expenses: 800000, profit: 200000 }
      ],
      trends: []
    };

    res.status(200).json({
      success: true,
      data: profitability
    });
  } catch (error) {
    logger.error('Get profitability analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profitability analytics',
      error: error.message
    });
  }
};

/**
 * Get payment analytics
 */
const getPaymentAnalytics = async (req, res) => {
  try {
    const [
      byMethod,
      byStatus,
      averageAmount,
      totalPayments,
      totalAmount
    ] = await Promise.all([
      Bill.aggregate([
        { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$amountPaid' } } }
      ]),
      Bill.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Bill.aggregate([
        { $group: { _id: null, avg: { $avg: '$amountPaid' } } }
      ]),
      Bill.countDocuments(),
      Bill.aggregate([{ $group: { _id: null, total: { $sum: '$amountPaid' } } }])
    ]);

    res.status(200).json({
      success: true,
      data: {
        byMethod: byMethod || [],
        byStatus: byStatus || [],
        averageAmount: averageAmount[0]?.avg || 0,
        totalPayments,
        totalAmount: totalAmount[0]?.total || 0
      }
    });
  } catch (error) {
    logger.error('Get payment analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment analytics',
      error: error.message
    });
  }
};

/**
 * Get operational analytics
 */
const getOperationalAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      noShowAppointments,
      averageWaitTime,
      averageConsultationTime,
      bedOccupancy,
      emergencyCases
    ] = await Promise.all([
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'Completed' }),
      Appointment.countDocuments({ status: 'Cancelled' }),
      Appointment.countDocuments({ status: 'No-Show' }),
      15, // Placeholder
      30, // Placeholder
      75, // Placeholder
      Appointment.countDocuments({ priority: 'Emergency' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        appointments: {
          total: totalAppointments,
          completed: completedAppointments,
          cancelled: cancelledAppointments,
          noShow: noShowAppointments,
          completionRate: totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0
        },
        efficiency: {
          averageWaitTime,
          averageConsultationTime,
          bedOccupancy
        },
        emergency: {
          cases: emergencyCases,
          responseTime: 8 // Placeholder
        }
      }
    });
  } catch (error) {
    logger.error('Get operational analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get operational analytics',
      error: error.message
    });
  }
};

/**
 * Get appointment analytics
 */
const getAppointmentAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(date);
    }

    const appointmentData = await Promise.all(months.map(async (date) => {
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);

      const total = await Appointment.countDocuments({ date: { $gte: start, $lt: end } });
      const completed = await Appointment.countDocuments({
        date: { $gte: start, $lt: end },
        status: 'Completed'
      });

      return {
        month: date.toLocaleString('default', { month: 'short' }),
        year: date.getFullYear(),
        total,
        completed,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    }));

    res.status(200).json({
      success: true,
      data: appointmentData
    });
  } catch (error) {
    logger.error('Get appointment analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointment analytics',
      error: error.message
    });
  }
};

/**
 * Get wait time analytics
 */
const getWaitTimeAnalytics = async (req, res) => {
  try {
    // Placeholder - would get actual wait time data
    const waitTimes = {
      average: 15,
      byDepartment: [
        { department: 'Cardiology', waitTime: 12 },
        { department: 'Neurology', waitTime: 18 },
        { department: 'Orthopedics', waitTime: 14 },
        { department: 'Pediatrics', waitTime: 10 },
        { department: 'Emergency', waitTime: 25 }
      ],
      trends: []
    };

    res.status(200).json({
      success: true,
      data: waitTimes
    });
  } catch (error) {
    logger.error('Get wait time analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wait time analytics',
      error: error.message
    });
  }
};

/**
 * Get occupancy analytics
 */
const getOccupancyAnalytics = async (req, res) => {
  try {
    // Placeholder - would get actual occupancy data
    const occupancy = {
      overall: 75,
      byWard: [
        { ward: 'Ward 2A', occupancy: 83 },
        { ward: 'Ward 3B', occupancy: 70 },
        { ward: 'ICU', occupancy: 75 },
        { ward: 'Ward 4C', occupancy: 80 },
        { ward: 'Ward 5D', occupancy: 62 }
      ],
      trends: []
    };

    res.status(200).json({
      success: true,
      data: occupancy
    });
  } catch (error) {
    logger.error('Get occupancy analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get occupancy analytics',
      error: error.message
    });
  }
};

/**
 * Get resource utilization
 */
const getResourceUtilization = async (req, res) => {
  try {
    // Placeholder - would get actual resource utilization
    const utilization = {
      beds: {
        total: 120,
        occupied: 90,
        utilization: 75
      },
      operatingTheatres: {
        total: 5,
        utilized: 4,
        utilization: 80
      },
      equipment: {
        total: 45,
        inUse: 32,
        utilization: 71
      }
    };

    res.status(200).json({
      success: true,
      data: utilization
    });
  } catch (error) {
    logger.error('Get resource utilization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get resource utilization',
      error: error.message
    });
  }
};

/**
 * Get clinical analytics
 */
const getClinicalAnalytics = async (req, res) => {
  try {
    // Placeholder - would get clinical data
    const clinical = {
      topDiagnoses: [
        { diagnosis: 'Hypertension', count: 245 },
        { diagnosis: 'Diabetes Type 2', count: 189 },
        { diagnosis: 'Coronary Artery Disease', count: 156 },
        { diagnosis: 'Asthma', count: 134 },
        { diagnosis: 'Arthritis', count: 112 }
      ],
      topMedications: [
        { medication: 'Lisinopril', count: 178 },
        { medication: 'Metformin', count: 156 },
        { medication: 'Atorvastatin', count: 134 },
        { medication: 'Amoxicillin', count: 112 },
        { medication: 'Albuterol', count: 98 }
      ],
      treatmentOutcomes: {
        successful: 92,
        partial: 6,
        unsuccessful: 2
      }
    };

    res.status(200).json({
      success: true,
      data: clinical
    });
  } catch (error) {
    logger.error('Get clinical analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get clinical analytics',
      error: error.message
    });
  }
};

/**
 * Get diagnosis analytics
 */
const getDiagnosisAnalytics = async (req, res) => {
  try {
    // Placeholder - would get diagnosis data
    const diagnoses = {
      top: [
        { diagnosis: 'Hypertension', count: 245 },
        { diagnosis: 'Diabetes Type 2', count: 189 },
        { diagnosis: 'Coronary Artery Disease', count: 156 },
        { diagnosis: 'Asthma', count: 134 },
        { diagnosis: 'Arthritis', count: 112 }
      ],
      byDepartment: [
        { department: 'Cardiology', diagnoses: ['Hypertension', 'CAD'] },
        { department: 'Neurology', diagnoses: ['Stroke', 'Epilepsy'] },
        { department: 'Orthopedics', diagnoses: ['Arthritis', 'Fracture'] },
        { department: 'Pediatrics', diagnoses: ['Asthma', 'Infections'] }
      ],
      trends: []
    };

    res.status(200).json({
      success: true,
      data: diagnoses
    });
  } catch (error) {
    logger.error('Get diagnosis analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get diagnosis analytics',
      error: error.message
    });
  }
};

/**
 * Get treatment analytics
 */
const getTreatmentAnalytics = async (req, res) => {
  try {
    // Placeholder - would get treatment data
    const treatments = {
      top: [
        { treatment: 'Medication', count: 856 },
        { treatment: 'Surgery', count: 234 },
        { treatment: 'Physical Therapy', count: 189 },
        { treatment: 'Diagnostic Tests', count: 567 },
        { treatment: 'Emergency Care', count: 345 }
      ],
      outcomes: {
        successful: 92,
        partial: 6,
        unsuccessful: 2
      },
      trends: []
    };

    res.status(200).json({
      success: true,
      data: treatments
    });
  } catch (error) {
    logger.error('Get treatment analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get treatment analytics',
      error: error.message
    });
  }
};

/**
 * Get outcome analytics
 */
const getOutcomeAnalytics = async (req, res) => {
  try {
    // Placeholder - would get outcome data
    const outcomes = {
      overall: {
        successful: 92,
        partial: 6,
        unsuccessful: 2
      },
      byDepartment: [
        { department: 'Cardiology', successful: 94, partial: 4, unsuccessful: 2 },
        { department: 'Neurology', successful: 90, partial: 7, unsuccessful: 3 },
        { department: 'Orthopedics', successful: 95, partial: 3, unsuccessful: 2 },
        { department: 'Pediatrics', successful: 96, partial: 3, unsuccessful: 1 },
        { department: 'Emergency', successful: 88, partial: 8, unsuccessful: 4 }
      ],
      trends: []
    };

    res.status(200).json({
      success: true,
      data: outcomes
    });
  } catch (error) {
    logger.error('Get outcome analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get outcome analytics',
      error: error.message
    });
  }
};

/**
 * Get medication analytics
 */
const getMedicationAnalytics = async (req, res) => {
  try {
    // Placeholder - would get medication data
    const medications = {
      top: [
        { medication: 'Lisinopril', count: 178 },
        { medication: 'Metformin', count: 156 },
        { medication: 'Atorvastatin', count: 134 },
        { medication: 'Amoxicillin', count: 112 },
        { medication: 'Albuterol', count: 98 }
      ],
      byCategory: [
        { category: 'Antihypertensive', count: 245 },
        { category: 'Antidiabetic', count: 189 },
        { category: 'Antibiotics', count: 167 },
        { category: 'Statins', count: 134 },
        { category: 'Respiratory', count: 98 }
      ],
      trends: []
    };

    res.status(200).json({
      success: true,
      data: medications
    });
  } catch (error) {
    logger.error('Get medication analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get medication analytics',
      error: error.message
    });
  }
};

/**
 * Get staff analytics
 */
const getStaffAnalytics = async (req, res) => {
  try {
    const [
      totalStaff,
      doctors,
      nurses,
      adminStaff,
      supportStaff,
      byDepartment
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'doctor' }),
      User.countDocuments({ role: 'nurse' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'staff' }),
      User.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          total: totalStaff,
          doctors: doctors || 0,
          nurses: nurses || 0,
          admin: adminStaff || 0,
          support: supportStaff || 0
        },
        byDepartment: byDepartment || [],
        productivity: {
          patientsPerDoctor: 80,
          appointmentsPerDoctor: 60,
          satisfactionRate: 4.5
        }
      }
    });
  } catch (error) {
    logger.error('Get staff analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get staff analytics',
      error: error.message
    });
  }
};

/**
 * Get staff performance
 */
const getStaffPerformance = async (req, res) => {
  try {
    // Placeholder - would get performance data
    const performance = {
      topPerformers: [
        { name: 'Dr. Samuel Tekle', score: 4.8 },
        { name: 'Nurse Meseret Hailu', score: 4.7 },
        { name: 'Dr. Sara Hailu', score: 4.6 },
        { name: 'Dr. Daniel Assefa', score: 4.5 },
        { name: 'Nurse Sara Tesfaye', score: 4.4 }
      ],
      byDepartment: [
        { department: 'Cardiology', average: 4.6 },
        { department: 'Neurology', average: 4.4 },
        { department: 'Orthopedics', average: 4.5 },
        { department: 'Pediatrics', average: 4.7 },
        { department: 'Emergency', average: 4.2 }
      ],
      trends: []
    };

    res.status(200).json({
      success: true,
      data: performance
    });
  } catch (error) {
    logger.error('Get staff performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get staff performance',
      error: error.message
    });
  }
};

/**
 * Get staff productivity
 */
const getStaffProductivity = async (req, res) => {
  try {
    // Placeholder - would get productivity data
    const productivity = {
      overall: {
        patientsPerDoctor: 80,
        appointmentsPerDoctor: 60,
        patientSatisfaction: 4.5,
        averageResponseTime: 15
      },
      byDepartment: [
        { department: 'Cardiology', patientsPerDoctor: 85, appointmentsPerDoctor: 65 },
        { department: 'Neurology', patientsPerDoctor: 75, appointmentsPerDoctor: 55 },
        { department: 'Orthopedics', patientsPerDoctor: 80, appointmentsPerDoctor: 60 },
        { department: 'Pediatrics', patientsPerDoctor: 90, appointmentsPerDoctor: 70 },
        { department: 'Emergency', patientsPerDoctor: 70, appointmentsPerDoctor: 50 }
      ],
      trends: []
    };

    res.status(200).json({
      success: true,
      data: productivity
    });
  } catch (error) {
    logger.error('Get staff productivity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get staff productivity',
      error: error.message
    });
  }
};

/**
 * Get staff turnover
 */
const getStaffTurnover = async (req, res) => {
  try {
    // Placeholder - would get turnover data
    const turnover = {
      overall: 12.5,
      byDepartment: [
        { department: 'Cardiology', rate: 8 },
        { department: 'Neurology', rate: 10 },
        { department: 'Orthopedics', rate: 9 },
        { department: 'Pediatrics', rate: 7 },
        { department: 'Emergency', rate: 18 }
      ],
      trends: []
    };

    res.status(200).json({
      success: true,
      data: turnover
    });
  } catch (error) {
    logger.error('Get staff turnover error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get staff turnover',
      error: error.message
    });
  }
};

/**
 * Get department analytics
 */
const getDepartmentAnalytics = async (req, res) => {
  try {
    const departments = await Department.find();

    const departmentData = await Promise.all(departments.map(async (dept) => {
      const doctors = await User.countDocuments({ department: dept._id, role: 'doctor' });
      const patients = await Patient.countDocuments({ assignedDoctor: { $exists: true } });
      const appointments = await Appointment.countDocuments({ department: dept._id });

      return {
        department: dept.name,
        doctors,
        patients,
        appointments,
        utilization: 75 // Placeholder
      };
    }));

    res.status(200).json({
      success: true,
      data: departmentData
    });
  } catch (error) {
    logger.error('Get department analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get department analytics',
      error: error.message
    });
  }
};

/**
 * Get department performance
 */
const getDepartmentPerformance = async (req, res) => {
  try {
    // Placeholder - would get performance data
    const performance = [
      { department: 'Cardiology', rating: 4.6, patients: 2450, revenue: 2400000 },
      { department: 'Neurology', rating: 4.4, patients: 1820, revenue: 2000000 },
      { department: 'Orthopedics', rating: 4.5, patients: 1560, revenue: 1600000 },
      { department: 'Pediatrics', rating: 4.7, patients: 1340, revenue: 1200000 },
      { department: 'Emergency', rating: 4.2, patients: 1890, revenue: 1000000 }
    ];

    res.status(200).json({
      success: true,
      data: performance
    });
  } catch (error) {
    logger.error('Get department performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get department performance',
      error: error.message
    });
  }
};

/**
 * Get department comparison
 */
const getDepartmentComparison = async (req, res) => {
  try {
    // Placeholder - would get comparison data
    const comparison = {
      metrics: ['patients', 'revenue', 'satisfaction', 'waitTime'],
      departments: [
        { name: 'Cardiology', patients: 2450, revenue: 2400000, satisfaction: 4.6, waitTime: 12 },
        { name: 'Neurology', patients: 1820, revenue: 2000000, satisfaction: 4.4, waitTime: 18 },
        { name: 'Orthopedics', patients: 1560, revenue: 1600000, satisfaction: 4.5, waitTime: 14 },
        { name: 'Pediatrics', patients: 1340, revenue: 1200000, satisfaction: 4.7, waitTime: 10 },
        { name: 'Emergency', patients: 1890, revenue: 1000000, satisfaction: 4.2, waitTime: 25 }
      ]
    };

    res.status(200).json({
      success: true,
      data: comparison
    });
  } catch (error) {
    logger.error('Get department comparison error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get department comparison',
      error: error.message
    });
  }
};

/**
 * Create custom query
 */
const createCustomQuery = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { name, description, query, type } = req.body;

    const customQuery = new CustomQuery({
      name,
      description,
      query,
      type: type || 'General',
      createdBy: req.user._id
    });

    await customQuery.save();

    logger.info(`Custom query created: ${customQuery.name}`);

    res.status(201).json({
      success: true,
      message: 'Custom query created successfully',
      data: customQuery
    });
  } catch (error) {
    logger.error('Create custom query error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create custom query',
      error: error.message
    });
  }
};

/**
 * Get custom queries
 */
const getCustomQuery = async (req, res) => {
  try {
    const queries = await CustomQuery.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: queries
    });
  } catch (error) {
    logger.error('Get custom queries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get custom queries',
      error: error.message
    });
  }
};

/**
 * Update custom query
 */
const updateCustomQuery = async (req, res) => {
  try {
    const query = await CustomQuery.findById(req.params.id);
    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Custom query not found'
      });
    }

    const { name, description, query: queryData, type } = req.body;

    if (name) query.name = name;
    if (description) query.description = description;
    if (queryData) query.query = queryData;
    if (type) query.type = type;

    await query.save();

    logger.info(`Custom query updated: ${query.name}`);

    res.status(200).json({
      success: true,
      message: 'Custom query updated successfully',
      data: query
    });
  } catch (error) {
    logger.error('Update custom query error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update custom query',
      error: error.message
    });
  }
};

/**
 * Delete custom query
 */
const deleteCustomQuery = async (req, res) => {
  try {
    const query = await CustomQuery.findById(req.params.id);
    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Custom query not found'
      });
    }

    await query.remove();

    logger.info(`Custom query deleted: ${query.name}`);

    res.status(200).json({
      success: true,
      message: 'Custom query deleted successfully'
    });
  } catch (error) {
    logger.error('Delete custom query error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete custom query',
      error: error.message
    });
  }
};

/**
 * Execute custom query
 */
const executeCustomQuery = async (req, res) => {
  try {
    const query = await CustomQuery.findById(req.params.id);
    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Custom query not found'
      });
    }

    // Execute query logic based on query definition
    // Placeholder - would execute actual query
    const result = {
      queryId: query._id,
      name: query.name,
      executedAt: new Date(),
      data: []
    };

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Execute custom query error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute custom query',
      error: error.message
    });
  }
};

/**
 * Export analytics
 */
const exportAnalytics = async (req, res) => {
  try {
    const { type, format } = req.body;

    // Generate export based on type
    // Placeholder - would generate actual export
    const exportData = {
      type,
      format: format || 'CSV',
      generatedAt: new Date(),
      url: `/exports/analytics-${type}-${Date.now()}.${(format || 'csv').toLowerCase()}`
    };

    res.status(200).json({
      success: true,
      message: 'Analytics exported successfully',
      data: exportData
    });
  } catch (error) {
    logger.error('Export analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export analytics',
      error: error.message
    });
  }
};

/**
 * Get analytics report
 */
const getAnalyticsReport = async (req, res) => {
  try {
    const { type, period } = req.query;

    // Generate report based on type and period
    // Placeholder - would generate actual report
    const report = {
      type,
      period,
      generatedAt: new Date(),
      data: {}
    };

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Get analytics report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics report',
      error: error.message
    });
  }
};

/**
 * Get real-time analytics
 */
const getRealTimeAnalytics = async (req, res) => {
  try {
    // Placeholder - would get real-time data
    const data = {
      timestamp: new Date(),
      activePatients: 45,
      waitingPatients: 12,
      appointmentsToday: 142,
      emergencyCases: 3,
      bedOccupancy: 75,
      staffOnDuty: 85
    };

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Get real-time analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get real-time analytics',
      error: error.message
    });
  }
};

/**
 * Get live metrics
 */
const getLiveMetrics = async (req, res) => {
  try {
    // Placeholder - would get live metrics
    const metrics = {
      patientsInHospital: 78,
      availableBeds: 42,
      doctorsAvailable: 45,
      nursesAvailable: 65,
      surgeriesToday: 8,
      emergencyResponseTime: 6
    };

    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Get live metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get live metrics',
      error: error.message
    });
  }
};

/**
 * Get predictions
 */
const getPredictions = async (req, res) => {
  try {
    // Placeholder - would get predictions
    const predictions = {
      patientVolume: {
        today: 145,
        tomorrow: 130,
        week: 980
      },
      revenue: {
        month: 820000,
        quarter: 2450000,
        year: 9800000
      },
      occupancy: {
        current: 75,
        predicted: 82
      }
    };

    res.status(200).json({
      success: true,
      data: predictions
    });
  } catch (error) {
    logger.error('Get predictions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get predictions',
      error: error.message
    });
  }
};

/**
 * Get forecasts
 */
const getForecasts = async (req, res) => {
  try {
    // Placeholder - would get forecasts
    const forecasts = {
      patientGrowth: 8.5,
      revenueGrowth: 12.3,
      staffingRequirements: [
        { department: 'Cardiology', needed: 3 },
        { department: 'Neurology', needed: 2 },
        { department: 'Emergency', needed: 5 }
      ],
      equipmentNeeds: [
        { item: 'MRI Machine', quantity: 1 },
        { item: 'CT Scanner', quantity: 1 },
        { item: 'Ultrasound', quantity: 2 }
      ]
    };

    res.status(200).json({
      success: true,
      data: forecasts
    });
  } catch (error) {
    logger.error('Get forecasts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get forecasts',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardAnalytics,
  getSystemOverview,
  getKeyMetrics,
  getPatientAnalytics,
  getPatientDemographics,
  getPatientTrends,
  getPatientSatisfaction,
  getPatientRetention,
  getFinancialAnalytics,
  getRevenueAnalytics,
  getExpenseAnalytics,
  getProfitabilityAnalytics,
  getPaymentAnalytics,
  getOperationalAnalytics,
  getAppointmentAnalytics,
  getWaitTimeAnalytics,
  getOccupancyAnalytics,
  getResourceUtilization,
  getClinicalAnalytics,
  getDiagnosisAnalytics,
  getTreatmentAnalytics,
  getOutcomeAnalytics,
  getMedicationAnalytics,
  getStaffAnalytics,
  getStaffPerformance,
  getStaffProductivity,
  getStaffTurnover,
  getDepartmentAnalytics,
  getDepartmentPerformance,
  getDepartmentComparison,
  createCustomQuery,
  getCustomQuery,
  updateCustomQuery,
  deleteCustomQuery,
  executeCustomQuery,
  exportAnalytics,
  getAnalyticsReport,
  getRealTimeAnalytics,
  getLiveMetrics,
  getPredictions,
  getForecasts
};
