// middleware/doctor.js
const DoctorMiddleware = {
  // Doctor only access
  doctorOnly: (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    const allowedRoles = ['doctor', 'admin'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Doctor access required.',
        code: 'DOCTOR_REQUIRED',
        currentRole: req.user.role
      });
    }

    next();
  },

  // Doctor or nurse access
  doctorOrNurse: (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    const allowedRoles = ['doctor', 'nurse', 'admin'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Medical staff access required.',
        code: 'MEDICAL_STAFF_REQUIRED'
      });
    }

    next();
  },

  // Check if doctor can treat specific patient/emergency
  canTreat: (patientId, emergencyId) => {
    return async (req, res, next) => {
      try {
        const user = req.user;
        
        if (user.role === 'admin') {
          return next();
        }

        // Check if doctor is assigned to this emergency
        if (emergencyId) {
          const Emergency = require('../models/Emergency');
          const emergency = await Emergency.findById(emergencyId);
          
          if (emergency && emergency.assignedParamedics?.includes(user._id)) {
            return next();
          }
        }

        // Check doctor's department/specialization
        const Department = require('../models/Department');
        const hasPermission = await Department.findOne({
          _id: user.departmentId,
          allowedToTreat: patientId ? await getPatientCondition(patientId) : null
        });

        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to treat this patient.',
            code: 'TREATMENT_PERMISSION_DENIED'
          });
        }

        next();
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error checking treatment permissions.',
          code: 'TREATMENT_CHECK_ERROR'
        });
      }
    };
  },

  // Validate doctor's certification
  validateCertification: (requiredCertification) => {
    return async (req, res, next) => {
      try {
        const user = req.user;
        
        // Admin bypass
        if (user.role === 'admin') {
          return next();
        }

        const hasCert = user.certifications?.some(
          cert => cert.name === requiredCertification && 
          cert.isActive && 
          cert.expiryDate > new Date()
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

  // Check on-call status
  checkOnCall: async (req, res, next) => {
    try {
      const user = req.user;
      
      if (user.role === 'admin') {
        return next();
      }

      // Check if doctor is currently on call
      const Schedule = require('../models/Schedule');
      const isOnCall = await Schedule.findOne({
        employeeId: user._id,
        status: 'active',
        startTime: { $lte: new Date() },
        endTime: { $gte: new Date() }
      });

      if (!isOnCall) {
        return res.status(403).json({
          success: false,
          message: 'You are not currently on call.',
          code: 'NOT_ON_CALL'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking on-call status.',
        code: 'ONCALL_CHECK_ERROR'
      });
    }
  }
};

module.exports = DoctorMiddleware;
