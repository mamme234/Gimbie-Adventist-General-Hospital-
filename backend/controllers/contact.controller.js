/**
 * ============================================
 * CONTACT.CONTROLLER.JS - Contact Controller
 * ============================================
 */

const ContactInquiry = require('../models/ContactInquiry');
const ContactCategory = require('../models/ContactCategory');
const ContactForm = require('../models/ContactForm');
const ContactResponse = require('../models/ContactResponse');
const { validationResult } = require('express-validator');
const { logger } = require('../config/logger');
const { sendEmail } = require('../config/email');

/**
 * Get all inquiries
 */
const getInquiries = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category, priority } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    const inquiries = await ContactInquiry.find(query)
      .populate('category', 'name')
      .populate('assignedTo', 'firstName lastName')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await ContactInquiry.countDocuments(query);

    res.status(200).json({
      success: true,
      data: inquiries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get inquiries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get inquiries',
      error: error.message
    });
  }
};

/**
 * Get inquiry by ID
 */
const getInquiryById = async (req, res) => {
  try {
    const inquiry = await ContactInquiry.findById(req.params.id)
      .populate('category', 'name')
      .populate('assignedTo', 'firstName lastName')
      .populate('responses');

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    res.status(200).json({
      success: true,
      data: inquiry
    });
  } catch (error) {
    logger.error('Get inquiry by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get inquiry',
      error: error.message
    });
  }
};

/**
 * Create inquiry (Public)
 */
const createInquiry = async (req, res) => {
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
      email,
      phone,
      subject,
      message,
      category,
      priority
    } = req.body;

    const inquiryId = `INQ-${new Date().getFullYear()}-${String(await ContactInquiry.countDocuments() + 1).padStart(6, '0')}`;

    const inquiry = new ContactInquiry({
      inquiryId,
      name,
      email,
      phone,
      subject,
      message,
      category: category || null,
      priority: priority || 'Normal',
      status: 'New'
    });

    await inquiry.save();

    // Send auto-reply
    try {
      await sendEmail({
        to: email,
        subject: `Thank you for contacting us - ${inquiryId}`,
        template: 'contact-auto-reply',
        templateData: {
          name,
          inquiryId,
          subject
        }
      });
    } catch (emailError) {
      logger.error('Auto-reply email error:', emailError);
    }

    logger.info(`Contact inquiry created: ${inquiry.inquiryId}`);

    res.status(201).json({
      success: true,
      message: 'Inquiry submitted successfully',
      data: inquiry
    });
  } catch (error) {
    logger.error('Create inquiry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit inquiry',
      error: error.message
    });
  }
};

/**
 * Update inquiry
 */
const updateInquiry = async (req, res) => {
  try {
    const inquiry = await ContactInquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    const { status, priority, category, assignedTo, notes } = req.body;

    if (status) inquiry.status = status;
    if (priority) inquiry.priority = priority;
    if (category) inquiry.category = category;
    if (assignedTo) inquiry.assignedTo = assignedTo;
    if (notes) inquiry.notes = notes;

    await inquiry.save();

    logger.info(`Inquiry updated: ${inquiry.inquiryId}`);

    res.status(200).json({
      success: true,
      message: 'Inquiry updated successfully',
      data: inquiry
    });
  } catch (error) {
    logger.error('Update inquiry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inquiry',
      error: error.message
    });
  }
};

/**
 * Delete inquiry
 */
const deleteInquiry = async (req, res) => {
  try {
    const inquiry = await ContactInquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    inquiry.status = 'Archived';
    await inquiry.save();

    logger.info(`Inquiry archived: ${inquiry.inquiryId}`);

    res.status(200).json({
      success: true,
      message: 'Inquiry archived successfully'
    });
  } catch (error) {
    logger.error('Delete inquiry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive inquiry',
      error: error.message
    });
  }
};

/**
 * Get unread inquiries
 */
const getUnreadInquiries = async (req, res) => {
  try {
    const inquiries = await ContactInquiry.find({
      status: 'New'
    })
      .populate('category', 'name')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: inquiries
    });
  } catch (error) {
    logger.error('Get unread inquiries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread inquiries',
      error: error.message
    });
  }
};

/**
 * Get read inquiries
 */
const getReadInquiries = async (req, res) => {
  try {
    const inquiries = await ContactInquiry.find({
      status: { $in: ['Read', 'In Progress'] }
    })
      .populate('category', 'name')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: inquiries
    });
  } catch (error) {
    logger.error('Get read inquiries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get read inquiries',
      error: error.message
    });
  }
};

/**
 * Get inquiries by status
 */
const getInquiriesByStatus = async (req, res) => {
  try {
    const { status } = req.params;

    const inquiries = await ContactInquiry.find({ status })
      .populate('category', 'name')
      .populate('assignedTo', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: inquiries
    });
  } catch (error) {
    logger.error('Get inquiries by status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get inquiries by status',
      error: error.message
    });
  }
};

/**
 * Mark inquiry as read
 */
const markAsRead = async (req, res) => {
  try {
    const inquiry = await ContactInquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    inquiry.status = 'Read';
    inquiry.readAt = new Date();
    await inquiry.save();

    logger.info(`Inquiry marked as read: ${inquiry.inquiryId}`);

    res.status(200).json({
      success: true,
      message: 'Inquiry marked as read',
      data: inquiry
    });
  } catch (error) {
    logger.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark inquiry as read',
      error: error.message
    });
  }
};

/**
 * Mark inquiry as unread
 */
const markAsUnread = async (req, res) => {
  try {
    const inquiry = await ContactInquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    inquiry.status = 'New';
    inquiry.readAt = null;
    await inquiry.save();

    logger.info(`Inquiry marked as unread: ${inquiry.inquiryId}`);

    res.status(200).json({
      success: true,
      message: 'Inquiry marked as unread',
      data: inquiry
    });
  } catch (error) {
    logger.error('Mark as unread error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark inquiry as unread',
      error: error.message
    });
  }
};

/**
 * Assign inquiry
 */
const assignInquiry = async (req, res) => {
  try {
    const inquiry = await ContactInquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    const { assignedTo } = req.body;

    inquiry.assignedTo = assignedTo;
    inquiry.status = 'In Progress';
    await inquiry.save();

    logger.info(`Inquiry assigned: ${inquiry.inquiryId}`);

    res.status(200).json({
      success: true,
      message: 'Inquiry assigned successfully',
      data: inquiry
    });
  } catch (error) {
    logger.error('Assign inquiry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign inquiry',
      error: error.message
    });
  }
};

/**
 * Resolve inquiry
 */
const resolveInquiry = async (req, res) => {
  try {
    const inquiry = await ContactInquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    inquiry.status = 'Resolved';
    inquiry.resolvedAt = new Date();
    await inquiry.save();

    // Send resolution confirmation
    try {
      await sendEmail({
        to: inquiry.email,
        subject: `Inquiry Resolved - ${inquiry.inquiryId}`,
        template: 'inquiry-resolved',
        templateData: {
          name: inquiry.name,
          inquiryId: inquiry.inquiryId,
          subject: inquiry.subject
        }
      });
    } catch (emailError) {
      logger.error('Resolution email error:', emailError);
    }

    logger.info(`Inquiry resolved: ${inquiry.inquiryId}`);

    res.status(200).json({
      success: true,
      message: 'Inquiry resolved successfully',
      data: inquiry
    });
  } catch (error) {
    logger.error('Resolve inquiry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve inquiry',
      error: error.message
    });
  }
};

/**
 * Reopen inquiry
 */
const reopenInquiry = async (req, res) => {
  try {
    const inquiry = await ContactInquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    inquiry.status = 'In Progress';
    inquiry.resolvedAt = null;
    await inquiry.save();

    logger.info(`Inquiry reopened: ${inquiry.inquiryId}`);

    res.status(200).json({
      success: true,
      message: 'Inquiry reopened successfully',
      data: inquiry
    });
  } catch (error) {
    logger.error('Reopen inquiry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reopen inquiry',
      error: error.message
    });
  }
};

/**
 * Archive inquiry
 */
const archiveInquiry = async (req, res) => {
  try {
    const inquiry = await ContactInquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    inquiry.status = 'Archived';
    await inquiry.save();

    logger.info(`Inquiry archived: ${inquiry.inquiryId}`);

    res.status(200).json({
      success: true,
      message: 'Inquiry archived successfully',
      data: inquiry
    });
  } catch (error) {
    logger.error('Archive inquiry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive inquiry',
      error: error.message
    });
  }
};

/**
 * Get responses
 */
const getResponses = async (req, res) => {
  try {
    const { inquiryId } = req.query;
    let query = {};
    if (inquiryId) query.inquiry = inquiryId;

    const responses = await ContactResponse.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: responses
    });
  } catch (error) {
    logger.error('Get responses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get responses',
      error: error.message
    });
  }
};

/**
 * Get response by ID
 */
const getResponseById = async (req, res) => {
  try {
    const response = await ContactResponse.findById(req.params.id)
      .populate('inquiry', 'inquiryId subject')
      .populate('createdBy', 'firstName lastName');

    if (!response) {
      return res.status(404).json({
        success: false,
        message: 'Response not found'
      });
    }

    res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    logger.error('Get response by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get response',
      error: error.message
    });
  }
};

/**
 * Create response
 */
const createResponse = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { inquiryId, message, isInternal } = req.body;

    const inquiry = await ContactInquiry.findById(inquiryId);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    const response = new ContactResponse({
      inquiry: inquiryId,
      message,
      isInternal: isInternal || false,
      createdBy: req.user._id
    });

    await response.save();

    // If not internal, send email to customer
    if (!isInternal) {
      try {
        await sendEmail({
          to: inquiry.email,
          subject: `Response to your inquiry - ${inquiry.inquiryId}`,
          template: 'inquiry-response',
          templateData: {
            name: inquiry.name,
            inquiryId: inquiry.inquiryId,
            subject: inquiry.subject,
            response: message
          }
        });
      } catch (emailError) {
        logger.error('Response email error:', emailError);
      }

      // Update inquiry status
      inquiry.status = 'In Progress';
      await inquiry.save();
    }

    logger.info(`Response created for inquiry: ${inquiry.inquiryId}`);

    res.status(201).json({
      success: true,
      message: 'Response created successfully',
      data: response
    });
  } catch (error) {
    logger.error('Create response error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create response',
      error: error.message
    });
  }
};

/**
 * Update response
 */
const updateResponse = async (req, res) => {
  try {
    const response = await ContactResponse.findById(req.params.id);
    if (!response) {
      return res.status(404).json({
        success: false,
        message: 'Response not found'
      });
    }

    const { message, isInternal } = req.body;

    if (message) response.message = message;
    if (isInternal !== undefined) response.isInternal = isInternal;

    await response.save();

    logger.info(`Response updated: ${response._id}`);

    res.status(200).json({
      success: true,
      message: 'Response updated successfully',
      data: response
    });
  } catch (error) {
    logger.error('Update response error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update response',
      error: error.message
    });
  }
};

/**
 * Delete response
 */
const deleteResponse = async (req, res) => {
  try {
    const response = await ContactResponse.findById(req.params.id);
    if (!response) {
      return res.status(404).json({
        success: false,
        message: 'Response not found'
      });
    }

    await response.remove();

    logger.info(`Response deleted: ${response._id}`);

    res.status(200).json({
      success: true,
      message: 'Response deleted successfully'
    });
  } catch (error) {
    logger.error('Delete response error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete response',
      error: error.message
    });
  }
};

/**
 * Get inquiry responses
 */
const getInquiryResponses = async (req, res) => {
  try {
    const { inquiryId } = req.params;

    const responses = await ContactResponse.find({ inquiry: inquiryId })
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: responses
    });
  } catch (error) {
    logger.error('Get inquiry responses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get inquiry responses',
      error: error.message
    });
  }
};

/**
 * Get contact categories
 */
const getContactCategories = async (req, res) => {
  try {
    const categories = await ContactCategory.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error('Get contact categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get contact categories',
      error: error.message
    });
  }
};

/**
 * Get contact category by ID
 */
const getContactCategoryById = async (req, res) => {
  try {
    const category = await ContactCategory.findById(req.params.id);
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
    logger.error('Get contact category by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get contact category',
      error: error.message
    });
  }
};

/**
 * Create contact category
 */
const createContactCategory = async (req, res) => {
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

    const category = new ContactCategory({
      name,
      description,
      icon: icon || 'fa-tag',
      isActive: true
    });

    await category.save();

    logger.info(`Contact category created: ${category.name}`);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    logger.error('Create contact category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create contact category',
      error: error.message
    });
  }
};

/**
 * Update contact category
 */
const updateContactCategory = async (req, res) => {
  try {
    const category = await ContactCategory.findById(req.params.id);
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

    logger.info(`Contact category updated: ${category.name}`);

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    logger.error('Update contact category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact category',
      error: error.message
    });
  }
};

/**
 * Delete contact category
 */
const deleteContactCategory = async (req, res) => {
  try {
    const category = await ContactCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    category.isActive = false;
    await category.save();

    logger.info(`Contact category deactivated: ${category.name}`);

    res.status(200).json({
      success: true,
      message: 'Category deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete contact category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate contact category',
      error: error.message
    });
  }
};

/**
 * Get contact forms
 */
const getContactForms = async (req, res) => {
  try {
    const forms = await ContactForm.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: forms
    });
  } catch (error) {
    logger.error('Get contact forms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get contact forms',
      error: error.message
    });
  }
};

/**
 * Get contact form by ID
 */
const getContactFormById = async (req, res) => {
  try {
    const form = await ContactForm.findById(req.params.id);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Contact form not found'
      });
    }

    res.status(200).json({
      success: true,
      data: form
    });
  } catch (error) {
    logger.error('Get contact form by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get contact form',
      error: error.message
    });
  }
};

/**
 * Create contact form
 */
const createContactForm = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { name, fields, recipients, isActive } = req.body;

    const form = new ContactForm({
      name,
      fields: fields || [],
      recipients: recipients || [],
      isActive: isActive !== undefined ? isActive : true
    });

    await form.save();

    logger.info(`Contact form created: ${form.name}`);

    res.status(201).json({
      success: true,
      message: 'Contact form created successfully',
      data: form
    });
  } catch (error) {
    logger.error('Create contact form error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create contact form',
      error: error.message
    });
  }
};

/**
 * Update contact form
 */
const updateContactForm = async (req, res) => {
  try {
    const form = await ContactForm.findById(req.params.id);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Contact form not found'
      });
    }

    const { name, fields, recipients, isActive } = req.body;

    if (name) form.name = name;
    if (fields) form.fields = fields;
    if (recipients) form.recipients = recipients;
    if (isActive !== undefined) form.isActive = isActive;

    await form.save();

    logger.info(`Contact form updated: ${form.name}`);

    res.status(200).json({
      success: true,
      message: 'Contact form updated successfully',
      data: form
    });
  } catch (error) {
    logger.error('Update contact form error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact form',
      error: error.message
    });
  }
};

/**
 * Delete contact form
 */
const deleteContactForm = async (req, res) => {
  try {
    const form = await ContactForm.findById(req.params.id);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Contact form not found'
      });
    }

    form.isActive = false;
    await form.save();

    logger.info(`Contact form deactivated: ${form.name}`);

    res.status(200).json({
      success: true,
      message: 'Contact form deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete contact form error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate contact form',
      error: error.message
    });
  }
};

/**
 * Get form submissions
 */
const getFormSubmissions = async (req, res) => {
  try {
    const { formId } = req.params;

    // Placeholder - would get form submissions
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get form submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get form submissions',
      error: error.message
    });
  }
};

/**
 * Get contact settings
 */
const getContactSettings = async (req, res) => {
  try {
    // Placeholder - would get contact settings
    const settings = {
      autoReply: true,
      autoReplyTemplate: 'Thank you for contacting us...',
      notifyAdmin: true,
      adminEmail: 'admin@hospital.com',
      businessHours: {
        monday: '08:00-17:00',
        tuesday: '08:00-17:00',
        wednesday: '08:00-17:00',
        thursday: '08:00-17:00',
        friday: '08:00-17:00',
        saturday: '08:00-13:00',
        sunday: 'Closed'
      }
    };

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    logger.error('Get contact settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get contact settings',
      error: error.message
    });
  }
};

/**
 * Update contact settings
 */
const updateContactSettings = async (req, res) => {
  try {
    // Placeholder - would update contact settings
    res.status(200).json({
      success: true,
      message: 'Contact settings updated successfully'
    });
  } catch (error) {
    logger.error('Update contact settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact settings',
      error: error.message
    });
  }
};

/**
 * Get contact reports
 */
const getContactReports = async (req, res) => {
  try {
    // Placeholder - would generate contact reports
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get contact reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get contact reports',
      error: error.message
    });
  }
};

/**
 * Generate contact report
 */
const generateContactReport = async (req, res) => {
  try {
    // Placeholder - would generate report
    res.status(200).json({
      success: true,
      message: 'Report generated successfully'
    });
  } catch (error) {
    logger.error('Generate contact report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate contact report',
      error: error.message
    });
  }
};

/**
 * Get contact stats
 */
const getContactStats = async (req, res) => {
  try {
    const [
      totalInquiries,
      newInquiries,
      resolvedInquiries,
      inProgressInquiries
    ] = await Promise.all([
      ContactInquiry.countDocuments(),
      ContactInquiry.countDocuments({ status: 'New' }),
      ContactInquiry.countDocuments({ status: 'Resolved' }),
      ContactInquiry.countDocuments({ status: 'In Progress' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalInquiries,
        newInquiries,
        resolvedInquiries,
        inProgressInquiries,
        resolutionRate: totalInquiries > 0
          ? Math.round((resolvedInquiries / totalInquiries) * 100)
          : 0
      }
    });
  } catch (error) {
    logger.error('Get contact stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get contact stats',
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
      inquiriesToday,
      resolvedToday
    ] = await Promise.all([
      ContactInquiry.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      ContactInquiry.countDocuments({
        resolvedAt: { $gte: today, $lt: tomorrow }
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        date: today,
        inquiriesToday,
        resolvedToday
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
      inquiriesMonth,
      resolvedMonth
    ] = await Promise.all([
      ContactInquiry.countDocuments({ createdAt: { $gte: startOfMonth, $lt: endOfMonth } }),
      ContactInquiry.countDocuments({
        resolvedAt: { $gte: startOfMonth, $lt: endOfMonth }
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        month: startOfMonth,
        inquiriesMonth,
        resolvedMonth
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

module.exports = {
  getInquiries,
  getInquiryById,
  createInquiry,
  updateInquiry,
  deleteInquiry,
  getUnreadInquiries,
  getReadInquiries,
  getInquiriesByStatus,
  markAsRead,
  markAsUnread,
  assignInquiry,
  resolveInquiry,
  reopenInquiry,
  archiveInquiry,
  getResponses,
  getResponseById,
  createResponse,
  updateResponse,
  deleteResponse,
  getInquiryResponses,
  getContactCategories,
  getContactCategoryById,
  createContactCategory,
  updateContactCategory,
  deleteContactCategory,
  getContactForms,
  getContactFormById,
  createContactForm,
  updateContactForm,
  deleteContactForm,
  getFormSubmissions,
  getContactSettings,
  updateContactSettings,
  getContactReports,
  generateContactReport,
  getContactStats,
  getDailyStats,
  getMonthlyStats
};
