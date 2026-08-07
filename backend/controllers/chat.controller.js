/**
 * ============================================
 * CHAT.CONTROLLER.JS - Chat Controller
 * ============================================
 */

const Chat = require('../models/Chat');
const Message = require('../models/Message');
const ChatParticipant = require('../models/ChatParticipant');
const Attachment = require('../models/Attachment');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { logger } = require('../config/logger');
const { sendNotification } = require('../config/socket');

// ============================================
// CHAT MANAGEMENT
// ============================================

/**
 * Get all chats
 */
const getChats = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const participantQuery = { user: req.user._id };
    const participants = await ChatParticipant.find(participantQuery);
    const chatIds = participants.map(p => p.chat);

    let query = { _id: { $in: chatIds } };
    if (type) query.type = type;

    const chats = await Chat.find(query)
      .populate('participants.user', 'firstName lastName profileImage')
      .populate('lastMessage')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ updatedAt: -1 });

    const total = await Chat.countDocuments(query);

    const chatsWithUnread = await Promise.all(chats.map(async (chat) => {
      const unreadCount = await Message.countDocuments({
        chat: chat._id,
        readBy: { $ne: req.user._id }
      });
      return {
        ...chat.toObject(),
        unreadCount
      };
    }));

    res.status(200).json({
      success: true,
      data: chatsWithUnread,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get chats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chats',
      error: error.message
    });
  }
};

/**
 * Get chat by ID
 */
const getChatById = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate('participants.user', 'firstName lastName profileImage')
      .populate('lastMessage');

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    const isParticipant = chat.participants.some(
      p => p.user._id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const unreadCount = await Message.countDocuments({
      chat: chat._id,
      readBy: { $ne: req.user._id }
    });

    res.status(200).json({
      success: true,
      data: {
        ...chat.toObject(),
        unreadCount
      }
    });
  } catch (error) {
    logger.error('Get chat by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat',
      error: error.message
    });
  }
};

/**
 * Create chat
 */
const createChat = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { participants, type, name, isGroup } = req.body;

    const participantIds = participants.map(p => p.user || p);
    if (!participantIds.includes(req.user._id.toString())) {
      participantIds.push(req.user._id);
    }

    if (type === 'Individual' && participantIds.length === 2) {
      const existingChat = await Chat.findOne({
        type: 'Individual',
        'participants.user': { $all: participantIds }
      });
      if (existingChat) {
        return res.status(409).json({
          success: false,
          message: 'Chat already exists',
          data: existingChat
        });
      }
    }

    const chat = new Chat({
      type: type || 'Individual',
      name: name || null,
      isGroup: isGroup || false,
      participants: participantIds.map(id => ({ user: id })),
      createdBy: req.user._id
    });

    await chat.save();
    await chat.populate('participants.user', 'firstName lastName profileImage');

    logger.info(`Chat created: ${chat._id}`);

    res.status(201).json({
      success: true,
      message: 'Chat created successfully',
      data: chat
    });
  } catch (error) {
    logger.error('Create chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create chat',
      error: error.message
    });
  }
};

/**
 * Update chat
 */
const updateChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    const { name, isGroup } = req.body;

    if (name) chat.name = name;
    if (isGroup !== undefined) chat.isGroup = isGroup;

    await chat.save();

    logger.info(`Chat updated: ${chat._id}`);

    res.status(200).json({
      success: true,
      message: 'Chat updated successfully',
      data: chat
    });
  } catch (error) {
    logger.error('Update chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update chat',
      error: error.message
    });
  }
};

/**
 * Delete chat
 */
const deleteChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    if (chat.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await Message.deleteMany({ chat: chat._id });
    await ChatParticipant.deleteMany({ chat: chat._id });
    await chat.remove();

    logger.info(`Chat deleted: ${chat._id}`);

    res.status(200).json({
      success: true,
      message: 'Chat deleted successfully'
    });
  } catch (error) {
    logger.error('Delete chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete chat',
      error: error.message
    });
  }
};

/**
 * Get user chats
 */
const getUserChats = async (req, res) => {
  try {
    const { userId } = req.params;

    const participants = await ChatParticipant.find({ user: userId });
    const chatIds = participants.map(p => p.chat);

    const chats = await Chat.find({ _id: { $in: chatIds } })
      .populate('participants.user', 'firstName lastName profileImage')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: chats
    });
  } catch (error) {
    logger.error('Get user chats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user chats',
      error: error.message
    });
  }
};

/**
 * Get active chats
 */
const getActiveChats = async (req, res) => {
  try {
    const participants = await ChatParticipant.find({ user: req.user._id });
    const chatIds = participants.map(p => p.chat);

    const chats = await Chat.find({
      _id: { $in: chatIds },
      updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
      .populate('participants.user', 'firstName lastName profileImage')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: chats
    });
  } catch (error) {
    logger.error('Get active chats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active chats',
      error: error.message
    });
  }
};

// ============================================
// MESSAGE MANAGEMENT
// ============================================

/**
 * Get messages
 */
const getMessages = async (req, res) => {
  try {
    const { page = 1, limit = 50, chatId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (chatId) query.chat = chatId;

    const messages = await Message.find(query)
      .populate('sender', 'firstName lastName profileImage')
      .populate('attachments')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Message.countDocuments(query);

    res.status(200).json({
      success: true,
      data: messages.reverse(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get messages',
      error: error.message
    });
  }
};

/**
 * Get message by ID
 */
const getMessageById = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate('sender', 'firstName lastName profileImage')
      .populate('attachments');

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    logger.error('Get message by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get message',
      error: error.message
    });
  }
};

/**
 * Send message
 */
const sendMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { chatId, content, type, attachments } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    const isParticipant = chat.participants.some(
      p => p.user.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const message = new Message({
      chat: chatId,
      sender: req.user._id,
      content,
      type: type || 'Text',
      attachments: attachments || [],
      readBy: [req.user._id]
    });

    await message.save();

    chat.lastMessage = message._id;
    chat.updatedAt = new Date();
    await chat.save();

    await message.populate('sender', 'firstName lastName profileImage');

    const otherParticipants = chat.participants.filter(
      p => p.user.toString() !== req.user._id.toString()
    );

    for (const participant of otherParticipants) {
      sendNotification(`user:${participant.user}`, {
        type: 'NEW_MESSAGE',
        chatId: chat._id,
        messageId: message._id,
        sender: `${req.user.firstName} ${req.user.lastName}`,
        content: content.substring(0, 100)
      });
    }

    logger.info(`Message sent in chat: ${chatId}`);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    logger.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
};

/**
 * Update message
 */
const updateMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { content } = req.body;

    if (content) {
      message.content = content;
      message.isEdited = true;
      message.editedAt = new Date();
      await message.save();
    }

    logger.info(`Message updated: ${message._id}`);

    res.status(200).json({
      success: true,
      message: 'Message updated successfully',
      data: message
    });
  } catch (error) {
    logger.error('Update message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update message',
      error: error.message
    });
  }
};

/**
 * Delete message
 */
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.sender.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    message.isDeleted = true;
    message.content = 'This message was deleted';
    await message.save();

    logger.info(`Message deleted: ${message._id}`);

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    logger.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: error.message
    });
  }
};

/**
 * Get chat messages
 */
const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Message.find({ chat: chatId })
      .populate('sender', 'firstName lastName profileImage')
      .populate('attachments')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Message.countDocuments({ chat: chatId });

    await Message.updateMany(
      {
        chat: chatId,
        readBy: { $ne: req.user._id }
      },
      { $addToSet: { readBy: req.user._id } }
    );

    res.status(200).json({
      success: true,
      data: messages.reverse(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get chat messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat messages',
      error: error.message
    });
  }
};

/**
 * Mark message as read
 */
const markMessageRead = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (!message.readBy.includes(req.user._id)) {
      message.readBy.push(req.user._id);
      await message.save();
    }

    res.status(200).json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    logger.error('Mark message read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark message as read',
      error: error.message
    });
  }
};

/**
 * Mark all messages as read
 */
const markAllRead = async (req, res) => {
  try {
    const { chatId } = req.params;

    await Message.updateMany(
      {
        chat: chatId,
        readBy: { $ne: req.user._id }
      },
      { $addToSet: { readBy: req.user._id } }
    );

    res.status(200).json({
      success: true,
      message: 'All messages marked as read'
    });
  } catch (error) {
    logger.error('Mark all read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all messages as read',
      error: error.message
    });
  }
};

// ============================================
// ATTACHMENT MANAGEMENT
// ============================================

/**
 * Get attachments
 */
const getAttachments = async (req, res) => {
  try {
    const { page = 1, limit = 20, chatId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (chatId) query.chat = chatId;

    const attachments = await Attachment.find(query)
      .populate('uploadedBy', 'firstName lastName')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Attachment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: attachments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get attachments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attachments',
      error: error.message
    });
  }
};

/**
 * Get attachment by ID
 */
const getAttachmentById = async (req, res) => {
  try {
    const attachment = await Attachment.findById(req.params.id)
      .populate('uploadedBy', 'firstName lastName');

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: attachment
    });
  } catch (error) {
    logger.error('Get attachment by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attachment',
      error: error.message
    });
  }
};

/**
 * Upload attachment
 */
const uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { chatId, messageId } = req.body;

    const attachment = new Attachment({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: `/uploads/${req.file.filename}`,
      uploadedBy: req.user._id,
      chat: chatId,
      message: messageId
    });

    await attachment.save();

    if (messageId) {
      await Message.findByIdAndUpdate(messageId, {
        $addToSet: { attachments: attachment._id }
      });
    }

    logger.info(`Attachment uploaded: ${attachment.filename}`);

    res.status(201).json({
      success: true,
      message: 'Attachment uploaded successfully',
      data: attachment
    });
  } catch (error) {
    logger.error('Upload attachment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload attachment',
      error: error.message
    });
  }
};

/**
 * Delete attachment
 */
const deleteAttachment = async (req, res) => {
  try {
    const attachment = await Attachment.findById(req.params.id);
    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    if (attachment.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (attachment.message) {
      await Message.findByIdAndUpdate(attachment.message, {
        $pull: { attachments: attachment._id }
      });
    }

    await attachment.remove();

    logger.info(`Attachment deleted: ${attachment.filename}`);

    res.status(200).json({
      success: true,
      message: 'Attachment deleted successfully'
    });
  } catch (error) {
    logger.error('Delete attachment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete attachment',
      error: error.message
    });
  }
};

// ============================================
// TYPING INDICATORS
// ============================================

/**
 * Set typing indicator
 */
const setTyping = async (req, res) => {
  try {
    const { chatId } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    const otherParticipants = chat.participants.filter(
      p => p.user.toString() !== req.user._id.toString()
    );

    for (const participant of otherParticipants) {
      sendNotification(`user:${participant.user}`, {
        type: 'TYPING',
        chatId: chat._id,
        userId: req.user._id,
        name: `${req.user.firstName} ${req.user.lastName}`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Typing status updated'
    });
  } catch (error) {
    logger.error('Set typing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set typing status',
      error: error.message
    });
  }
};

/**
 * Clear typing indicator
 */
const clearTyping = async (req, res) => {
  try {
    const { chatId } = req.body;

    const chat = await Chat.findById(chatId);
    if (chat) {
      const otherParticipants = chat.participants.filter(
        p => p.user.toString() !== req.user._id.toString()
      );

      for (const participant of otherParticipants) {
        sendNotification(`user:${participant.user}`, {
          type: 'TYPING_STOPPED',
          chatId: chat._id,
          userId: req.user._id
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Typing cleared'
    });
  } catch (error) {
    logger.error('Clear typing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear typing status',
      error: error.message
    });
  }
};

/**
 * Get typing status
 */
const getTypingStatus = async (req, res) => {
  try {
    const { chatId } = req.params;

    const typingUsers = [];

    res.status(200).json({
      success: true,
      data: typingUsers
    });
  } catch (error) {
    logger.error('Get typing status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get typing status',
      error: error.message
    });
  }
};

// ============================================
// CHAT PARTICIPANTS
// ============================================

/**
 * Add participant
 */
const addParticipant = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    const { userId } = req.body;

    const isParticipant = chat.participants.some(
      p => p.user.toString() === userId
    );

    if (isParticipant) {
      return res.status(409).json({
        success: false,
        message: 'User is already a participant'
      });
    }

    chat.participants.push({ user: userId });
    await chat.save();

    await chat.populate('participants.user', 'firstName lastName profileImage');

    logger.info(`User added to chat: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Participant added successfully',
      data: chat
    });
  } catch (error) {
    logger.error('Add participant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add participant',
      error: error.message
    });
  }
};

/**
 * Remove participant
 */
const removeParticipant = async (req, res) => {
  try {
    const { id: chatId, userId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    if (chat.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    chat.participants = chat.participants.filter(
      p => p.user.toString() !== userId
    );
    await chat.save();

    logger.info(`User removed from chat: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Participant removed successfully',
      data: chat
    });
  } catch (error) {
    logger.error('Remove participant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove participant',
      error: error.message
    });
  }
};

/**
 * Get participants
 */
const getParticipants = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate('participants.user', 'firstName lastName profileImage');

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    res.status(200).json({
      success: true,
      data: chat.participants
    });
  } catch (error) {
    logger.error('Get participants error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get participants',
      error: error.message
    });
  }
};

// ============================================
// CHAT SETTINGS
// ============================================

/**
 * Get chat settings
 */
const getChatSettings = async (req, res) => {
  try {
    const settings = {
      typingEnabled: true,
      readReceipts: true,
      messageDeletion: true,
      fileSharing: true,
      maxFileSize: 10485760 // 10MB
    };
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    logger.error('Get chat settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat settings',
      error: error.message
    });
  }
};

/**
 * Update chat settings
 */
const updateChatSettings = async (req, res) => {
  try {
    const { typingEnabled, readReceipts, messageDeletion, fileSharing, maxFileSize } = req.body;
    res.status(200).json({
      success: true,
      message: 'Chat settings updated successfully',
      data: { typingEnabled, readReceipts, messageDeletion, fileSharing, maxFileSize }
    });
  } catch (error) {
    logger.error('Update chat settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update chat settings',
      error: error.message
    });
  }
};

// ============================================
// UNREAD COUNTS
// ============================================

/**
 * Get unread count
 */
const getUnreadCount = async (req, res) => {
  try {
    const { chatId } = req.params;

    const unreadCount = await Message.countDocuments({
      chat: chatId,
      readBy: { $ne: req.user._id }
    });

    res.status(200).json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    logger.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message
    });
  }
};

/**
 * Get unread counts for all chats
 */
const getUnreadCounts = async (req, res) => {
  try {
    const participants = await ChatParticipant.find({ user: req.user._id });
    const chatIds = participants.map(p => p.chat);

    const unreadCounts = await Message.aggregate([
      { $match: { chat: { $in: chatIds }, readBy: { $ne: req.user._id } } },
      { $group: { _id: '$chat', count: { $sum: 1 } } }
    ]);

    const result = {};
    for (const item of unreadCounts) {
      result[item._id] = item.count;
    }

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Get unread counts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread counts',
      error: error.message
    });
  }
};

// ============================================
// CHAT REPORTS
// ============================================

/**
 * Get chat reports
 */
const getChatReports = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get chat reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat reports',
      error: error.message
    });
  }
};

/**
 * Generate chat report
 */
const generateChatReport = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Chat report generated successfully'
    });
  } catch (error) {
    logger.error('Generate chat report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate chat report',
      error: error.message
    });
  }
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Chat Management
  getChats,
  getChatById,
  createChat,
  updateChat,
  deleteChat,
  getUserChats,
  getActiveChats,

  // Message Management
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
  getChatReports,
  generateChatReport
};
