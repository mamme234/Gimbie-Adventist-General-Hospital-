// middleware/nurse.js
const NurseMiddleware = {
  // Nurse only access
  nurseOnly: (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    const allowedRoles = ['nurse', 'admin'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Nurse access required.',
        code: 'NURSE_REQUIRED'
      });
    }

    next();
  },

  // Nurse or paramedic access
  nurseOrParamedic: (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    const allowedRoles = ['nurse', 'paramedic', 'admin'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Nurse or paramedic access required.',
        code: 'NURSE_OR_PARAMEDIC_REQUIRED'
      });
    }

    next();
  },

  // Check nurse certification
  validateCertification: (requiredCertification) => {
    return async (req, res, next) => {
      try {
        const user = req.user;
        
        if (user.role === 'admin') {
          return next();
        }

        const hasCert = user.certifications?.some(
          cert => cert.name === requiredCertification && 
          cert.isActive
        );

        if (!hasCert) {
          return res.status(403).json({
            success: false,
            message: `Required certification: ${requiredCertification}`,
            code: 'CERTIFICATION_REQUIRED'
          });
        }

        next();
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error validating certification.',
          code: 'CERTIFICATION_ERROR'
        });
      }
    };
  },

  // Check nurse-to-patient ratio
  checkPatientRatio: async (req, res, next) => {
    try {
      const user = req.user;
      
      if (user.role === 'admin') {
        return next();
      }

      const Patient = require('../models/Patient');
      const activePatients = await Patient.countDocuments({
        assignedNurseId: user._id,
        status: 'active'
      });

      const maxPatients = process.env.MAX_PATIENTS_PER_NURSE || 10;
      
      if (activePatients >= maxPatients) {
        return res.status(403).json({
          success: false,
          message: `Patient capacity reached (${maxPatients}). Please reassign some patients.`,
          code: 'PATIENT_CAPACITY_REACHED'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking patient ratio.',
        code: 'PATIENT_RATIO_ERROR'
      });
    }
  }
};

module.exports = NurseMiddleware;
