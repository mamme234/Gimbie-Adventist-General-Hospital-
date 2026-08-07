// services/report.service.js
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { logger } = require('../middleware/logger');
const { AuditLog } = require('../models/AuditLog');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class ReportService {
  constructor() {
    this.reportTypes = {
      emergency: this.generateEmergencyReport.bind(this),
      financial: this.generateFinancialReport.bind(this),
      operational: this.generateOperationalReport.bind(this),
      employee: this.generateEmployeeReport.bind(this),
      ambulance: this.generateAmbulanceReport.bind(this)
    };
  }

  // Generate report
  async generateReport({
    type,
    format = 'pdf',
    filters = {},
    dateRange,
    userId
  }) {
    try {
      // Validate report type
      if (!this.reportTypes[type]) {
        throw new Error(`Unknown report type: ${type}`);
      }

      // Generate data
      const data = await this.reportTypes[type](filters, dateRange);

      // Generate file
      const filePath = await this.generateFile(data, type, format);

      // Log report generation
      await AuditLog.logAction({
        action: 'generate_report',
        resource: 'report',
        userId,
        details: {
          type,
          format,
          filters,
          dateRange
        },
        status: 'success'
      });

      return {
        success: true,
        filePath,
        data,
        format,
        type
      };
    } catch (error) {
      logger.error('Generate report error:', error);
      throw error;
    }
  }

  // Generate emergency report
  async generateEmergencyReport(filters = {}, dateRange = {}) {
    const Emergency = require('../models/Emergency');
    const Ambulance = require('../models/Ambulance');
    const Employee = require('../models/Employee');

    const query = {};
    if (dateRange.startDate || dateRange.endDate) {
      query.createdAt = {};
      if (dateRange.startDate) query.createdAt.$gte = new Date(dateRange.startDate);
      if (dateRange.endDate) query.createdAt.$lte = new Date(dateRange.endDate);
    }
    if (filters.priority) query.priority = filters.priority;
    if (filters.type) query.type = filters.type;
    if (filters.status) query.status = filters.status;

    // Get emergency data
    const emergencies = await Emergency.find(query)
      .populate('assignedAmbulanceId', 'vehicleId registrationNumber')
      .populate('assignedParamedics', 'firstName lastName employeeId')
      .sort({ createdAt: -1 });

    // Calculate statistics
    const stats = {
      total: emergencies.length,
      byPriority: {},
      byType: {},
      byStatus: {},
      avgResponseTime: 0,
      totalResponseTime: 0
    };

    let responseTimes = [];

    emergencies.forEach(emergency => {
      // Count by priority
      stats.byPriority[emergency.priority] = (stats.byPriority[emergency.priority] || 0) + 1;
      
      // Count by type
      stats.byType[emergency.type] = (stats.byType[emergency.type] || 0) + 1;
      
      // Count by status
      stats.byStatus[emergency.status] = (stats.byStatus[emergency.status] || 0) + 1;

      // Calculate response time
      if (emergency.timeline && emergency.timeline.length > 0) {
        const dispatchTime = emergency.timeline.find(t => t.action === 'dispatched');
        const arrivalTime = emergency.timeline.find(t => t.action === 'on-scene');
        if (dispatchTime && arrivalTime) {
          const responseTime = (arrivalTime.timestamp - dispatchTime.timestamp) / 60000; // minutes
          responseTimes.push(responseTime);
        }
      }
    });

    if (responseTimes.length > 0) {
      stats.avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      stats.totalResponseTime = responseTimes.reduce((a, b) => a + b, 0);
    }

    return {
      title: 'Emergency Response Report',
      generatedAt: new Date().toISOString(),
      filters,
      dateRange,
      statistics: stats,
      emergencies: emergencies.map(e => e.toObject()),
      summary: {
        totalEmergencies: stats.total,
        averageResponseTime: stats.avgResponseTime,
        mostCommonType: Object.entries(stats.byType).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A',
        mostCommonPriority: Object.entries(stats.byPriority).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
      }
    };
  }

  // Generate financial report
  async generateFinancialReport(filters = {}, dateRange = {}) {
    const Payment = require('../models/Payment');
    const Insurance = require('../models/Insurance');

    const query = {};
    if (dateRange.startDate || dateRange.endDate) {
      query.createdAt = {};
      if (dateRange.startDate) query.createdAt.$gte = new Date(dateRange.startDate);
      if (dateRange.endDate) query.createdAt.$lte = new Date(dateRange.endDate);
    }
    if (filters.status) query.status = filters.status;

    const payments = await Payment.find(query);
    const insurances = await Insurance.find();

    // Calculate financial statistics
    const stats = {
      totalRevenue: 0,
      totalRefunds: 0,
      byMethod: {},
      byStatus: {},
      insuranceClaims: {
        total: insurances.length,
        pending: insurances.filter(i => i.claims.some(c => c.status === 'pending')).length,
        approved: insurances.filter(i => i.claims.some(c => c.status === 'approved')).length,
        rejected: insurances.filter(i => i.claims.some(c => c.status === 'rejected')).length,
        totalAmount: 0,
        approvedAmount: 0
      }
    };

    payments.forEach(payment => {
      if (payment.status === 'completed') {
        stats.totalRevenue += payment.amount;
      }
      if (payment.status === 'refunded') {
        stats.totalRefunds += payment.amount;
      }
      
      stats.byMethod[payment.method] = (stats.byMethod[payment.method] || 0) + 1;
      stats.byStatus[payment.status] = (stats.byStatus[payment.status] || 0) + 1;
    });

    // Calculate insurance stats
    insurances.forEach(insurance => {
      insurance.claims.forEach(claim => {
        stats.insuranceClaims.totalAmount += claim.amount;
        if (claim.status === 'approved') {
          stats.insuranceClaims.approvedAmount += claim.amount;
        }
      });
    });

    return {
      title: 'Financial Report',
      generatedAt: new Date().toISOString(),
      filters,
      dateRange,
      statistics: stats,
      payments: payments.map(p => p.toObject()),
      insurances: insurances.map(i => i.toObject()),
      summary: {
        totalRevenue: stats.totalRevenue,
        totalRefunds: stats.totalRefunds,
        netRevenue: stats.totalRevenue - stats.totalRefunds,
        insurancePendingAmount: stats.insuranceClaims.totalAmount - stats.insuranceClaims.approvedAmount
      }
    };
  }

  // Generate operational report
  async generateOperationalReport(filters = {}, dateRange = {}) {
    const Ambulance = require('../models/Ambulance');
    const Employee = require('../models/Employee');
    const Emergency = require('../models/Emergency');

    const ambulances = await Ambulance.find();
    const employees = await Employee.find({ status: 'active' });
    
    const emergencyQuery = {};
    if (dateRange.startDate || dateRange.endDate) {
      emergencyQuery.createdAt = {};
      if (dateRange.startDate) emergencyQuery.createdAt.$gte = new Date(dateRange.startDate);
      if (dateRange.endDate) emergencyQuery.createdAt.$lte = new Date(dateRange.endDate);
    }
    const emergencies = await Emergency.find(emergencyQuery);

    // Calculate operational metrics
    const stats = {
      ambulance: {
        total: ambulances.length,
        available: ambulances.filter(a => a.status === 'available').length,
        onDuty: ambulances.filter(a => a.status === 'on-duty').length,
        maintenance: ambulances.filter(a => a.status === 'maintenance').length,
        utilizationRate: 0,
        averageMileage: 0
      },
      employee: {
        total: employees.length,
        byRole: {},
        active: employees.filter(e => e.status === 'active').length,
        onLeave: employees.filter(e => e.status === 'on-leave').length
      },
      operations: {
        totalEmergencies: emergencies.length,
        completed: emergencies.filter(e => e.status === 'completed').length,
        cancelled: emergencies.filter(e => e.status === 'cancelled').length,
        inProgress: emergencies.filter(e => !['completed', 'cancelled'].includes(e.status)).length
      }
    };

    // Calculate ambulance utilization
    const onDutyCount = stats.ambulance.onDuty;
    const totalAmbulances = stats.ambulance.total;
    stats.ambulance.utilizationRate = totalAmbulances > 0 ? (onDutyCount / totalAmbulances) * 100 : 0;

    // Calculate average mileage
    if (ambulances.length > 0) {
      const totalMileage = ambulances.reduce((sum, a) => sum + a.mileage, 0);
      stats.ambulance.averageMileage = totalMileage / ambulances.length;
    }

    // Count employees by role
    employees.forEach(emp => {
      stats.employee.byRole[emp.role] = (stats.employee.byRole[emp.role] || 0) + 1;
    });

    return {
      title: 'Operational Report',
      generatedAt: new Date().toISOString(),
      filters,
      dateRange,
      statistics: stats,
      ambulances: ambulances.map(a => a.toObject()),
      employees: employees.map(e => e.toObject()),
      summary: {
        ambulanceUtilization: `${stats.ambulance.utilizationRate.toFixed(1)}%`,
        activeEmployees: stats.employee.active,
        emergencyCompletionRate: stats.operations.totalEmergencies > 0 
          ? (stats.operations.completed / stats.operations.totalEmergencies) * 100 
          : 0
      }
    };
  }

  // Generate employee report
  async generateEmployeeReport(filters = {}, dateRange = {}) {
    const Employee = require('../models/Employee');
    const Payroll = require('../models/Payroll');
    const Emergency = require('../models/Emergency');

    const query = {};
    if (filters.role) query.role = filters.role;
    if (filters.status) query.status = filters.status;

    const employees = await Employee.find(query);
    
    // Get payroll data
    const payrollQuery = {};
    if (dateRange.startDate || dateRange.endDate) {
      payrollQuery['period.startDate'] = {};
      if (dateRange.startDate) payrollQuery['period.startDate'].$gte = new Date(dateRange.startDate);
      if (dateRange.endDate) payrollQuery['period.endDate'] = {};
      if (dateRange.endDate) payrollQuery['period.endDate'].$lte = new Date(dateRange.endDate);
    }
    const payrolls = await Payroll.find(payrollQuery);

    // Get emergency assignments
    const emergencyQuery = {};
    if (dateRange.startDate || dateRange.endDate) {
      emergencyQuery.createdAt = {};
      if (dateRange.startDate) emergencyQuery.createdAt.$gte = new Date(dateRange.startDate);
      if (dateRange.endDate) emergencyQuery.createdAt.$lte = new Date(dateRange.endDate);
    }
    const emergencies = await Emergency.find(emergencyQuery);

    // Calculate employee statistics
    const stats = {
      total: employees.length,
      byRole: {},
      byStatus: {},
      averageSalary: 0,
      totalPayroll: 0,
      emergencyCount: emergencies.length,
      averageEmergenciesPerEmployee: 0
    };

    employees.forEach(emp => {
      stats.byRole[emp.role] = (stats.byRole[emp.role] || 0) + 1;
      stats.byStatus[emp.status] = (stats.byStatus[emp.status] || 0) + 1;
    });

    // Calculate payroll
    let totalSalary = 0;
    payrolls.forEach(payroll => {
      totalSalary += payroll.netPay;
    });
    stats.totalPayroll = totalSalary;
    stats.averageSalary = employees.length > 0 ? totalSalary / employees.length : 0;

    // Calculate average emergencies per employee
    const employeeIds = employees.map(e => e._id);
    const assignedEmergencies = emergencies.filter(e => 
      e.assignedParamedics && e.assignedParamedics.some(p => employeeIds.includes(p))
    );
    stats.averageEmergenciesPerEmployee = employees.length > 0 
      ? assignedEmergencies.length / employees.length 
      : 0;

    return {
      title: 'Employee Report',
      generatedAt: new Date().toISOString(),
      filters,
      dateRange,
      statistics: stats,
      employees: employees.map(e => e.toObject()),
      payrolls: payrolls.map(p => p.toObject()),
      summary: {
        totalEmployees: stats.total,
        totalPayroll: stats.totalPayroll,
        averageSalary: stats.averageSalary,
        averageEmergencies: stats.averageEmergenciesPerEmployee
      }
    };
  }

  // Generate ambulance report
  async generateAmbulanceReport(filters = {}, dateRange = {}) {
    const Ambulance = require('../models/Ambulance');
    const Emergency = require('../models/Emergency');

    const query = {};
    if (filters.type) query.type = filters.type;
    if (filters.status) query.status = filters.status;

    const ambulances = await Ambulance.find(query);
    
    const emergencyQuery = {};
    if (dateRange.startDate || dateRange.endDate) {
      emergencyQuery.createdAt = {};
      if (dateRange.startDate) emergencyQuery.createdAt.$gte = new Date(dateRange.startDate);
      if (dateRange.endDate) emergencyQuery.createdAt.$lte = new Date(dateRange.endDate);
    }
    const emergencies = await Emergency.find(emergencyQuery);

    const stats = {
      total: ambulances.length,
      byType: {},
      byStatus: {},
      averageMileage: 0,
      totalMileage: 0,
      averageFuelLevel: 0,
      maintenanceCount: 0,
      totalMaintenanceCost: 0,
      emergencyResponses: 0
    };

    ambulances.forEach(ambulance => {
      stats.byType[ambulance.type] = (stats.byType[ambulance.type] || 0) + 1;
      stats.byStatus[ambulance.status] = (stats.byStatus[ambulance.status] || 0) + 1;
      stats.totalMileage += ambulance.mileage || 0;
      stats.averageFuelLevel += ambulance.fuelLevel || 0;
      
      if (ambulance.maintenanceHistory) {
        stats.maintenanceCount += ambulance.maintenanceHistory.length;
        stats.totalMaintenanceCost += ambulance.maintenanceHistory.reduce((sum, m) => sum + (m.cost || 0), 0);
      }
    });

    // Calculate averages
    if (ambulances.length > 0) {
      stats.averageMileage = stats.totalMileage / ambulances.length;
      stats.averageFuelLevel = stats.averageFuelLevel / ambulances.length;
    }

    // Count emergency responses
    const ambulanceIds = ambulances.map(a => a._id);
    stats.emergencyResponses = emergencies.filter(e => 
      e.assignedAmbulanceId && ambulanceIds.includes(e.assignedAmbulanceId)
    ).length;

    return {
      title: 'Ambulance Fleet Report',
      generatedAt: new Date().toISOString(),
      filters,
      dateRange,
      statistics: stats,
      ambulances: ambulances.map(a => a.toObject()),
      summary: {
        totalAmbulances: stats.total,
        averageMileage: stats.averageMileage,
        averageFuelLevel: stats.averageFuelLevel,
        totalMaintenanceCost: stats.totalMaintenanceCost,
        emergencyResponses: stats.emergencyResponses
      }
    };
  }

  // Generate file
  async generateFile(data, type, format) {
    switch (format) {
      case 'pdf':
        return this.generatePDF(data, type);
      case 'excel':
        return this.generateExcel(data, type);
      case 'csv':
        return this.generateCSV(data, type);
      case 'json':
        return this.generateJSON(data, type);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  // Generate PDF
  async generatePDF(data, type) {
    const filename = `${type}_report_${Date.now()}.pdf`;
    const filepath = path.join(__dirname, '../reports', filename);
    
    // Ensure directory exists
    if (!fs.existsSync(path.dirname(filepath))) {
      fs.mkdirSync(path.dirname(filepath), { recursive: true });
    }

    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Title
    doc.fontSize(18).text(data.title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date(data.generatedAt).toLocaleString()}`);
    doc.moveDown();

    // Summary
    if (data.summary) {
      doc.fontSize(14).text('Summary', { underline: true });
      doc.moveDown();
      Object.entries(data.summary).forEach(([key, value]) => {
        doc.fontSize(10).text(`${key}: ${value}`);
      });
      doc.moveDown();
    }

    // Statistics
    if (data.statistics) {
      doc.fontSize(14).text('Statistics', { underline: true });
      doc.moveDown();
      
      const stats = data.statistics;
      for (const [key, value] of Object.entries(stats)) {
        if (typeof value === 'object' && value !== null) {
          doc.fontSize(12).text(key);
          Object.entries(value).forEach(([k, v]) => {
            if (typeof v === 'number' && v % 1 === 0) {
              doc.fontSize(10).text(`  ${k}: ${v}`);
            } else if (typeof v === 'number') {
              doc.fontSize(10).text(`  ${k}: ${v.toFixed(2)}`);
            } else {
              doc.fontSize(10).text(`  ${k}: ${v}`);
            }
          });
          doc.moveDown();
        }
      }
    }

    // Details
    if (data.emergencies || data.payments || data.ambulances || data.employees) {
      doc.fontSize(14).text('Details', { underline: true });
      doc.moveDown();

      if (data.emergencies) {
        doc.fontSize(12).text(`Total Emergencies: ${data.emergencies.length}`);
        // Add more details as needed
      }
    }

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(filepath));
      stream.on('error', reject);
    });
  }

  // Generate Excel
  async generateExcel(data, type) {
    const filename = `${type}_report_${Date.now()}.xlsx`;
    const filepath = path.join(__dirname, '../reports', filename);
    
    // Ensure directory exists
    if (!fs.existsSync(path.dirname(filepath))) {
      fs.mkdirSync(path.dirname(filepath), { recursive: true });
    }

    const workbook = new ExcelJS.Workbook();
    
    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    const summaryData = [
      ['Report Type', data.title],
      ['Generated At', data.generatedAt],
      ['', ''],
      ['Summary']
    ];

    if (data.summary) {
      Object.entries(data.summary).forEach(([key, value]) => {
        summaryData.push([key, value]);
      });
    }

    summaryData.forEach(row => summarySheet.addRow(row));

    // Statistics sheet
    if (data.statistics) {
      const statsSheet = workbook.addWorksheet('Statistics');
      
      const flattenStats = (obj, prefix = '') => {
        const entries = [];
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'object' && value !== null) {
            entries.push(...flattenStats(value, `${prefix}${key}.`));
          } else {
            entries.push([`${prefix}${key}`, value]);
          }
        }
        return entries;
      };

      const flatStats = flattenStats(data.statistics);
      flatStats.forEach(row => statsSheet.addRow(row));
    }

    // Data sheets
    if (data.emergencies) {
      const dataSheet = workbook.addWorksheet('Emergencies');
      const headers = ['Emergency ID', 'Type', 'Priority', 'Status', 'Created At'];
      dataSheet.addRow(headers);
      
      data.emergencies.forEach(emergency => {
        dataSheet.addRow([
          emergency.emergencyId,
          emergency.type,
          emergency.priority,
          emergency.status,
          emergency.createdAt.toISOString()
        ]);
      });
    }

    await workbook.xlsx.writeFile(filepath);

    return filepath;
  }

  // Generate CSV
  async generateCSV(data, type) {
    const filename = `${type}_report_${Date.now()}.csv`;
    const filepath = path.join(__dirname, '../reports', filename);

    let csv = '';
    
    // Add metadata
    csv += `"${data.title}"\n`;
    csv += `"Generated: ${data.generatedAt}"\n\n`;

    // Add summary
    if (data.summary) {
      csv += '"Summary"\n';
      Object.entries(data.summary).forEach(([key, value]) => {
        csv += `"${key}","${value}"\n`;
      });
      csv += '\n';
    }

    // Add statistics
    if (data.statistics) {
      csv += '"Statistics"\n';
      
      const flattenStats = (obj, prefix = '') => {
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'object' && value !== null) {
            flattenStats(value, `${prefix}${key}.`);
          } else {
            csv += `"${prefix}${key}","${value}"\n`;
          }
        }
      };
      
      flattenStats(data.statistics);
      csv += '\n';
    }

    // Add data
    if (data.emergencies) {
      csv += '"Emergency Data"\n';
      const headers = ['Emergency ID', 'Type', 'Priority', 'Status', 'Created At'];
      csv += headers.map(h => `"${h}"`).join(',') + '\n';
      
      data.emergencies.forEach(emergency => {
        csv += [
          emergency.emergencyId,
          emergency.type,
          emergency.priority,
          emergency.status,
          emergency.createdAt.toISOString()
        ].map(v => `"${v}"`).join(',') + '\n';
      });
    }

    // Write file
    fs.writeFileSync(filepath, csv);
    return filepath;
  }

  // Generate JSON
  async generateJSON(data, type) {
    const filename = `${type}_report_${Date.now()}.json`;
    const filepath = path.join(__dirname, '../reports', filename);

    // Convert dates to ISO strings
    const jsonData = JSON.parse(JSON.stringify(data, (key, value) => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }));

    fs.writeFileSync(filepath, JSON.stringify(jsonData, null, 2));
    return filepath;
  }

  // Get report file
  getReportFile(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error('Report file not found');
    }
    return fs.readFileSync(filePath);
  }

  // Delete report file
  deleteReportFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return { success: true };
    } catch (error) {
      logger.error('Delete report file error:', error);
      return { success: false, error: error.message };
    }
  }

  // Cleanup old reports
  cleanupOldReports(days = 7) {
    const reportsDir = path.join(__dirname, '../reports');
    if (!fs.existsSync(reportsDir)) return;

    const now = Date.now();
    const cutoff = now - (days * 24 * 60 * 60 * 1000);

    fs.readdirSync(reportsDir).forEach(file => {
      const filePath = path.join(reportsDir, file);
      const stats = fs.statSync(filePath);
      if (stats.mtimeMs < cutoff) {
        fs.unlinkSync(filePath);
        logger.info(`Deleted old report: ${file}`);
      }
    });
  }
}

module.exports = new ReportService();
