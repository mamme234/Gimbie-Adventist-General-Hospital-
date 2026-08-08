/**
 * ============================================
 * REPORT.CONTROLLER.JS - Report Controller
 * ============================================
 */

const Report = require('../models/Report');
const ReportType = require('../models/ReportType');
const ReportTemplate = require('../models/ReportTemplate');
const ScheduledReport = require('../models/ScheduledReport');
const ReportCategory = require('../models/ReportCategory');
const { validationResult } = require('express-validator');
const { logger } = require('../config/logger');
const { sendEmail } = require('../config/email');

/**
 * Get all reports
 */
const getReports = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, category, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (type) query.type = type;
    if (category) query.category = category;
    if (status) query.status = status;

    const reports = await Report.find(query)
      .populate('createdBy', 'firstName lastName')
      .populate('type', 'name')
      .populate('category', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Report.countDocuments(query);

    res.status(200).json({
      success: true,
      data: reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
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
 * Get report by ID
 */
const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('type', 'name')
      .populate('category', 'name');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Get report by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get report',
      error: error.message
    });
  }
};

/**
 * Create report
 */
const createReport = async (req, res) => {
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
      name,
      type,
      category,
      parameters,
      format,
      description,
      schedule
    } = req.body;

    const reportId = `RPT-${new Date().getFullYear()}-${String(await Report.countDocuments() + 1).padStart(6, '0')}`;

    const report = new Report({
      reportId,
      name,
      type,
      category,
      parameters: parameters || {},
      format: format || 'PDF',
      description,
      schedule: schedule || null,
      status: 'Draft',
      createdBy: req.user._id
    });

    await report.save();

    logger.info(`Report created: ${report.reportId}`);

    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      data: report
    });
  } catch (error) {
    logger.error('Create report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create report',
      error: error.message
    });
  }
};

/**
 * Update report
 */
const updateReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const {
      name,
      parameters,
      format,
      description,
      schedule,
      status
    } = req.body;

    if (name) report.name = name;
    if (parameters) report.parameters = parameters;
    if (format) report.format = format;
    if (description) report.description = description;
    if (schedule) report.schedule = schedule;
    if (status) report.status = status;

    await report.save();

    logger.info(`Report updated: ${report.reportId}`);

    res.status(200).json({
      success: true,
      message: 'Report updated successfully',
      data: report
    });
  } catch (error) {
    logger.error('Update report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update report',
      error: error.message
    });
  }
};

/**
 * Delete report
 */
const deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    await report.remove();

    logger.info(`Report deleted: ${report.reportId}`);

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    logger.error('Delete report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete report',
      error: error.message
    });
  }
};

/**
 * Generate report
 */
const generateReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('type', 'name')
      .populate('category', 'name');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Generate report data based on type and parameters
    // Placeholder - would generate actual report
    const reportData = {
      id: report.reportId,
      name: report.name,
      type: report.type,
      category: report.category,
      generatedAt: new Date(),
      generatedBy: req.user._id,
      data: {
        summary: 'Report generated successfully',
        records: []
      }
    };

    report.status = 'Generated';
    report.generatedAt = new Date();
    report.generatedBy = req.user._id;
    await report.save();

    logger.info(`Report generated: ${report.reportId}`);

    res.status(200).json({
      success: true,
      message: 'Report generated successfully',
      data: reportData
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
 * Schedule report
 */
const scheduleReport = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { frequency, day, time, recipients } = req.body;

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const schedule = {
      frequency,
      day: day || null,
      time,
      recipients: recipients || [],
      nextRun: new Date(),
      isActive: true
    };

    report.schedule = schedule;
    await report.save();

    logger.info(`Report scheduled: ${report.reportId}`);

    res.status(200).json({
      success: true,
      message: 'Report scheduled successfully',
      data: report
    });
  } catch (error) {
    logger.error('Schedule report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule report',
      error: error.message
    });
  }
};

/**
 * Cancel scheduled report
 */
const cancelScheduledReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (report.schedule) {
      report.schedule.isActive = false;
      await report.save();
    }

    logger.info(`Scheduled report cancelled: ${report.reportId}`);

    res.status(200).json({
      success: true,
      message: 'Scheduled report cancelled successfully'
    });
  } catch (error) {
    logger.error('Cancel scheduled report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel scheduled report',
      error: error.message
    });
  }
};

/**
 * Get report types
 */
const getReportTypes = async (req, res) => {
  try {
    const types = await ReportType.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: types
    });
  } catch (error) {
    logger.error('Get report types error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get report types',
      error: error.message
    });
  }
};

/**
 * Get report type by ID
 */
const getReportTypeById = async (req, res) => {
  try {
    const type = await ReportType.findById(req.params.id);
    if (!type) {
      return res.status(404).json({
        success: false,
        message: 'Report type not found'
      });
    }

    res.status(200).json({
      success: true,
      data: type
    });
  } catch (error) {
    logger.error('Get report type by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get report type',
      error: error.message
    });
  }
};

/**
 * Create report type
 */
const createReportType = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { name, description, fields, isSystem } = req.body;

    const type = new ReportType({
      name,
      description,
      fields: fields || [],
      isSystem: isSystem || false,
      isActive: true
    });

    await type.save();

    logger.info(`Report type created: ${type.name}`);

    res.status(201).json({
      success: true,
      message: 'Report type created successfully',
      data: type
    });
  } catch (error) {
    logger.error('Create report type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create report type',
      error: error.message
    });
  }
};

/**
 * Update report type
 */
const updateReportType = async (req, res) => {
  try {
    const type = await ReportType.findById(req.params.id);
    if (!type) {
      return res.status(404).json({
        success: false,
        message: 'Report type not found'
      });
    }

    const { name, description, fields, isActive } = req.body;

    if (name) type.name = name;
    if (description) type.description = description;
    if (fields) type.fields = fields;
    if (isActive !== undefined) type.isActive = isActive;

    await type.save();

    logger.info(`Report type updated: ${type.name}`);

    res.status(200).json({
      success: true,
      message: 'Report type updated successfully',
      data: type
    });
  } catch (error) {
    logger.error('Update report type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update report type',
      error: error.message
    });
  }
};

/**
 * Delete report type
 */
const deleteReportType = async (req, res) => {
  try {
    const type = await ReportType.findById(req.params.id);
    if (!type) {
      return res.status(404).json({
        success: false,
        message: 'Report type not found'
      });
    }

    if (type.isSystem) {
      return res.status(400).json({
        success: false,
        message: 'System report types cannot be deleted'
      });
    }

    type.isActive = false;
    await type.save();

    logger.info(`Report type deactivated: ${type.name}`);

    res.status(200).json({
      success: true,
      message: 'Report type deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete report type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate report type',
      error: error.message
    });
  }
};

/**
 * Get templates
 */
const getTemplates = async (req, res) => {
  try {
    const templates = await ReportTemplate.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: templates
    });
  } catch (error) {
    logger.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get templates',
      error: error.message
    });
  }
};

/**
 * Get template by ID
 */
const getTemplateById = async (req, res) => {
  try {
    const template = await ReportTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    logger.error('Get template by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get template',
      error: error.message
    });
  }
};

/**
 * Create template
 */
const createTemplate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { name, content, type, variables, isDefault } = req.body;

    const template = new ReportTemplate({
      name,
      content,
      type: type || 'PDF',
      variables: variables || [],
      isDefault: isDefault || false,
      isActive: true
    });

    await template.save();

    logger.info(`Report template created: ${template.name}`);

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: template
    });
  } catch (error) {
    logger.error('Create template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create template',
      error: error.message
    });
  }
};

/**
 * Update template
 */
const updateTemplate = async (req, res) => {
  try {
    const template = await ReportTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    const { name, content, type, variables, isDefault, isActive } = req.body;

    if (name) template.name = name;
    if (content) template.content = content;
    if (type) template.type = type;
    if (variables) template.variables = variables;
    if (isDefault !== undefined) template.isDefault = isDefault;
    if (isActive !== undefined) template.isActive = isActive;

    await template.save();

    logger.info(`Report template updated: ${template.name}`);

    res.status(200).json({
      success: true,
      message: 'Template updated successfully',
      data: template
    });
  } catch (error) {
    logger.error('Update template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update template',
      error: error.message
    });
  }
};

/**
 * Delete template
 */
const deleteTemplate = async (req, res) => {
  try {
    const template = await ReportTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    template.isActive = false;
    await template.save();

    logger.info(`Report template deactivated: ${template.name}`);

    res.status(200).json({
      success: true,
      message: 'Template deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate template',
      error: error.message
    });
  }
};

/**
 * Get report data
 */
const getReportData = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Fetch report data based on parameters
    // Placeholder - would fetch actual data
    const data = {
      reportId: report.reportId,
      name: report.name,
      generatedAt: new Date(),
      data: []
    };

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Get report data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get report data',
      error: error.message
    });
  }
};

/**
 * Export report
 */
const exportReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const { format } = req.body;

    // Generate export file based on format
    // Placeholder - would generate actual export
    const exportData = {
      format: format || 'PDF',
      reportId: report.reportId,
      name: report.name,
      exportedAt: new Date(),
      url: `/exports/report-${report.reportId}.${(format || 'pdf').toLowerCase()}`
    };

    res.status(200).json({
      success: true,
      message: 'Report exported successfully',
      data: exportData
    });
  } catch (error) {
    logger.error('Export report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export report',
      error: error.message
    });
  }
};

/**
 * Download report
 */
const downloadReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Placeholder - would download actual file
    res.status(200).json({
      success: true,
      message: 'Report downloaded successfully',
      data: {
        url: `/downloads/report-${report.reportId}.pdf`
      }
    });
  } catch (error) {
    logger.error('Download report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download report',
      error: error.message
    });
  }
};

/**
 * Get scheduled reports
 */
const getScheduledReports = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (status) query.status = status;

    const scheduledReports = await ScheduledReport.find(query)
      .populate('report', 'name reportId')
      .populate('createdBy', 'firstName lastName')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ nextRun: 1 });

    const total = await ScheduledReport.countDocuments(query);

    res.status(200).json({
      success: true,
      data: scheduledReports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get scheduled reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get scheduled reports',
      error: error.message
    });
  }
};

/**
 * Create scheduled report
 */
const createScheduledReport = async (req, res) => {
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
      reportId,
      frequency,
      day,
      time,
      recipients,
      format
    } = req.body;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const scheduled = new ScheduledReport({
      report: reportId,
      frequency,
      day: day || null,
      time,
      recipients: recipients || [],
      format: format || 'PDF',
      status: 'Active',
      createdBy: req.user._id,
      nextRun: new Date()
    });

    await scheduled.save();

    logger.info(`Scheduled report created: ${scheduled._id}`);

    res.status(201).json({
      success: true,
      message: 'Scheduled report created successfully',
      data: scheduled
    });
  } catch (error) {
    logger.error('Create scheduled report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create scheduled report',
      error: error.message
    });
  }
};

/**
 * Update scheduled report
 */
const updateScheduledReport = async (req, res) => {
  try {
    const scheduled = await ScheduledReport.findById(req.params.id);
    if (!scheduled) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled report not found'
      });
    }

    const { frequency, day, time, recipients, format, status } = req.body;

    if (frequency) scheduled.frequency = frequency;
    if (day) scheduled.day = day;
    if (time) scheduled.time = time;
    if (recipients) scheduled.recipients = recipients;
    if (format) scheduled.format = format;
    if (status) scheduled.status = status;

    await scheduled.save();

    logger.info(`Scheduled report updated: ${scheduled._id}`);

    res.status(200).json({
      success: true,
      message: 'Scheduled report updated successfully',
      data: scheduled
    });
  } catch (error) {
    logger.error('Update scheduled report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update scheduled report',
      error: error.message
    });
  }
};

/**
 * Delete scheduled report
 */
const deleteScheduledReport = async (req, res) => {
  try {
    const scheduled = await ScheduledReport.findById(req.params.id);
    if (!scheduled) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled report not found'
      });
    }

    await scheduled.remove();

    logger.info(`Scheduled report deleted: ${scheduled._id}`);

    res.status(200).json({
      success: true,
      message: 'Scheduled report deleted successfully'
    });
  } catch (error) {
    logger.error('Delete scheduled report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete scheduled report',
      error: error.message
    });
  }
};

/**
 * Get categories
 */
const getCategories = async (req, res) => {
  try {
    const categories = await ReportCategory.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get categories',
      error: error.message
    });
  }
};

/**
 * Get category by ID
 */
const getCategoryById = async (req, res) => {
  try {
    const category = await ReportCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    logger.error('Get category by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get category',
      error: error.message
    });
  }
};

/**
 * Create category
 */
const createCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { name, description, icon } = req.body;

    const category = new ReportCategory({
      name,
      description,
      icon: icon || 'fa-file-alt',
      isActive: true
    });

    await category.save();

    logger.info(`Report category created: ${category.name}`);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    logger.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
};

/**
 * Update category
 */
const updateCategory = async (req, res) => {
  try {
    const category = await ReportCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const { name, description, icon, isActive } = req.body;

    if (name) category.name = name;
    if (description) category.description = description;
    if (icon) category.icon = icon;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    logger.info(`Report category updated: ${category.name}`);

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    logger.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message
    });
  }
};

/**
 * Delete category
 */
const deleteCategory = async (req, res) => {
  try {
    const category = await ReportCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    category.isActive = false;
    await category.save();

    logger.info(`Report category deactivated: ${category.name}`);

    res.status(200).json({
      success: true,
      message: 'Category deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate category',
      error: error.message
    });
  }
};

/**
 * Get report permissions
 */
const getReportPermissions = async (req, res) => {
  try {
    // Placeholder - would get report permissions
    const permissions = {
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canView: true,
      canExport: true
    };

    res.status(200).json({
      success: true,
      data: permissions
    });
  } catch (error) {
    logger.error('Get report permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get report permissions',
      error: error.message
    });
  }
};

/**
 * Update report permissions
 */
const updateReportPermissions = async (req, res) => {
  try {
    // Placeholder - would update report permissions
    res.status(200).json({
      success: true,
      message: 'Report permissions updated successfully'
    });
  } catch (error) {
    logger.error('Update report permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update report permissions',
      error: error.message
    });
  }
};

/**
 * Get report history
 */
const getReportHistory = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Placeholder - would get report history
    const history = [];

    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error('Get report history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get report history',
      error: error.message
    });
  }
};

/**
 * Get report version
 */
const getReportVersion = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const { version } = req.params;

    // Placeholder - would get specific version
    res.status(200).json({
      success: true,
      data: {
        version,
        reportId: report.reportId,
        name: report.name,
        data: {}
      }
    });
  } catch (error) {
    logger.error('Get report version error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get report version',
      error: error.message
    });
  }
};

/**
 * Restore report version
 */
const restoreReportVersion = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const { version } = req.params;

    // Placeholder - would restore version
    logger.info(`Report version ${version} restored for: ${report.reportId}`);

    res.status(200).json({
      success: true,
      message: `Report version ${version} restored successfully`
    });
  } catch (error) {
    logger.error('Restore report version error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore report version',
      error: error.message
    });
  }
};

/**
 * Get report stats
 */
const getReportStats = async (req, res) => {
  try {
    const [
      totalReports,
      draftReports,
      generatedReports,
      totalTypes,
      totalCategories
    ] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ status: 'Draft' }),
      Report.countDocuments({ status: 'Generated' }),
      ReportType.countDocuments({ isActive: true }),
      ReportCategory.countDocuments({ isActive: true })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalReports,
        draftReports,
        generatedReports,
        totalTypes,
        totalCategories
      }
    });
  } catch (error) {
    logger.error('Get report stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get report stats',
      error: error.message
    });
  }
};

module.exports = {
  getReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
  generateReport,
  scheduleReport,
  cancelScheduledReport,
  getReportTypes,
  getReportTypeById,
  createReportType,
  updateReportType,
  deleteReportType,
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getReportData,
  exportReport,
  downloadReport,
  getScheduledReports,
  createScheduledReport,
  updateScheduledReport,
  deleteScheduledReport,
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getReportPermissions,
  updateReportPermissions,
  getReportHistory,
  getReportVersion,
  restoreReportVersion,
  getReportStats
};
