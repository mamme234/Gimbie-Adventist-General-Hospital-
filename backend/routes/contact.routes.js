/**
 * ============================================
 * CONTACT.ROUTES.JS - Contact Routes
 * ============================================
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const {
  // Contact Inquiries
  getInquiries,
  getInquiryById,
  createInquiry,
  updateInquiry,
  deleteInquiry,
  getUnreadInquiries,
  getReadInquiries,
  getInquiriesByStatus,
  
  // Inquiry Management
  markAsRead,
  markAsUnread,
  assignInquiry,
  resolveInquiry,
  reopenInquiry,
  archiveInquiry,
  
  // Inquiry Responses
  getResponses,
  getResponseById,
  createResponse,
  updateResponse,
  deleteResponse,
  getInquiryResponses,
  
  // Contact Categories
  getContactCategories,
  getContactCategoryById,
  createContactCategory,
  updateContactCategory,
  deleteContactCategory,
  
  // Contact Forms
  getContactForms,
  getContactFormById,
  createContactForm,
  updateContactForm,
  deleteContactForm,
  getFormSubmissions,
  
  // Contact Settings
  getContactSettings,
  updateContactSettings,
  
  // Contact Reports
  getContactReports,
  generateContactReport,
  
  // Contact Stats
  getContactStats,
  getDailyStats,
  getMonthlyStats,
} = require('../controllers/contact.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Validation rules
const inquiryIdValidation = [
  param('id').isMongoId().withMessage('Invalid inquiry ID'),
];

const createInquiryValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('phone').optional().isString(),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('category').optional().isString(),
  body('priority').isIn(['Low', 'Normal', 'High', 'Urgent']).withMessage('Invalid priority'),
];

const updateInquiryValidation = [
  body('status').optional().isIn(['New', 'Read', 'In Progress', 'Resolved', 'Closed', 'Archived']).withMessage('Invalid status'),
  body('priority').optional().isIn(['Low', 'Normal', 'High', 'Urgent']).withMessage('Invalid priority'),
  body('assignedTo').optional().isMongoId().withMessage('Invalid user ID'),
];

const responseValidation = [
  body('inquiryId').isMongoId().withMessage('Invalid inquiry ID'),
  body('message').notEmpty().withMessage('Response message is required'),
  body('isInternal').optional().isBoolean(),
];

const categoryValidation = [
  body('name').notEmpty().withMessage('Category name is required'),
  body('description').optional().isString(),
];

const formValidation = [
  body('name').notEmpty().withMessage('Form name is required'),
  body('fields').isArray().withMessage('Fields must be an array'),
  body('recipients').isArray().withMessage('Recipients must be an array'),
];

// Public routes (no auth required)
router.post('/', createInquiryValidation, createInquiry);

// Authenticated routes
router.use(authenticate);

// Contact Inquiries
router.get('/', authorize('admin', 'staff'), getInquiries);
router.get('/unread', authorize('admin', 'staff'), getUnreadInquiries);
router.get('/read', authorize('admin', 'staff'), getReadInquiries);
router.get('/status/:status', authorize('admin', 'staff'), getInquiriesByStatus);
router.get('/:id', authorize('admin', 'staff'), inquiryIdValidation, getInquiryById);
router.put('/:id', authorize('admin', 'staff'), inquiryIdValidation, updateInquiryValidation, updateInquiry);
router.delete('/:id', authorize('admin'), inquiryIdValidation, deleteInquiry);

// Inquiry Management
router.patch('/:id/read', authorize('admin', 'staff'), inquiryIdValidation, markAsRead);
router.patch('/:id/unread', authorize('admin', 'staff'), inquiryIdValidation, markAsUnread);
router.patch('/:id/assign', authorize('admin', 'staff'), inquiryIdValidation, assignInquiry);
router.patch('/:id/resolve', authorize('admin', 'staff'), inquiryIdValidation, resolveInquiry);
router.patch('/:id/reopen', authorize('admin', 'staff'), inquiryIdValidation, reopenInquiry);
router.patch('/:id/archive', authorize('admin', 'staff'), inquiryIdValidation, archiveInquiry);

// Inquiry Responses
router.get('/responses', authorize('admin', 'staff'), getResponses);
router.get('/responses/inquiry/:inquiryId', authorize('admin', 'staff'), getInquiryResponses);
router.post('/responses', authorize('admin', 'staff'), responseValidation, createResponse);
router.get('/responses/:id', authorize('admin', 'staff'), getResponseById);
router.put('/responses/:id', authorize('admin', 'staff'), responseValidation, updateResponse);
router.delete('/responses/:id', authorize('admin'), deleteResponse);

// Contact Categories
router.get('/categories', authorize('admin', 'staff'), getContactCategories);
router.post('/categories', authorize('admin'), categoryValidation, createContactCategory);
router.get('/categories/:id', getContactCategoryById);
router.put('/categories/:id', authorize('admin'), categoryValidation, updateContactCategory);
router.delete('/categories/:id', authorize('admin'), deleteContactCategory);

// Contact Forms
router.get('/forms', authorize('admin'), getContactForms);
router.post('/forms', authorize('admin'), formValidation, createContactForm);
router.get('/forms/:id', authorize('admin'), getContactFormById);
router.put('/forms/:id', authorize('admin'), formValidation, updateContactForm);
router.delete('/forms/:id', authorize('admin'), deleteContactForm);
router.get('/forms/:id/submissions', authorize('admin'), getFormSubmissions);

// Contact Settings
router.get('/settings', authorize('admin'), getContactSettings);
router.put('/settings', authorize('admin'), updateContactSettings);

// Contact Reports
router.get('/reports', authorize('admin'), getContactReports);
router.post('/reports/generate', authorize('admin'), generateContactReport);

// Contact Stats
router.get('/stats', authorize('admin'), getContactStats);
router.get('/stats/daily', authorize('admin'), getDailyStats);
router.get('/stats/monthly', authorize('admin'), getMonthlyStats);

module.exports = router;
