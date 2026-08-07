/**
 * ============================================
 * CHAT.ROUTES.JS - Chat Routes
 * ============================================
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const {
  // Chats
  getChats,
  getChatById,
  createChat,
  updateChat,
  deleteChat,
  getUserChats,
  getActiveChats,
  
  // Messages
  getMessages,
  getMessageById,
  sendMessage,
  updateMessage,
  deleteMessage,
  getChatMessages,
  markMessageRead,
  markAllRead,
  
  // Attachments
  getAttachments,
  getAttachmentById,
  uploadAttachment,
  deleteAttachment,
  
  // Typing Indicators
  setTyping,
  clearTyping,
  getTypingStatus,
  
  // Chat Participants
  addParticipant,
  removeParticipant,
  getParticipants,
  
  // Chat Settings
  getChatSettings,
  updateChatSettings,
  
  // Unread Counts
  getUnreadCount,
  getUnreadCounts,
  
  // Chat Reports
  getReports,
  generateReport,
} = require('../controllers/chat.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { multerConfig, handleMulterError } = require('../config/multer');

const router = express.Router();

// Validation rules
const chatIdValidation = [
  param('id').isMongoId().withMessage('Invalid chat ID'),
];

const messageIdValidation = [
  param('id').isMongoId().withMessage('Invalid message ID'),
];

const createChatValidation = [
  body('participants').isArray().withMessage('Participants must be an array'),
  body('type').isIn(['Individual', 'Group', 'Department']).withMessage('Invalid chat type'),
  body('name').optional().isString(),
];

const sendMessageValidation = [
  body('chatId').isMongoId().withMessage('Invalid chat ID'),
  body('content').notEmpty().withMessage('Message content is required'),
  body('type').isIn(['Text', 'Image', 'File', 'Audio', 'Video']).withMessage('Invalid message type'),
];

const updateMessageValidation = [
  body('content').notEmpty().withMessage('Message content is required'),
];

const participantValidation = [
  body('userId').isMongoId().withMessage('Invalid user ID'),
];

// All routes require authentication
router.use(authenticate);

// Chats
router.get('/chats', getChats);
router.get('/chats/active', getActiveChats);
router.get('/chats/user/:userId', getUserChats);
router.post('/chats', createChatValidation, createChat);
router.get('/chats/:id', chatIdValidation, getChatById);
router.put('/chats/:id', chatIdValidation, createChatValidation, updateChat);
router.delete('/chats/:id', chatIdValidation, deleteChat);

// Messages
router.get('/messages', getMessages);
router.get('/messages/chat/:chatId', getChatMessages);
router.post('/messages', sendMessageValidation, sendMessage);
router.get('/messages/:id', messageIdValidation, getMessageById);
router.put('/messages/:id', messageIdValidation, updateMessageValidation, updateMessage);
router.delete('/messages/:id', messageIdValidation, deleteMessage);
router.patch('/messages/:id/read', messageIdValidation, markMessageRead);
router.patch('/messages/chat/:chatId/read', chatIdValidation, markAllRead);

// Attachments
router.get('/attachments', getAttachments);
router.get('/attachments/:id', getAttachmentById);
router.post('/attachments/upload', multerConfig.general.single('file'), handleMulterError, uploadAttachment);
router.delete('/attachments/:id', deleteAttachment);

// Typing Indicators
router.post('/typing', setTyping);
router.delete('/typing', clearTyping);
router.get('/typing/:chatId', getTypingStatus);

// Chat Participants
router.post('/chats/:id/participants', chatIdValidation, participantValidation, addParticipant);
router.delete('/chats/:id/participants/:userId', chatIdValidation, removeParticipant);
router.get('/chats/:id/participants', chatIdValidation, getParticipants);

// Chat Settings
router.get('/settings', getChatSettings);
router.put('/settings', updateChatSettings);

// Unread Counts
router.get('/unread', getUnreadCounts);
router.get('/unread/:chatId', chatIdValidation, getUnreadCount);

// Reports
router.get('/reports', getReports);
router.post('/reports/generate', generateReport);

module.exports = router;
