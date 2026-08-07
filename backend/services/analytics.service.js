// services/analytics.service.js
const { logger } = require('../middleware/logger');
const { Emergency } = require('../models/Emergency');
const { Ambulance } = require('../models/Ambulance');
const { Payment } = require('../models/Payment');
const { Employee } = require('../models/Employee');
const { AuditLog } = require('../models/AuditLog');
const { PerformanceMetrics } = require('../models/PerformanceMetrics');

class AnalyticsService {
  constructor() {
    this.metrics = {};
    this.startCollectors();
  }

  // Start metric collectors
  startCollectors() {
    // Collect metrics every 5 minutes
    setInterval(() => this.collectMetrics(), 300000);
    
    // Clean up old metrics daily
    setInterval(() => this.cleanupMetrics(), 86400000);
  }

  // Collect metrics
  async collectMetrics() {
    try {
      const metrics = await this.calculateMetrics();
      await this.storeMetrics(metrics);
      logger.info('Metrics collected successfully');
    } catch (error) {
      logger.error('Metric collection error:', error);
    }
  }

  // Calculate metrics
  async calculateMetrics() {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(now);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Emergency metrics
    const emergencyMetrics = await this.calculateEmergencyMetrics(startOfDay, startOfWeek, startOfMonth);

    // Ambulance metrics
    const ambulanceMetrics = await this.calculateAmbulanceMetrics();

    // Financial metrics
    const financialMetrics = await this.calculateFinancialMetrics(startOfDay, startOfWeek, startOfMonth);

    // Employee metrics
    const employeeMetrics = await this.calculateEmployeeMetrics();

    // Performance metrics
    const performanceMetrics = await this.calculatePerformanceMetrics(startOfDay);

    return {
      timestamp: now,
      period: {
        day: startOfDay,
        week: startOfWeek,
        month: startOfMonth
      },
      emergency: emergencyMetrics,
      ambulance: ambulanceMetrics,
      financial: financialMetrics,
      employee: employeeMetrics,
      performance: performanceMetrics
    };
  }

  // Calculate emergency metrics
  async calculateEmergencyMetrics(startOfDay, startOfWeek, startOfMonth) {
    const totalEmergencies = await Emergency.countDocuments();
    const todayEmergencies = await Emergency.countDocuments({
      createdAt: { $gte: startOfDay }
    });
    const weekEmergencies = await Emergency.countDocuments({
      createdAt: { $gte: startOfWeek }
    });
    const monthEmergencies = await Emergency.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    // Response times
    const completedEmergencies = await Emergency.find({
      status: 'completed',
      'timeline.0': { $exists: true }
    });

    let totalResponseTime = 0;
    let responseCount = 0;
    let avgResponseTime = 0;

    completedEmergencies.forEach(emergency => {
      const dispatch = emergency.timeline.find(t => t.action === 'dispatched');
      const onScene = emergency.timeline.find(t => t.action === 'on-scene');
      
      if (dispatch && onScene) {
        const responseTime = (onScene.timestamp - dispatch.timestamp) / 60000; // minutes
        totalResponseTime += responseTime;
        responseCount++;
      }
    });

    if (responseCount > 0) {
      avgResponseTime = totalResponseTime / responseCount;
    }

    // Priority distribution
    const priorityDistribution = await Emergency.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // Status distribution
    const statusDistribution = await Emergency.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Type distribution
    const typeDistribution = await Emergency.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    return {
      total: totalEmergencies,
      today: todayEmergencies,
      week: weekEmergencies,
      month: monthEmergencies,
      averageResponseTime: avgResponseTime,
      priorityDistribution: this.convertToObject(priorityDistribution),
      statusDistribution: this.convertToObject(statusDistribution),
      typeDistribution: this.convertToObject(typeDistribution),
      completionRate: totalEmergencies > 0 
        ? await Emergency.countDocuments({ status: 'completed' }) / totalEmergencies * 100
        : 0
    };
  }

  // Calculate ambulance metrics
  async calculateAmbulanceMetrics() {
    const totalAmbulances = await Ambulance.countDocuments();
    const availableAmbulances = await Ambulance.countDocuments({ status: 'available' });
    const onDutyAmbulances = await Ambulance.countDocuments({ status: 'on-duty' });
    const maintenanceAmbulances = await Ambulance.countDocuments({ status: 'maintenance' });

    // Utilization rate
    const utilizationRate = totalAmbulances > 0 
      ? (onDutyAmbulances / totalAmbulances) * 100 
      : 0;

    // Average fuel level
    const fuelResult = await Ambulance.aggregate([
      { $group: { _id: null, avgFuel: { $avg: '$fuelLevel' } } }
    ]);
    const averageFuelLevel = fuelResult.length > 0 ? fuelResult[0].avgFuel : 0;

    // Total mileage
    const mileageResult = await Ambulance.aggregate([
      { $group: { _id: null, totalMileage: { $sum: '$mileage' } } }
    ]);
    const totalMileage = mileageResult.length > 0 ? mileageResult[0].totalMileage : 0;

    return {
      total: totalAmbulances,
      available: availableAmbulances,
      onDuty: onDutyAmbulances,
      maintenance: maintenanceAmbulances,
      utilizationRate,
      averageFuelLevel,
      totalMileage
    };
  }

  // Calculate financial metrics
  async calculateFinancialMetrics(startOfDay, startOfWeek, startOfMonth) {
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalRefunds = await Payment.aggregate([
      { $match: { status: 'refunded' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const todayRevenue = await Payment.aggregate([
      { $match: { status: 'completed', paymentDate: { $gte: startOfDay } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const monthRevenue = await Payment.aggregate([
      { $match: { status: 'completed', paymentDate: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Payment method distribution
    const methodDistribution = await Payment.aggregate([
      { $group: { _id: '$method', count: { $sum: 1 } } }
    ]);

    return {
      totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
      totalRefunds: totalRefunds.length > 0 ? totalRefunds[0].total : 0,
      netRevenue: (totalRevenue.length > 0 ? totalRevenue[0].total : 0) - 
                  (totalRefunds.length > 0 ? totalRefunds[0].total : 0),
      todayRevenue: todayRevenue.length > 0 ? todayRevenue[0].total : 0,
      monthRevenue: monthRevenue.length > 0 ? monthRevenue[0].total : 0,
      methodDistribution: this.convertToObject(methodDistribution),
      averageTransactionValue: await this.calculateAverageTransactionValue()
    };
  }

  // Calculate employee metrics
  async calculateEmployeeMetrics() {
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ status: 'active' });
    const onLeaveEmployees = await Employee.countDocuments({ status: 'on-leave' });

    // Role distribution
    const roleDistribution = await Employee.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Average certifications per employee
    const certResult = await Employee.aggregate([
      { $match: { status: 'active' } },
      { $project: { certCount: { $size: '$certifications' } } },
      { $group: { _id: null, avgCerts: { $avg: '$certCount' } } }
    ]);
    const avgCertifications = certResult.length > 0 ? certResult[0].avgCerts : 0;

    return {
      total: totalEmployees,
      active: activeEmployees,
      onLeave: onLeaveEmployees,
      roleDistribution: this.convertToObject(roleDistribution),
      avgCertifications,
      turnoverRate: await this.calculateTurnoverRate()
    };
  }

  // Calculate performance metrics
  async calculatePerformanceMetrics(startOfDay) {
    // Response time by priority
    const responseTimeByPriority = await Emergency.aggregate([
      { $match: { 
        status: 'completed',
        'timeline.1': { $exists: true }
      }},
      { $addFields: {
        responseTime: {
          $divide: [
            { $subtract: ['$timeline.1.timestamp', '$timeline.0.timestamp'] },
            60000 // Convert to minutes
          ]
        }
      }},
      { $group: {
        _id: '$priority',
        avgResponseTime: { $avg: '$responseTime' },
        count: { $sum: 1 }
      }}
    ]);

    // Emergency completion rate by priority
    const completionByPriority = await Emergency.aggregate([
      { $group: {
        _id: '$priority',
        total: { $sum: 1 },
        completed: { 
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        }
      }},
      { $addFields: {
        completionRate: { $multiply: [{ $divide: ['$completed', '$total'] }, 100] }
      }}
    ]);

    // Daily emergency trends
    const dailyTrends = await Emergency.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    return {
      responseTimeByPriority: this.convertToObject(responseTimeByPriority),
      completionByPriority: this.convertToObject(completionByPriority),
      dailyTrends: dailyTrends.map(item => ({
        date: item._id,
        count: item.count
      })),
      kpi: await this.calculateKPIs()
    };
  }

  // Calculate KPIs
  async calculateKPIs() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const emergencies = await Emergency.find({
      createdAt: { $gte: thirtyDaysAgo }
    });

    const completedEmergencies = emergencies.filter(e => e.status === 'completed');
    const totalResponseTime = completedEmergencies.reduce((sum, e) => {
      const dispatch = e.timeline.find(t => t.action === 'dispatched');
      const onScene = e.timeline.find(t => t.action === 'on-scene');
      if (dispatch && onScene) {
        return sum + (onScene.timestamp - dispatch.timestamp);
      }
      return sum;
    }, 0);

    const avgResponseTime = completedEmergencies.length > 0 
      ? totalResponseTime / completedEmergencies.length / 60000
      : 0;

    const criticalEmergencies = emergencies.filter(e => e.priority === 'critical');
    const criticalCompleted = criticalEmergencies.filter(e => e.status === 'completed');

    return {
      totalEmergencies: emergencies.length,
      completionRate: emergencies.length > 0 
        ? (completedEmergencies.length / emergencies.length) * 100 
        : 0,
      averageResponseTime: avgResponseTime,
      criticalResponseRate: criticalEmergencies.length > 0
        ? (criticalCompleted.length / criticalEmergencies.length) * 100
        : 0,
      patientSatisfaction: await this.calculatePatientSatisfaction(),
      employeeProductivity: await this.calculateEmployeeProductivity()
    };
  }

  // Calculate patient satisfaction
  async calculatePatientSatisfaction() {
    // This would typically come from a survey system
    // For now, return mock data
    return {
      average: 4.5,
      total: 150,
      distribution: {
        '5': 60,
        '4': 50,
        '3': 30,
        '2': 8,
        '1': 2
      }
    };
  }

  // Calculate employee productivity
  async calculateEmployeeProductivity() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const emergencies = await Emergency.find({
      createdAt: { $gte: thirtyDaysAgo }
    });

    const employeeEmergencies = {};
    emergencies.forEach(e => {
      if (e.assignedParamedics) {
        e.assignedParamedics.forEach(empId => {
          if (!employeeEmergencies[empId]) {
            employeeEmergencies[empId] = 0;
          }
          employeeEmergencies[empId]++;
        });
      }
    });

    const values = Object.values(employeeEmergencies);
    const avg = values.length > 0 
      ? values.reduce((a, b) => a + b, 0) / values.length 
      : 0;

    return {
      averageEmergenciesPerEmployee: avg,
      totalEmployees: Object.keys(employeeEmergencies).length,
      distribution: employeeEmergencies
    };
  }

  // Calculate average transaction value
  async calculateAverageTransactionValue() {
    const result = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, avgAmount: { $avg: '$amount' } } }
    ]);
    return result.length > 0 ? result[0].avgAmount : 0;
  }

  // Calculate turnover rate
  async calculateTurnoverRate() {
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    
    const totalEmployees = await Employee.countDocuments();
    const terminatedEmployees = await Employee.countDocuments({
      status: 'terminated',
      updatedAt: { $gte: oneYearAgo }
    });

    return totalEmployees > 0 
      ? (terminatedEmployees / totalEmployees) * 100 
      : 0;
  }

  // Store metrics
  async storeMetrics(metrics) {
    const performanceMetrics = new PerformanceMetrics(metrics);
    await performanceMetrics.save();
  }

  // Convert aggregation result to object
  convertToObject(arr) {
    const obj = {};
    arr.forEach(item => {
      obj[item._id || 'unknown'] = item.count || item.avgResponseTime || item.total || 0;
    });
    return obj;
  }

  // Cleanup old metrics
  async cleanupMetrics() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await PerformanceMetrics.deleteMany({ timestamp: { $lt: thirtyDaysAgo } });
    logger.info('Old metrics cleaned up');
  }

  // Get metrics for dashboard
  async getDashboardMetrics() {
    const latest = await PerformanceMetrics.findOne()
      .sort({ timestamp: -1 });
    
    if (!latest) {
      return await this.calculateMetrics();
    }

    return latest;
  }

  // Get historical metrics
  async getHistoricalMetrics(startDate, endDate) {
    return PerformanceMetrics.find({
      timestamp: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ timestamp: 1 });
  }

  // Get real-time metrics
  async getRealTimeMetrics() {
    const now = new Date();
    const hourAgo = new Date(now - 60 * 60 * 1000);

    const activeEmergencies = await Emergency.countDocuments({
      status: { $in: ['pending', 'dispatched', 'en-route', 'on-scene', 'transporting'] },
      updatedAt: { $gte: hourAgo }
    });

    const availableAmbulances = await Ambulance.countDocuments({ status: 'available' });
    const onDutyAmbulances = await Ambulance.countDocuments({ status: 'on-duty' });

    const recentPayments = await Payment.countDocuments({
      status: 'completed',
      paymentDate: { $gte: hourAgo }
    });

    return {
      timestamp: now,
      emergencies: {
        active: activeEmergencies,
        completed: await Emergency.countDocuments({
          status: 'completed',
          updatedAt: { $gte: hourAgo }
        })
      },
      ambulances: {
        available: availableAmbulances,
        onDuty: onDutyAmbulances,
        total: await Ambulance.countDocuments()
      },
      payments: {
        recent: recentPayments,
        totalToday: await Payment.countDocuments({
          status: 'completed',
          paymentDate: { $gte: new Date(now.setHours(0, 0, 0, 0)) }
        })
      },
      employees: {
        active: await Employee.countDocuments({ status: 'active' }),
        onLeave: await Employee.countDocuments({ status: 'on-leave' })
      }
    };
  }

  // Generate insights
  async generateInsights() {
    const metrics = await this.getDashboardMetrics();
    const insights = [];

    // Emergency insights
    if (metrics.emergency.total > 0) {
      const completionRate = metrics.emergency.completionRate;
      if (completionRate < 80) {
        insights.push({
          type: 'warning',
          category: 'emergency',
          message: `Emergency completion rate is low (${completionRate.toFixed(1)}%). Consider reviewing response protocols.`,
          priority: 'high'
        });
      }
    }

    // Ambulance insights
    if (metrics.ambulance.utilizationRate > 80) {
      insights.push({
        type: 'warning',
        category: 'ambulance',
        message: `Ambulance utilization is high (${metrics.ambulance.utilizationRate.toFixed(1)}%). Consider adding more vehicles.`,
        priority: 'medium'
      });
    }

    // Financial insights
    if (metrics.financial.netRevenue < 0) {
      insights.push({
        type: 'critical',
        category: 'financial',
        message: 'Net revenue is negative. Review expenses and payment collections.',
        priority: 'high'
      });
    }

    // Employee insights
    if (metrics.employee.turnoverRate > 15) {
      insights.push({
        type: 'warning',
        category: 'employee',
        message: `Employee turnover rate is high (${metrics.employee.turnoverRate.toFixed(1)}%). Review retention strategies.`,
        priority: 'medium'
      });
    }

    return insights;
  }
}

module.exports = new AnalyticsService();
