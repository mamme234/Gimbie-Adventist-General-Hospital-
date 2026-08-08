const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes - Verify JWT token
 * @desc    Middleware to protect routes
 * @access  Private
 */
const protect = async (req, res, next) => {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Check for token in cookies (optional)
    if (!token && req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route. Please login.',
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from token
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found. Invalid token.',
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated. Please contact administrator.',
            });
        }

        // Attach user to request
        req.user = user;
        req.user.role = decoded.role || user.role;
        req.user.id = user._id;

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. Please login again.',
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.',
            });
        }
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route.',
        });
    }
};

/**
 * Authorize roles - Role-based access control
 * @desc    Middleware to restrict access based on roles
 * @param   {...string} roles - Allowed roles
 * @access  Private
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized. Please login.',
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Role '${req.user.role}' is not authorized to access this resource.`,
                requiredRoles: roles,
            });
        }

        next();
    };
};

/**
 * Check permission - Granular permission checking
 * @desc    Middleware to check specific permissions
 * @param   {string} permission - Permission to check
 * @access  Private
 */
const checkPermission = (permission) => {
    return async (req, res, next) => {
        try {
            const { role } = req.user;
            const { PERMISSIONS, checkPermission } = require('./roles');
            
            const hasPermission = checkPermission(role, permission);
            
            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: `You don't have permission to perform this action.`,
                    requiredPermission: permission,
                });
            }
            
            next();
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error checking permissions.',
                error: error.message,
            });
        }
    };
};

/**
 * Department access - Check if user belongs to department
 * @desc    Middleware to restrict access based on department
 * @param   {string} department - Department to check
 * @access  Private
 */
const checkDepartment = (department) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized. Please login.',
            });
        }

        // Allow super_admin and admin to bypass department check
        if (req.user.role === 'super_admin' || req.user.role === 'admin') {
            return next();
        }

        if (req.user.department !== department) {
            return res.status(403).json({
                success: false,
                message: `Access restricted to ${department} department only.`,
            });
        }

        next();
    };
};

/**
 * Check if user is accessing their own data
 * @desc    Middleware to check if user is accessing their own resource
 * @param   {string} paramName - Parameter name containing user ID
 * @access  Private
 */
const checkOwnership = (paramName = 'id') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized. Please login.',
            });
        }

        // Allow super_admin and admin to bypass ownership check
        if (req.user.role === 'super_admin' || req.user.role === 'admin') {
            return next();
        }

        const resourceId = req.params[paramName];
        
        if (!resourceId) {
            return res.status(400).json({
                success: false,
                message: 'Resource ID is required.',
            });
        }

        // Check if user owns the resource (by comparing IDs)
        if (req.user.id !== resourceId && req.user._id.toString() !== resourceId) {
            return res.status(403).json({
                success: false,
                message: 'You can only access your own resources.',
            });
        }

        next();
    };
};

module.exports = {
    protect,
    authorize,
    checkPermission,
    checkDepartment,
    checkOwnership,
};
