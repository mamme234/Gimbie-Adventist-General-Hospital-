// middleware/patient.js
const PatientMiddleware = {
  // Check patient access
  patientAccess: (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    // Admin and staff have full access
    const staffRoles = ['admin', 'doctor', 'nurse', 'paramedic'];
    if (staffRoles.includes(req.user.role)) {
      return next();
    }

    // Regular users can only access their own data
    if (req.user.role === 'patient') {
      const patientId = req.params.id || req.params.patientId;
      if (patientId && patientId !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only access your own medical records.',
          code: 'PATIENT_ACCESS_DENIED'
        });
      }
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions.',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  },

  // Check family member access
  familyAccess: async (req, res, next) => {
    try {
      const patientId = req.params.id || req.params.patientId;
      const user = req.user;

      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: 'Patient ID required.',
          code: 'PATIENT_ID_REQUIRED'
        });
      }

      // Staff have full access
      const staffRoles = ['admin', 'doctor', 'nurse', 'paramedic'];
      if (staffRoles.includes(user.role)) {
        return next();
      }

      // Check family relationship
      const FamilyRelationship = require('../models/FamilyRelationship');
      const hasAccess = await FamilyRelationship.findOne({
        patientId,
        familyMemberId: user._id,
        isActive: true
      });

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this patient\'s records.',
          code: 'FAMILY_ACCESS_DENIED'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking family access.',
        code: 'FAMILY_ACCESS_ERROR'
      });
    }
  },

  // Check patient consent
  checkConsent: (requiredConsent) => {
    return async (req, res, next) => {
      try {
        const patientId = req.params.id || req.params.patientId;
        
        if (!patientId) {
          return next(); // Skip if no patient ID
        }

        const Consent = require('../models/Consent');
        const consent = await Consent.findOne({
          patientId,
          type: requiredConsent,
          isActive: true,
          expiresAt: { $gt: new Date() }
        });

        if (!consent) {
          return res.status(403).json({
            success: false,
            message: `Required consent not found: ${requiredConsent}`,
            code: 'CONSENT_REQUIRED'
          });
        }

        next();
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error checking consent.',
          code: 'CONSENT_ERROR'
        });
      }
    };
  },

  // Rate limit patient requests
  patientRateLimit: (req, res, next) => {
    const rateLimiter = require('../utils/rateLimiter');
    const key = `patient:${req.user._id}`;
    
    if (!rateLimiter.isAllowed(key, 60, 60)) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again in 60 seconds.',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }
    
    next();
  }
};

module.exports = PatientMiddleware;
