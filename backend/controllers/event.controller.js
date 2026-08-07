/**
 * ============================================
 * EVENT.CONTROLLER.JS - Event Controller
 * ============================================
 */

const Event = require('../models/Event');
const EventCategory = require('../models/EventCategory');
const EventRegistration = require('../models/EventRegistration');
const EventSpeaker = require('../models/EventSpeaker');
const EventAgenda = require('../models/EventAgenda');
const EventSponsor = require('../models/EventSponsor');
const EventFeedback = require('../models/EventFeedback');
const { validationResult } = require('express-validator');
const { logger } = require('../config/logger');
const { sendNotification } = require('../config/socket');
const { sendEmail } = require('../config/email');

/**
 * Get all events
 */
const getEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, status, featured, search, dateFrom, dateTo } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (category) query.category = category;
    if (status) query.status = status;
    if (featured === 'true') query.isFeatured = true;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }
    if (dateFrom || dateTo) {
      query.startDate = {};
      if (dateFrom) query.startDate.$gte = new Date(dateFrom);
      if (dateTo) query.startDate.$lte = new Date(dateTo);
    }

    const events = await Event.find(query)
      .populate('category', 'name slug')
      .populate('speakers', 'name title')
      .populate('sponsors', 'name level')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ startDate: 1 });

    const total = await Event.countDocuments(query);

    res.status(200).json({
      success: true,
      data: events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get events',
      error: error.message
    });
  }
};

/**
 * Get event by ID
 */
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('speakers', 'name title bio photo')
      .populate('sponsors', 'name logo website level')
      .populate('agenda');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Increment view count
    event.views += 1;
    await event.save();

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    logger.error('Get event by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get event',
      error: error.message
    });
  }
};

/**
 * Create event
 */
const createEvent = async (req, res) => {
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
      title,
      description,
      categoryId,
      startDate,
      endDate,
      location,
      capacity,
      speakers,
      sponsors,
      agenda,
      featuredImage,
      isFeatured,
      status,
      registrationDeadline,
      price,
      contactEmail,
      contactPhone,
      tags
    } = req.body;

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const event = new Event({
      title,
      slug,
      description,
      category: categoryId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      location,
      capacity: capacity || 0,
      speakers: speakers || [],
      sponsors: sponsors || [],
      agenda: agenda || [],
      featuredImage,
      isFeatured: isFeatured || false,
      status: status || 'Draft',
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
      price: price || 0,
      contactEmail,
      contactPhone,
      tags: tags || [],
      createdBy: req.user._id
    });

    await event.save();

    logger.info(`Event created: ${event.slug}`);

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });
  } catch (error) {
    logger.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event',
      error: error.message
    });
  }
};

/**
 * Update event
 */
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const {
      title,
      description,
      categoryId,
      startDate,
      endDate,
      location,
      capacity,
      speakers,
      sponsors,
      agenda,
      featuredImage,
      isFeatured,
      status,
      registrationDeadline,
      price,
      contactEmail,
      contactPhone,
      tags
    } = req.body;

    if (title) {
      event.title = title;
      event.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    if (description) event.description = description;
    if (categoryId) event.category = categoryId;
    if (startDate) event.startDate = new Date(startDate);
    if (endDate) event.endDate = new Date(endDate);
    if (location) event.location = location;
    if (capacity) event.capacity = capacity;
    if (speakers) event.speakers = speakers;
    if (sponsors) event.sponsors = sponsors;
    if (agenda) event.agenda = agenda;
    if (featuredImage) event.featuredImage = featuredImage;
    if (isFeatured !== undefined) event.isFeatured = isFeatured;
    if (status) event.status = status;
    if (registrationDeadline) event.registrationDeadline = new Date(registrationDeadline);
    if (price) event.price = price;
    if (contactEmail) event.contactEmail = contactEmail;
    if (contactPhone) event.contactPhone = contactPhone;
    if (tags) event.tags = tags;

    await event.save();

    logger.info(`Event updated: ${event.slug}`);

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });
  } catch (error) {
    logger.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event',
      error: error.message
    });
  }
};

/**
 * Delete event
 */
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    event.status = 'Cancelled';
    await event.save();

    logger.info(`Event cancelled: ${event.slug}`);

    res.status(200).json({
      success: true,
      message: 'Event cancelled successfully'
    });
  } catch (error) {
    logger.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel event',
      error: error.message
    });
  }
};

/**
 * Get upcoming events
 */
const getUpcomingEvents = async (req, res) => {
  try {
    const now = new Date();

    const events = await Event.find({
      startDate: { $gte: now },
      status: 'Published'
    })
      .populate('category', 'name slug')
      .sort({ startDate: 1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: events
    });
  } catch (error) {
    logger.error('Get upcoming events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get upcoming events',
      error: error.message
    });
  }
};

/**
 * Get ongoing events
 */
const getOngoingEvents = async (req, res) => {
  try {
    const now = new Date();

    const events = await Event.find({
      startDate: { $lte: now },
      endDate: { $gte: now },
      status: 'Published'
    })
      .populate('category', 'name slug')
      .sort({ startDate: 1 });

    res.status(200).json({
      success: true,
      data: events
    });
  } catch (error) {
    logger.error('Get ongoing events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ongoing events',
      error: error.message
    });
  }
};

/**
 * Get past events
 */
const getPastEvents = async (req, res) => {
  try {
    const now = new Date();

    const events = await Event.find({
      endDate: { $lt: now },
      status: 'Published'
    })
      .populate('category', 'name slug')
      .sort({ startDate: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: events
    });
  } catch (error) {
    logger.error('Get past events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get past events',
      error: error.message
    });
  }
};

/**
 * Get featured events
 */
const getFeaturedEvents = async (req, res) => {
  try {
    const events = await Event.find({
      isFeatured: true,
      status: 'Published'
    })
      .populate('category', 'name slug')
      .sort({ startDate: 1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: events
    });
  } catch (error) {
    logger.error('Get featured events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get featured events',
      error: error.message
    });
  }
};

/**
 * Get events by category
 */
const getEventsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const events = await Event.find({
      category: category,
      status: 'Published'
    })
      .sort({ startDate: 1 });

    res.status(200).json({
      success: true,
      data: events
    });
  } catch (error) {
    logger.error('Get events by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get events by category',
      error: error.message
    });
  }
};

/**
 * Get events by date
 */
const getEventsByDate = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);

    const events = await Event.find({
      startDate: { $gte: startOfDay, $lt: endOfDay },
      status: 'Published'
    })
      .populate('category', 'name slug')
      .sort({ startDate: 1 });

    res.status(200).json({
      success: true,
      data: events
    });
  } catch (error) {
    logger.error('Get events by date error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get events by date',
      error: error.message
    });
  }
};

/**
 * Search events
 */
const searchEvents = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const events = await Event.find({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { location: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } }
      ],
      status: 'Published'
    })
      .populate('category', 'name slug')
      .sort({ startDate: 1 })
      .limit(20);

    res.status(200).json({
      success: true,
      data: events
    });
  } catch (error) {
    logger.error('Search events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search events',
      error: error.message
    });
  }
};

/**
 * Get event categories
 */
const getEventCategories = async (req, res) => {
  try {
    const categories = await EventCategory.find().sort({ name: 1 });

    const categoriesWithCount = await Promise.all(categories.map(async (cat) => {
      const count = await Event.countDocuments({
        category: cat._id,
        status: 'Published'
      });
      return {
        ...cat.toObject(),
        eventCount: count
      };
    }));

    res.status(200).json({
      success: true,
      data: categoriesWithCount
    });
  } catch (error) {
    logger.error('Get event categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get event categories',
      error: error.message
    });
  }
};

/**
 * Get event category by ID
 */
const getEventCategoryById = async (req, res) => {
  try {
    const category = await EventCategory.findById(req.params.id);
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
    logger.error('Get event category by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get event category',
      error: error.message
    });
  }
};

/**
 * Create event category
 */
const createEventCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { name, slug, description, icon } = req.body;

    const category = new EventCategory({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description,
      icon: icon || 'fa-calendar',
      isActive: true
    });

    await category.save();

    logger.info(`Event category created: ${category.name}`);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    logger.error('Create event category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event category',
      error: error.message
    });
  }
};

/**
 * Update event category
 */
const updateEventCategory = async (req, res) => {
  try {
    const category = await EventCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const { name, slug, description, icon, isActive } = req.body;

    if (name) category.name = name;
    if (slug) category.slug = slug;
    if (description) category.description = description;
    if (icon) category.icon = icon;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    logger.info(`Event category updated: ${category.name}`);

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    logger.error('Update event category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event category',
      error: error.message
    });
  }
};

/**
 * Delete event category
 */
const deleteEventCategory = async (req, res) => {
  try {
    const category = await EventCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    category.isActive = false;
    await category.save();

    logger.info(`Event category deactivated: ${category.name}`);

    res.status(200).json({
      success: true,
      message: 'Category deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete event category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate event category',
      error: error.message
    });
  }
};

/**
 * Get registrations
 */
const getRegistrations = async (req, res) => {
  try {
    const { page = 1, limit = 20, eventId, status, attendeeType } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (eventId) query.event = eventId;
    if (status) query.status = status;
    if (attendeeType) query.attendeeType = attendeeType;

    const registrations = await EventRegistration.find(query)
      .populate('event', 'title startDate')
      .populate('user', 'firstName lastName email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await EventRegistration.countDocuments(query);

    res.status(200).json({
      success: true,
      data: registrations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get registrations',
      error: error.message
    });
  }
};

/**
 * Get registration by ID
 */
const getRegistrationById = async (req, res) => {
  try {
    const registration = await EventRegistration.findById(req.params.id)
      .populate('event', 'title startDate endDate location')
      .populate('user', 'firstName lastName email phone');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    res.status(200).json({
      success: true,
      data: registration
    });
  } catch (error) {
    logger.error('Get registration by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get registration',
      error: error.message
    });
  }
};

/**
 * Create registration
 */
const createRegistration = async (req, res) => {
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
      eventId,
      name,
      email,
      phone,
      attendeeType,
      organization,
      dietaryRequirements,
      specialRequests
    } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check capacity
    if (event.capacity > 0) {
      const registeredCount = await EventRegistration.countDocuments({
        event: eventId,
        status: { $ne: 'Cancelled' }
      });
      if (registeredCount >= event.capacity) {
        return res.status(400).json({
          success: false,
          message: 'Event is full'
        });
      }
    }

    // Check if already registered
    const existingRegistration = await EventRegistration.findOne({
      event: eventId,
      email
    });

    if (existingRegistration) {
      return res.status(409).json({
        success: false,
        message: 'Already registered for this event'
      });
    }

    const registrationId = `REG-${new Date().getFullYear()}-${String(await EventRegistration.countDocuments() + 1).padStart(6, '0')}`;

    const registration = new EventRegistration({
      registrationId,
      event: eventId,
      user: req.user?._id || null,
      name,
      email,
      phone,
      attendeeType: attendeeType || 'General',
      organization,
      dietaryRequirements,
      specialRequests,
      status: 'Pending'
    });

    await registration.save();

    // Send confirmation email
    try {
      await sendEmail({
        to: email,
        subject: `Registration Confirmed - ${event.title}`,
        template: 'event-registration',
        templateData: {
          name,
          eventTitle: event.title,
          eventDate: event.startDate,
          eventLocation: event.location,
          registrationId: registration.registrationId
        }
      });
    } catch (emailError) {
      logger.error('Registration email error:', emailError);
    }

    logger.info(`Registration created: ${registration.registrationId}`);

    res.status(201).json({
      success: true,
      message: 'Registration created successfully',
      data: registration
    });
  } catch (error) {
    logger.error('Create registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create registration',
      error: error.message
    });
  }
};

/**
 * Update registration
 */
const updateRegistration = async (req, res) => {
  try {
    const registration = await EventRegistration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    const { status, attendeeType, dietaryRequirements, specialRequests } = req.body;

    if (status) registration.status = status;
    if (attendeeType) registration.attendeeType = attendeeType;
    if (dietaryRequirements) registration.dietaryRequirements = dietaryRequirements;
    if (specialRequests) registration.specialRequests = specialRequests;

    await registration.save();

    logger.info(`Registration updated: ${registration.registrationId}`);

    res.status(200).json({
      success: true,
      message: 'Registration updated successfully',
      data: registration
    });
  } catch (error) {
    logger.error('Update registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update registration',
      error: error.message
    });
  }
};

/**
 * Delete registration
 */
const deleteRegistration = async (req, res) => {
  try {
    const registration = await EventRegistration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    registration.status = 'Cancelled';
    await registration.save();

    logger.info(`Registration cancelled: ${registration.registrationId}`);

    res.status(200).json({
      success: true,
      message: 'Registration cancelled successfully'
    });
  } catch (error) {
    logger.error('Delete registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel registration',
      error: error.message
    });
  }
};

/**
 * Get event registrations
 */
const getEventRegistrations = async (req, res) => {
  try {
    const { eventId } = req.params;

    const registrations = await EventRegistration.find({ event: eventId })
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: registrations
    });
  } catch (error) {
    logger.error('Get event registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get event registrations',
      error: error.message
    });
  }
};

/**
 * Get user registrations
 */
const getUserRegistrations = async (req, res) => {
  try {
    const registrations = await EventRegistration.find({ user: req.user._id })
      .populate('event', 'title startDate endDate location')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: registrations
    });
  } catch (error) {
    logger.error('Get user registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user registrations',
      error: error.message
    });
  }
};

/**
 * Approve registration
 */
const approveRegistration = async (req, res) => {
  try {
    const registration = await EventRegistration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    registration.status = 'Confirmed';
    registration.approvedAt = new Date();
    await registration.save();

    // Send approval email
    try {
      await sendEmail({
        to: registration.email,
        subject: 'Registration Approved',
        template: 'event-approval',
        templateData: {
          name: registration.name,
          eventTitle: registration.event.title,
          registrationId: registration.registrationId
        }
      });
    } catch (emailError) {
      logger.error('Approval email error:', emailError);
    }

    logger.info(`Registration approved: ${registration.registrationId}`);

    res.status(200).json({
      success: true,
      message: 'Registration approved successfully',
      data: registration
    });
  } catch (error) {
    logger.error('Approve registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve registration',
      error: error.message
    });
  }
};

/**
 * Reject registration
 */
const rejectRegistration = async (req, res) => {
  try {
    const registration = await EventRegistration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    const { rejectionReason } = req.body;

    registration.status = 'Rejected';
    registration.rejectionReason = rejectionReason;
    await registration.save();

    // Send rejection email
    try {
      await sendEmail({
        to: registration.email,
        subject: 'Registration Update',
        template: 'event-rejection',
        templateData: {
          name: registration.name,
          eventTitle: registration.event.title,
          reason: rejectionReason
        }
      });
    } catch (emailError) {
      logger.error('Rejection email error:', emailError);
    }

    logger.info(`Registration rejected: ${registration.registrationId}`);

    res.status(200).json({
      success: true,
      message: 'Registration rejected successfully',
      data: registration
    });
  } catch (error) {
    logger.error('Reject registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject registration',
      error: error.message
    });
  }
};

/**
 * Cancel registration
 */
const cancelRegistration = async (req, res) => {
  try {
    const registration = await EventRegistration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    registration.status = 'Cancelled';
    await registration.save();

    logger.info(`Registration cancelled: ${registration.registrationId}`);

    res.status(200).json({
      success: true,
      message: 'Registration cancelled successfully',
      data: registration
    });
  } catch (error) {
    logger.error('Cancel registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel registration',
      error: error.message
    });
  }
};

/**
 * Get speakers
 */
const getSpeakers = async (req, res) => {
  try {
    const speakers = await EventSpeaker.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: speakers
    });
  } catch (error) {
    logger.error('Get speakers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get speakers',
      error: error.message
    });
  }
};

/**
 * Get speaker by ID
 */
const getSpeakerById = async (req, res) => {
  try {
    const speaker = await EventSpeaker.findById(req.params.id);
    if (!speaker) {
      return res.status(404).json({
        success: false,
        message: 'Speaker not found'
      });
    }

    res.status(200).json({
      success: true,
      data: speaker
    });
  } catch (error) {
    logger.error('Get speaker by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get speaker',
      error: error.message
    });
  }
};

/**
 * Create speaker
 */
const createSpeaker = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { name, bio, photo, organization, title, socialLinks } = req.body;

    const speaker = new EventSpeaker({
      name,
      bio,
      photo,
      organization,
      title,
      socialLinks: socialLinks || {},
      isActive: true
    });

    await speaker.save();

    logger.info(`Speaker created: ${speaker.name}`);

    res.status(201).json({
      success: true,
      message: 'Speaker created successfully',
      data: speaker
    });
  } catch (error) {
    logger.error('Create speaker error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create speaker',
      error: error.message
    });
  }
};

/**
 * Update speaker
 */
const updateSpeaker = async (req, res) => {
  try {
    const speaker = await EventSpeaker.findById(req.params.id);
    if (!speaker) {
      return res.status(404).json({
        success: false,
        message: 'Speaker not found'
      });
    }

    const { name, bio, photo, organization, title, socialLinks, isActive } = req.body;

    if (name) speaker.name = name;
    if (bio) speaker.bio = bio;
    if (photo) speaker.photo = photo;
    if (organization) speaker.organization = organization;
    if (title) speaker.title = title;
    if (socialLinks) speaker.socialLinks = socialLinks;
    if (isActive !== undefined) speaker.isActive = isActive;

    await speaker.save();

    logger.info(`Speaker updated: ${speaker.name}`);

    res.status(200).json({
      success: true,
      message: 'Speaker updated successfully',
      data: speaker
    });
  } catch (error) {
    logger.error('Update speaker error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update speaker',
      error: error.message
    });
  }
};

/**
 * Delete speaker
 */
const deleteSpeaker = async (req, res) => {
  try {
    const speaker = await EventSpeaker.findById(req.params.id);
    if (!speaker) {
      return res.status(404).json({
        success: false,
        message: 'Speaker not found'
      });
    }

    speaker.isActive = false;
    await speaker.save();

    logger.info(`Speaker deactivated: ${speaker.name}`);

    res.status(200).json({
      success: true,
      message: 'Speaker deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete speaker error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate speaker',
      error: error.message
    });
  }
};

/**
 * Get event speakers
 */
const getEventSpeakers = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const speakers = await EventSpeaker.find({
      _id: { $in: event.speakers || [] },
      isActive: true
    });

    res.status(200).json({
      success: true,
      data: speakers
    });
  } catch (error) {
    logger.error('Get event speakers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get event speakers',
      error: error.message
    });
  }
};

/**
 * Get agenda
 */
const getAgenda = async (req, res) => {
  try {
    const agenda = await EventAgenda.find().sort({ time: 1 });

    res.status(200).json({
      success: true,
      data: agenda
    });
  } catch (error) {
    logger.error('Get agenda error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get agenda',
      error: error.message
    });
  }
};

/**
 * Get agenda item by ID
 */
const getAgendaItemById = async (req, res) => {
  try {
    const item = await EventAgenda.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Agenda item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    logger.error('Get agenda item by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get agenda item',
      error: error.message
    });
  }
};

/**
 * Create agenda item
 */
const createAgendaItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { eventId, time, title, description, speakerId, duration } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const agendaItem = new EventAgenda({
      event: eventId,
      time,
      title,
      description,
      speaker: speakerId,
      duration: duration || 30
    });

    await agendaItem.save();

    // Add to event agenda
    event.agenda.push(agendaItem._id);
    await event.save();

    logger.info(`Agenda item created for event: ${event.title}`);

    res.status(201).json({
      success: true,
      message: 'Agenda item created successfully',
      data: agendaItem
    });
  } catch (error) {
    logger.error('Create agenda item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create agenda item',
      error: error.message
    });
  }
};

/**
 * Update agenda item
 */
const updateAgendaItem = async (req, res) => {
  try {
    const agendaItem = await EventAgenda.findById(req.params.id);
    if (!agendaItem) {
      return res.status(404).json({
        success: false,
        message: 'Agenda item not found'
      });
    }

    const { time, title, description, speakerId, duration } = req.body;

    if (time) agendaItem.time = time;
    if (title) agendaItem.title = title;
    if (description) agendaItem.description = description;
    if (speakerId) agendaItem.speaker = speakerId;
    if (duration) agendaItem.duration = duration;

    await agendaItem.save();

    logger.info(`Agenda item updated: ${agendaItem._id}`);

    res.status(200).json({
      success: true,
      message: 'Agenda item updated successfully',
      data: agendaItem
    });
  } catch (error) {
    logger.error('Update agenda item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update agenda item',
      error: error.message
    });
  }
};

/**
 * Delete agenda item
 */
const deleteAgendaItem = async (req, res) => {
  try {
    const agendaItem = await EventAgenda.findById(req.params.id);
    if (!agendaItem) {
      return res.status(404).json({
        success: false,
        message: 'Agenda item not found'
      });
    }

    // Remove from event
    const event = await Event.findById(agendaItem.event);
    if (event) {
      event.agenda = event.agenda.filter(id => id.toString() !== agendaItem._id.toString());
      await event.save();
    }

    await agendaItem.remove();

    logger.info(`Agenda item deleted: ${agendaItem._id}`);

    res.status(200).json({
      success: true,
      message: 'Agenda item deleted successfully'
    });
  } catch (error) {
    logger.error('Delete agenda item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete agenda item',
      error: error.message
    });
  }
};

/**
 * Get event agenda
 */
const getEventAgenda = async (req, res) => {
  try {
    const { eventId } = req.params;

    const agenda = await EventAgenda.find({ event: eventId })
      .populate('speaker', 'name title')
      .sort({ time: 1 });

    res.status(200).json({
      success: true,
      data: agenda
    });
  } catch (error) {
    logger.error('Get event agenda error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get event agenda',
      error: error.message
    });
  }
};

/**
 * Get sponsors
 */
const getSponsors = async (req, res) => {
  try {
    const sponsors = await EventSponsor.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: sponsors
    });
  } catch (error) {
    logger.error('Get sponsors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sponsors',
      error: error.message
    });
  }
};

/**
 * Get sponsor by ID
 */
const getSponsorById = async (req, res) => {
  try {
    const sponsor = await EventSponsor.findById(req.params.id);
    if (!sponsor) {
      return res.status(404).json({
        success: false,
        message: 'Sponsor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: sponsor
    });
  } catch (error) {
    logger.error('Get sponsor by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sponsor',
      error: error.message
    });
  }
};

/**
 * Create sponsor
 */
const createSponsor = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { name, logo, website, level, description } = req.body;

    const sponsor = new EventSponsor({
      name,
      logo,
      website,
      level: level || 'Bronze',
      description,
      isActive: true
    });

    await sponsor.save();

    logger.info(`Sponsor created: ${sponsor.name}`);

    res.status(201).json({
      success: true,
      message: 'Sponsor created successfully',
      data: sponsor
    });
  } catch (error) {
    logger.error('Create sponsor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sponsor',
      error: error.message
    });
  }
};

/**
 * Update sponsor
 */
const updateSponsor = async (req, res) => {
  try {
    const sponsor = await EventSponsor.findById(req.params.id);
    if (!sponsor) {
      return res.status(404).json({
        success: false,
        message: 'Sponsor not found'
      });
    }

    const { name, logo, website, level, description, isActive } = req.body;

    if (name) sponsor.name = name;
    if (logo) sponsor.logo = logo;
    if (website) sponsor.website = website;
    if (level) sponsor.level = level;
    if (description) sponsor.description = description;
    if (isActive !== undefined) sponsor.isActive = isActive;

    await sponsor.save();

    logger.info(`Sponsor updated: ${sponsor.name}`);

    res.status(200).json({
      success: true,
      message: 'Sponsor updated successfully',
      data: sponsor
    });
  } catch (error) {
    logger.error('Update sponsor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update sponsor',
      error: error.message
    });
  }
};

/**
 * Delete sponsor
 */
const deleteSponsor = async (req, res) => {
  try {
    const sponsor = await EventSponsor.findById(req.params.id);
    if (!sponsor) {
      return res.status(404).json({
        success: false,
        message: 'Sponsor not found'
      });
    }

    sponsor.isActive = false;
    await sponsor.save();

    logger.info(`Sponsor deactivated: ${sponsor.name}`);

    res.status(200).json({
      success: true,
      message: 'Sponsor deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete sponsor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate sponsor',
      error: error.message
    });
  }
};

/**
 * Get event sponsors
 */
const getEventSponsors = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const sponsors = await EventSponsor.find({
      _id: { $in: event.sponsors || [] },
      isActive: true
    });

    res.status(200).json({
      success: true,
      data: sponsors
    });
  } catch (error) {
    logger.error('Get event sponsors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get event sponsors',
      error: error.message
    });
  }
};

/**
 * Get feedback
 */
const getFeedback = async (req, res) => {
  try {
    const { eventId } = req.query;
    let query = {};
    if (eventId) query.event = eventId;

    const feedback = await EventFeedback.find(query)
      .populate('user', 'firstName lastName')
      .populate('event', 'title')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    logger.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get feedback',
      error: error.message
    });
  }
};

/**
 * Get feedback by ID
 */
const getFeedbackById = async (req, res) => {
  try {
    const feedback = await EventFeedback.findById(req.params.id)
      .populate('user', 'firstName lastName')
      .populate('event', 'title');

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    logger.error('Get feedback by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get feedback',
      error: error.message
    });
  }
};

/**
 * Create feedback
 */
const createFeedback = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { eventId, rating, review, recommendations } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const feedback = new EventFeedback({
      event: eventId,
      user: req.user._id,
      rating,
      review,
      recommendations
    });

    await feedback.save();

    logger.info(`Feedback created for event: ${event.title}`);

    res.status(201).json({
      success: true,
      message: 'Feedback created successfully',
      data: feedback
    });
  } catch (error) {
    logger.error('Create feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create feedback',
      error: error.message
    });
  }
};

/**
 * Update feedback
 */
const updateFeedback = async (req, res) => {
  try {
    const feedback = await EventFeedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Check if user owns feedback
    if (feedback.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { rating, review, recommendations } = req.body;

    if (rating) feedback.rating = rating;
    if (review) feedback.review = review;
    if (recommendations) feedback.recommendations = recommendations;

    await feedback.save();

    logger.info(`Feedback updated: ${feedback._id}`);

    res.status(200).json({
      success: true,
      message: 'Feedback updated successfully',
      data: feedback
    });
  } catch (error) {
    logger.error('Update feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update feedback',
      error: error.message
    });
  }
};

/**
 * Delete feedback
 */
const deleteFeedback = async (req, res) => {
  try {
    const feedback = await EventFeedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Check if user owns feedback
    if (feedback.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await feedback.remove();

    logger.info(`Feedback deleted: ${feedback._id}`);

    res.status(200).json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    logger.error('Delete feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete feedback',
      error: error.message
    });
  }
};

/**
 * Get event feedback
 */
const getEventFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;

    const feedback = await EventFeedback.find({ event: eventId })
      .populate('user', 'firstName lastName')
      .sort({ createdAt: -1 });

    const averageRating = feedback.length > 0
      ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length
      : 0;

    res.status(200).json({
      success: true,
      data: {
        feedback,
        averageRating,
        total: feedback.length
      }
    });
  } catch (error) {
    logger.error('Get event feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get event feedback',
      error: error.message
    });
  }
};

/**
 * Send event notification
 */
const sendEventNotification = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const { message, subject } = req.body;

    // Get all registrations
    const registrations = await EventRegistration.find({
      event: event._id,
      status: 'Confirmed'
    });

    for (const reg of registrations) {
      try {
        await sendEmail({
          to: reg.email,
          subject: subject || `Update: ${event.title}`,
          template: 'event-notification',
          templateData: {
            name: reg.name,
            eventTitle: event.title,
            message: message || 'Please check the event details for updates.'
          }
        });
      } catch (emailError) {
        logger.error(`Notification email error for ${reg.email}:`, emailError);
      }
    }

    logger.info(`Event notification sent to ${registrations.length} registrants`);

    res.status(200).json({
      success: true,
      message: `Notification sent to ${registrations.length} registrants`
    });
  } catch (error) {
    logger.error('Send event notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send event notification',
      error: error.message
    });
  }
};

/**
 * Send reminder
 */
const sendReminder = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const registrations = await EventRegistration.find({
      event: event._id,
      status: 'Confirmed'
    });

    for (const reg of registrations) {
      try {
        await sendEmail({
          to: reg.email,
          subject: `Reminder: ${event.title}`,
          template: 'event-reminder',
          templateData: {
            name: reg.name,
            eventTitle: event.title,
            eventDate: event.startDate,
            eventLocation: event.location
          }
        });
      } catch (emailError) {
        logger.error(`Reminder email error for ${reg.email}:`, emailError);
      }
    }

    logger.info(`Event reminder sent to ${registrations.length} registrants`);

    res.status(200).json({
      success: true,
      message: `Reminder sent to ${registrations.length} registrants`
    });
  } catch (error) {
    logger.error('Send reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reminder',
      error: error.message
    });
  }
};

/**
 * Get event stats
 */
const getEventStats = async (req, res) => {
  try {
    const [
      totalEvents,
      publishedEvents,
      upcomingEvents,
      totalRegistrations,
      confirmedRegistrations,
      totalFeedback
    ] = await Promise.all([
      Event.countDocuments(),
      Event.countDocuments({ status: 'Published' }),
      Event.countDocuments({
        status: 'Published',
        startDate: { $gte: new Date() }
      }),
      EventRegistration.countDocuments(),
      EventRegistration.countDocuments({ status: 'Confirmed' }),
      EventFeedback.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalEvents,
        publishedEvents,
        upcomingEvents,
        totalRegistrations,
        confirmedRegistrations,
        totalFeedback,
        conversionRate: totalRegistrations > 0
          ? Math.round((confirmedRegistrations / totalRegistrations) * 100)
          : 0
      }
    });
  } catch (error) {
    logger.error('Get event stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get event stats',
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
      eventsToday,
      registrationsToday,
      feedbackToday
    ] = await Promise.all([
      Event.countDocuments({
        startDate: { $gte: today, $lt: tomorrow },
        status: 'Published'
      }),
      EventRegistration.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow }
      }),
      EventFeedback.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow }
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        date: today,
        eventsToday,
        registrationsToday,
        feedbackToday
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
      eventsMonth,
      registrationsMonth,
      feedbackMonth
    ] = await Promise.all([
      Event.countDocuments({
        startDate: { $gte: startOfMonth, $lt: endOfMonth },
        status: 'Published'
      }),
      EventRegistration.countDocuments({
        createdAt: { $gte: startOfMonth, $lt: endOfMonth }
      }),
      EventFeedback.countDocuments({
        createdAt: { $gte: startOfMonth, $lt: endOfMonth }
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        month: startOfMonth,
        eventsMonth,
        registrationsMonth,
        feedbackMonth
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

/**
 * Get event reports
 */
const getEventReports = async (req, res) => {
  try {
    // Placeholder - would generate event reports
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get event reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get event reports',
      error: error.message
    });
  }
};

/**
 * Generate event report
 */
const generateEventReport = async (req, res) => {
  try {
    // Placeholder - would generate report
    res.status(200).json({
      success: true,
      message: 'Report generated successfully'
    });
  } catch (error) {
    logger.error('Generate event report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate event report',
      error: error.message
    });
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getUpcomingEvents,
  getOngoingEvents,
  getPastEvents,
  getFeaturedEvents,
  getEventsByCategory,
  getEventsByDate,
  searchEvents,
  getEventCategories,
  getEventCategoryById,
  createEventCategory,
  updateEventCategory,
  deleteEventCategory,
  getRegistrations,
  getRegistrationById,
  createRegistration,
  updateRegistration,
  deleteRegistration,
  getEventRegistrations,
  getUserRegistrations,
  approveRegistration,
  rejectRegistration,
  cancelRegistration,
  getSpeakers,
  getSpeakerById,
  createSpeaker,
  updateSpeaker,
  deleteSpeaker,
  getEventSpeakers,
  getAgenda,
  getAgendaItemById,
  createAgendaItem,
  updateAgendaItem,
  deleteAgendaItem,
  getEventAgenda,
  getSponsors,
  getSponsorById,
  createSponsor,
  updateSponsor,
  deleteSponsor,
  getEventSponsors,
  getFeedback,
  getFeedbackById,
  createFeedback,
  updateFeedback,
  deleteFeedback,
  getEventFeedback,
  sendEventNotification,
  sendReminder,
  getEventStats,
  getDailyStats,
  getMonthlyStats,
  getEventReports,
  generateEventReport
};
