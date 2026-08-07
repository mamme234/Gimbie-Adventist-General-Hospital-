// middleware/admin.js
const AdminMiddleware = {
  // Admin only access
  adminOnly: (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required.',
        code: 'ADMIN_REQUIRED',
        currentRole: req.user.role
      });
    }

    next();
  },

  // Super admin only
  superAdminOnly: (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    if (req.user.role !== 'admin' && !req.user.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Super admin access required.',
        code: 'SUPER_ADMIN_REQUIRED'
      });
    }

    next();
  },

  // Admin or specific role
  adminOrRole: (allowedRoles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.',
          code: 'AUTH_REQUIRED'
        });
      }

      if (req.user.role === 'admin' || allowedRoles.includes(req.user.role)) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions.',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: req.user.role
      });
    };
  },

  // Check if user can manage specific resource
  canManage: (resourceType) => {
    return async (req, res, next) => {
      try {
        const { id } = req.params;
        const user = req.user;

        // Admin can manage everything
        if (user.role === 'admin') {
          return next();
        }

        // Check resource ownership
        const Resource = require(`../models/${resourceType}`);
        const resource = await Resource.findById(id);
        
        if (!resource) {
          return res.status(404).json({
            success: false,
            message: 'Resource not found.',
            code: 'RESOURCE_NOT_FOUND'
          });
        }

        // Check if user owns the resource
        if (resource.userId && resource.userId.toString() === user._id.toString()) {
          return next();
        }

        // Check if user is assigned to resource
        if (resource.assignedTo && 
            resource.assignedTo.toString() === user._id.toString()) {
          return next();
        }

        return res.status(403).json({
          success: false,
          message: 'You do not have permission to manage this resource.',
          code: 'NO_MANAGE_PERMISSION'
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error checking resource permissions.',
          code: 'PERMISSION_CHECK_ERROR'
        });
      }
    };
  },

  // Rate limit for admin operations
  adminRateLimit: (req, res, next) => {
    // Implement rate limiting for admin endpoints
    const rateLimiter = require('../utils/rateLimiter');
    if (!rateLimiter.isAllowed(`admin:${req.user._id}`, 100, 60)) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }
    next();
  },

  // Admin audit log
  adminAudit: (req, res, next) => {
    const oldJson = res.json;
    res.json = function(data) {
      if (data.success !== false) {
        AuditLog.logAction({
          action: req.method.toLowerCase(),
          resource: req.originalUrl.split('/')[2] || 'admin',
          userId: req.user._id,
          details: {
            method: req.method,
            url: req.originalUrl,
            body: req.body,
            params: req.params,
            query: req.query,
            response: data
          },
          severity: 'info'
        }).catch(console.error);
      }
      return oldJson.call(this, data);
    };
    next();
  }
};

module.exports = AdminMiddleware;
