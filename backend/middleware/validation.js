// middleware/validation.js
const Joi = require('joi');
const { AuditLog } = require('../models/AuditLog');

const validationMiddleware = {
  // Validate request body
  body: (schema) => {
    return (req, res, next) => {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
        errors: {
          wrap: {
            label: ''
          }
        }
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));

        // Log validation error
        AuditLog.logAction({
          action: 'validation',
          resource: 'request',
          userId: req.user?._id || null,
          details: {
            errors,
            body: req.body,
            url: req.originalUrl
          },
          status: 'failure',
          severity: 'warning'
        }).catch(console.error);

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          errors
        });
      }

      req.validatedBody = value;
      next();
    };
  },

  // Validate request query
  query: (schema) => {
    return (req, res, next) => {
      const { error, value } = schema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));

        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          code: 'VALIDATION_ERROR',
          errors
        });
      }

      req.validatedQuery = value;
      next();
    };
  },

  // Validate request params
  params: (schema) => {
    return (req, res, next) => {
      const { error, value } = schema.validate(req.params, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));

        return res.status(400).json({
          success: false,
          message: 'Invalid request parameters',
          code: 'VALIDATION_ERROR',
          errors
        });
      }

      req.validatedParams = value;
      next();
    };
  },

  // Combined validation
  validate: (schemas) => {
    return (req, res, next) => {
      const validationPromises = [];
      const errors = [];

      if (schemas.body) {
        const { error, value } = schemas.body.validate(req.body);
        if (error) errors.push(...error.details.map(d => ({ ...d, source: 'body' })));
        else req.validatedBody = value;
      }

      if (schemas.query) {
        const { error, value } = schemas.query.validate(req.query);
        if (error) errors.push(...error.details.map(d => ({ ...d, source: 'query' })));
        else req.validatedQuery = value;
      }

      if (schemas.params) {
        const { error, value } = schemas.params.validate(req.params);
        if (error) errors.push(...error.details.map(d => ({ ...d, source: 'params' })));
        else req.validatedParams = value;
      }

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          errors: errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
            source: e.source
          }))
        });
      }

      next();
    };
  },

  // Custom sanitization
  sanitize: (req, res, next) => {
    // Sanitize body
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          // Trim strings
          req.body[key] = req.body[key].trim();
          // Remove potential XSS
          req.body[key] = sanitizeHtml(req.body[key]);
        }
      });
    }
    next();
  }
};

// Helper function to sanitize HTML
function sanitizeHtml(str) {
  // Basic HTML sanitization
  return str.replace(/<[^>]*>/g, '');
}

// Common validation schemas
const schemas = {
  // Pagination schema
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().valid('asc', 'desc').default('desc'),
    sortBy: Joi.string().default('createdAt')
  }),

  // ID schema
  id: Joi.object({
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
  }),

  // Date range schema
  dateRange: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')),
    timezone: Joi.string().default('UTC')
  }),

  // Search schema
  search: Joi.object({
    query: Joi.string().min(1).max(100),
    filters: Joi.object(),
    fields: Joi.array().items(Joi.string())
  }),

  // Bulk operations
  bulkOperation: Joi.object({
    ids: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)).min(1).required(),
    action: Joi.string().required(),
    data: Joi.object()
  })
};

module.exports = {
  validate: validationMiddleware,
  schemas
};
