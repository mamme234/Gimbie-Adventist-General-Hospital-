// services/ai.service.js
const { logger } = require('../middleware/logger');
const { Emergency } = require('../models/Emergency');
const { Ambulance } = require('../models/Ambulance');
const { Employee } = require('../models/Employee');
const { Patient } = require('../models/Patient');
const { AuditLog } = require('../models/AuditLog');
const { spawn } = require('child_process');

class AIService {
  constructor() {
    this.model = null;
    this.initialized = false;
    this.initialize();
  }

  // Initialize AI models
  async initialize() {
    try {
      // Initialize NLP model for emergency triage
      this.initializeTriageModel();
      
      // Initialize prediction models
      this.initializePredictionModels();
      
      this.initialized = true;
      logger.info('AI service initialized successfully');
    } catch (error) {
      logger.error('AI service initialization error:', error);
    }
  }

  // Initialize triage model
  initializeTriageModel() {
    // This would load a pre-trained model
    // For now, use a rule-based approach
    this.triageRules = {
      critical: {
        keywords: ['cardiac', 'arrest', 'stroke', 'severe', 'unconscious', 'bleeding', 'not breathing'],
        minScore: 0.8
      },
      high: {
        keywords: ['chest pain', 'difficulty breathing', 'severe pain', 'head injury', 'burn'],
        minScore: 0.6
      },
      medium: {
        keywords: ['fracture', 'sprain', 'fever', 'vomiting', 'allergic reaction'],
        minScore: 0.4
      },
      low: {
        keywords: ['cut', 'bruise', 'cold', 'flu', 'minor injury'],
        minScore: 0.2
      }
    };
  }

  // Initialize prediction models
  initializePredictionModels() {
    this.predictionWeights = {
      emergencyVolume: {
        timeOfDay: 0.3,
        dayOfWeek: 0.2,
        weather: 0.2,
        historicalData: 0.3
      },
      responseTime: {
        distance: 0.4,
        traffic: 0.3,
        timeOfDay: 0.2,
        ambulanceAvailability: 0.1
      }
    };
  }

  // Triage emergency
  async triageEmergency(emergencyData) {
    try {
      const { symptoms, description, patientInfo, location } = emergencyData;

      // Analyze text
      const textAnalysis = await this.analyzeText(description, symptoms);
      
      // Determine priority
      const priority = this.determinePriority(textAnalysis);
      
      // Determine emergency type
      const type = this.determineEmergencyType(textAnalysis);
      
      // Generate triage recommendations
      const recommendations = await this.generateTriageRecommendations({
        priority,
        type,
        patientInfo,
        location,
        symptoms
      });

      const result = {
        priority,
        type,
        confidence: textAnalysis.confidence,
        recommendations,
        analysis: textAnalysis
      };

      // Log triage
      await AuditLog.logAction({
        action: 'ai_triage',
        resource: 'emergency',
        details: result,
        status: 'success'
      });

      return result;
    } catch (error) {
      logger.error('Triage emergency error:', error);
      throw error;
    }
  }

  // Analyze text
  async analyzeText(description, symptoms) {
    // Rule-based analysis
    const text = `${description || ''} ${symptoms || ''}`.toLowerCase();
    const keywords = text.split(/\s+/);
    
    let scores = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    // Calculate scores based on keyword matches
    for (const [priority, rule] of Object.entries(this.triageRules)) {
      let matches = 0;
      let totalPossible = 0;
      
      for (const keyword of rule.keywords) {
        if (text.includes(keyword)) {
          matches++;
        }
        totalPossible++;
      }
      
      scores[priority] = totalPossible > 0 ? matches / totalPossible : 0;
    }

    // Find highest priority
    let highestPriority = 'low';
    let highestScore = 0;
    
    for (const [priority, score] of Object.entries(scores)) {
      if (score > highestScore) {
        highestScore = score;
        highestPriority = priority;
      }
    }

    // Determine confidence
    const confidence = highestScore;

    return {
      priority: highestPriority,
      confidence,
      scores,
      keywords: keywords.filter(k => k.length > 3),
      text
    };
  }

  // Determine priority
  determinePriority(analysis) {
    // Use the highest priority from analysis
    return analysis.priority;
  }

  // Determine emergency type
  determineEmergencyType(analysis) {
    const types = {
      cardiac: ['heart', 'chest pain', 'cardiac', 'palpitations'],
      respiratory: ['breathing', 'asthma', 'short of breath', 'oxygen'],
      trauma: ['injury', 'accident', 'fall', 'wound', 'fracture'],
      stroke: ['stroke', 'paralysis', 'slurred speech', 'facial droop'],
      burn: ['burn', 'scald', 'fire'],
      poisoning: ['poison', 'overdose', 'toxic', 'chemical'],
      obstetric: ['pregnant', 'labor', 'childbirth', 'delivery'],
      pediatric: ['child', 'baby', 'infant', 'pediatric'],
      psychiatric: ['mental', 'psychiatric', 'depression', 'anxiety', 'suicide']
    };

    let highestScore = 0;
    let detectedType = 'other';

    for (const [type, keywords] of Object.entries(types)) {
      let score = 0;
      for (const keyword of keywords) {
        if (analysis.text.includes(keyword)) {
          score++;
        }
      }
      
      if (score > highestScore) {
        highestScore = score;
        detectedType = type;
      }
    }

    return detectedType;
  }

  // Generate triage recommendations
  async generateTriageRecommendations({ priority, type, patientInfo, location, symptoms }) {
    const recommendations = {
      immediateActions: [],
      requiredEquipment: [],
      ambulanceType: 'basic',
      teamSize: 2,
      priority: priority
    };

    // Determine ambulance type
    if (priority === 'critical') {
      recommendations.ambulanceType = 'critical_care';
      recommendations.teamSize = 3;
      recommendations.immediateActions.push('Advanced Life Support required');
      recommendations.immediateActions.push('Call trauma team standby');
    } else if (priority === 'high') {
      recommendations.ambulanceType = 'advanced';
      recommendations.teamSize = 2;
      recommendations.immediateActions.push('Basic Life Support required');
    }

    // Specific recommendations by type
    switch (type) {
      case 'cardiac':
        recommendations.requiredEquipment.push('AED', 'ECG monitor', 'Oxygen');
        recommendations.immediateActions.push('Initiate CPR if needed');
        break;
      case 'respiratory':
        recommendations.requiredEquipment.push('Oxygen', 'Ventilator', 'Nebulizer');
        recommendations.immediateActions.push('Check airway patency');
        break;
      case 'trauma':
        recommendations.requiredEquipment.push('Spine board', 'Cervical collar', 'Bandages');
        recommendations.immediateActions.push('Immobilize spine');
        break;
      case 'stroke':
        recommendations.requiredEquipment.push('Stroke kit');
        recommendations.immediateActions.push('Time of onset documentation');
        break;
      case 'burn':
        recommendations.requiredEquipment.push('Burn kit', 'Fluids');
        recommendations.immediateActions.push('Cool the burn area');
        break;
      case 'poisoning':
        recommendations.requiredEquipment.push('Activated charcoal');
        recommendations.immediateActions.push('Contact poison control');
        break;
      case 'obstetric':
        recommendations.requiredEquipment.push('Obstetric kit');
        recommendations.immediateActions.push('Ready for immediate delivery');
        break;
      case 'pediatric':
        recommendations.requiredEquipment.push('Pediatric kit');
        recommendations.immediateActions.push('Pediatric specialist notification');
        break;
      case 'psychiatric':
        recommendations.requiredEquipment.push('Restraints', 'Sedation kit');
        recommendations.immediateActions.push('Ensure safety of patient and staff');
        break;
    }

    // Location-based recommendations
    if (location) {
      recommendations.immediateActions.push(`Dispatch to ${location.address || 'patient location'}`);
    }

    // Patient-specific recommendations
    if (patientInfo) {
      if (patientInfo.age && patientInfo.age > 65) {
        recommendations.immediateActions.push('Consider geriatric protocols');
        recommendations.teamSize = Math.min(recommendations.teamSize + 1, 4);
      }
      
      if (patientInfo.allergies && patientInfo.allergies.length > 0) {
        recommendations.immediateActions.push(`Allergies: ${patientInfo.allergies.join(', ')}`);
      }
      
      if (patientInfo.medicalConditions && patientInfo.medicalConditions.length > 0) {
        recommendations.immediateActions.push(`Medical conditions: ${patientInfo.medicalConditions.join(', ')}`);
      }
    }

    return recommendations;
  }

  // Predict emergency volume
  async predictEmergencyVolume(location, date, timeframe = 'day') {
    try {
      // Get historical data
      const historicalData = await this.getHistoricalEmergencyData(location);
      
      // Weather data (would use external API)
      const weather = await this.getWeatherData(location, date);
      
      // Calculate prediction
      const prediction = this.calculateVolumePrediction({
        historicalData,
        weather,
        date,
        timeframe
      });

      return {
        predictedVolume: prediction.volume,
        confidence: prediction.confidence,
        peakTimes: prediction.peakTimes,
        recommendations: prediction.recommendations
      };
    } catch (error) {
      logger.error('Predict emergency volume error:', error);
      return {
        predictedVolume: 0,
        confidence: 0,
        error: error.message
      };
    }
  }

  // Get historical emergency data
  async getHistoricalEmergencyData(location) {
    // Query database for historical data
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const emergencies = await Emergency.find({
      createdAt: { $gte: thirtyDaysAgo },
      location: {
        $near: {
          $geometry: location,
          $maxDistance: 10000 // 10km radius
        }
      }
    });

    // Aggregate by day/hour
    const dailyData = {};
    const hourlyData = {};
    
    emergencies.forEach(e => {
      const date = e.createdAt.toISOString().split('T')[0];
      const hour = e.createdAt.getHours();
      
      dailyData[date] = (dailyData[date] || 0) + 1;
      hourlyData[hour] = (hourlyData[hour] || 0) + 1;
    });

    return {
      daily: dailyData,
      hourly: hourlyData,
      total: emergencies.length,
      averageDaily: Object.values(dailyData).reduce((a, b) => a + b, 0) / Object.keys(dailyData).length || 0
    };
  }

  // Get weather data (mock)
  async getWeatherData(location, date) {
    // In production, use a weather API like OpenWeatherMap
    return {
      temperature: 70 + Math.random() * 20,
      humidity: 60 + Math.random() * 30,
      precipitation: Math.random() > 0.7 ? Math.random() * 0.5 : 0,
      cloudCover: Math.random() * 100
    };
  }

  // Calculate volume prediction
  calculateVolumePrediction({ historicalData, weather, date, timeframe }) {
    const dayOfWeek = new Date(date).getDay();
    const hour = new Date(date).getHours();
    
    // Base volume from historical average
    let baseVolume = historicalData.averageDaily || 0;
    
    // Adjust for day of week
    const dayFactors = {
      0: 0.8, // Sunday
      1: 1.1, // Monday
      2: 1.0, // Tuesday
      3: 1.0, // Wednesday
      4: 1.0, // Thursday
      5: 1.2, // Friday
      6: 1.3  // Saturday
    };
    baseVolume *= (dayFactors[dayOfWeek] || 1.0);
    
    // Adjust for time of day
    const hourFactors = {
      0: 0.4, 1: 0.3, 2: 0.2, 3: 0.2, 4: 0.3, 5: 0.5,
      6: 0.7, 7: 1.0, 8: 1.2, 9: 1.3, 10: 1.2, 11: 1.1,
      12: 1.0, 13: 1.1, 14: 1.2, 15: 1.3, 16: 1.4, 17: 1.5,
      18: 1.4, 19: 1.3, 20: 1.2, 21: 1.1, 22: 0.8, 23: 0.6
    };
    
    let predictedVolume = baseVolume * (hourFactors[hour] || 1.0);
    
    // Adjust for weather
    if (weather.temperature > 85 || weather.temperature < 32) {
      predictedVolume *= 1.3; // Extreme temperatures increase emergencies
    }
    if (weather.precipitation > 0) {
      predictedVolume *= 1.2; // Rain increases emergencies
    }
    
    // Determine peak times
    const peakTimes = Object.entries(hourFactors)
      .filter(([h, factor]) => factor > 1.2)
      .map(([h]) => parseInt(h));
    
    // Generate recommendations
    const recommendations = [];
    if (predictedVolume > historicalData.averageDaily * 1.5) {
      recommendations.push('Increase staff availability');
      recommendations.push('Ensure adequate ambulance coverage');
    }
    if (weather.temperature > 85) {
      recommendations.push('Prepare for heat-related emergencies');
    }
    if (weather.precipitation > 0) {
      recommendations.push('Anticipate weather-related incidents');
    }
    
    return {
      volume: Math.round(predictedVolume),
      confidence: 0.85 - (Math.random() * 0.2),
      peakTimes,
      recommendations: recommendations.length > 0 ? recommendations : ['Normal operations predicted']
    };
  }

  // Predict ambulance response time
  async predictResponseTime(ambulanceId, emergencyLocation) {
    try {
      const ambulance = await Ambulance.findById(ambulanceId);
      if (!ambulance) {
        throw new Error('Ambulance not found');
      }

      // Calculate distance
      const distance = this.calculateDistance(
        ambulance.location.coordinates,
        emergencyLocation.coordinates
      );

      // Get traffic data (would use external API)
      const traffic = await this.getTrafficData(ambulance.location, emergencyLocation);
      
      // Calculate predicted time
      const baseTime = distance * 2; // 2 minutes per km
      const trafficFactor = traffic.level / 100;
      const timeOfDayFactor = this.getTimeOfDayFactor();
      
      const predictedTime = baseTime * (1 + trafficFactor * 0.5) * timeOfDayFactor;

      return {
        distance,
        predictedTime: Math.round(predictedTime),
        trafficLevel: traffic.level,
        route: traffic.route,
        confidence: 0.7 + Math.random() * 0.2
      };
    } catch (error) {
      logger.error('Predict response time error:', error);
      throw error;
    }
  }

  // Get traffic data
  async getTrafficData(from, to) {
    // In production, use Google Maps API
    return {
      level: 20 + Math.random() * 80,
      route: [
        [from.lat, from.lng],
        [to.lat, to.lng]
      ],
      time: 10 + Math.random() * 30
    };
  }

  // Get time of day factor
  getTimeOfDayFactor() {
    const hour = new Date().getHours();
    const rushHours = [7, 8, 9, 16, 17, 18];
    if (rushHours.includes(hour)) {
      return 1.5;
    }
    if (hour >= 22 || hour <= 5) {
      return 0.8;
    }
    return 1.0;
  }

  // Calculate distance
  calculateDistance(from, to) {
    const R = 6371; // Earth's radius in km
    const lat1 = from[1] * Math.PI / 180;
    const lat2 = to[1] * Math.PI / 180;
    const dLat = (to[1] - from[1]) * Math.PI / 180;
    const dLon = (to[0] - from[0]) * Math.PI / 180;

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Analyze patient condition
  async analyzePatientCondition(vitals) {
    try {
      const analysis = {
        stability: 'stable',
        riskFactors: [],
        recommendations: [],
        alertLevel: 'normal'
      };

      // Check vital signs
      if (vitals.heartRate) {
        if (vitals.heartRate > 100) {
          analysis.riskFactors.push('Tachycardia');
          analysis.alertLevel = 'warning';
        }
        if (vitals.heartRate < 60) {
          analysis.riskFactors.push('Bradycardia');
          analysis.alertLevel = 'warning';
        }
      }

      if (vitals.bloodPressure) {
        const bp = vitals.bloodPressure.split('/');
        if (bp.length === 2) {
          const systolic = parseInt(bp[0]);
          const diastolic = parseInt(bp[1]);
          
          if (systolic > 180 || diastolic > 120) {
            analysis.riskFactors.push('Severe hypertension');
            analysis.alertLevel = 'critical';
          }
          if (systolic < 90 || diastolic < 60) {
            analysis.riskFactors.push('Hypotension');
            analysis.alertLevel = 'critical';
          }
        }
      }

      if (vitals.oxygenSaturation) {
        if (vitals.oxygenSaturation < 90) {
          analysis.riskFactors.push('Hypoxia');
          analysis.alertLevel = 'critical';
        }
        if (vitals.oxygenSaturation < 95) {
          analysis.riskFactors.push('Low oxygen saturation');
          analysis.alertLevel = analysis.alertLevel === 'normal' ? 'warning' : analysis.alertLevel;
        }
      }

      // Determine stability
      if (analysis.riskFactors.length === 0) {
        analysis.stability = 'stable';
        analysis.recommendations.push('Continue monitoring');
      } else if (analysis.riskFactors.length <= 2) {
        analysis.stability = 'moderate';
        analysis.recommendations.push('Close monitoring required');
      } else {
        analysis.stability = 'critical';
        analysis.recommendations.push('Immediate intervention required');
      }

      // Log analysis
      await AuditLog.logAction({
        action: 'ai_analysis',
        resource: 'patient',
        details: {
          vitals: vitals,
          analysis: analysis
        },
        status: 'success'
      });

      return analysis;
    } catch (error) {
      logger.error('Analyze patient condition error:', error);
      throw error;
    }
  }

  // Optimize resource allocation
  async optimizeResourceAllocation(emergencyData) {
    try {
      const { priority, type, location, estimatedPatients } = emergencyData;

      // Determine required resources
      const requiredResources = {
        ambulances: 1,
        paramedics: 2,
        doctors: 0,
        nurses: 0,
        equipment: [],
        hospitalBeds: 1
      };

      // Adjust based on priority
      if (priority === 'critical') {
        requiredResources.ambulances = 2;
        requiredResources.paramedics = 3;
        requiredResources.doctors = 1;
        requiredResources.nurses = 2;
        requiredResources.equipment.push('Critical care equipment');
        requiredResources.hospitalBeds = 2;
      }

      // Adjust based on type
      if (type === 'cardiac') {
        requiredResources.equipment.push('AED', 'ECG monitor');
        requiredResources.doctors = Math.max(requiredResources.doctors, 1);
      }
      if (type === 'trauma') {
        requiredResources.equipment.push('Trauma kit', 'Spine board');
        requiredResources.doctors = Math.max(requiredResources.doctors, 1);
      }

      // Adjust for multiple patients
      if (estimatedPatients && estimatedPatients > 1) {
        requiredResources.ambulances += Math.ceil(estimatedPatients / 2);
        requiredResources.paramedics += estimatedPatients;
        requiredResources.hospitalBeds += estimatedPatients;
      }

      // Get available resources
      const availableAmbulances = await Ambulance.find({ status: 'available' });
      const availableParamedics = await Employee.find({ 
        role: 'paramedic',
        status: 'active' 
      });

      // Check if resources are sufficient
      const resourceStatus = {
        sufficient: true,
        shortfalls: []
      };

      if (availableAmbulances.length < requiredResources.ambulances) {
        resourceStatus.sufficient = false;
        resourceStatus.shortfalls.push({
          resource: 'ambulances',
          required: requiredResources.ambulances,
          available: availableAmbulances.length
        });
      }

      if (availableParamedics.length < requiredResources.paramedics) {
        resourceStatus.sufficient = false;
        resourceStatus.shortfalls.push({
          resource: 'paramedics',
          required: requiredResources.paramedics,
          available: availableParamedics.length
        });
      }

      // Generate recommendations
      const recommendations = [];
      if (!resourceStatus.sufficient) {
        recommendations.push('Insufficient resources available');
        recommendations.push('Request mutual aid from neighboring stations');
        recommendations.push('Activate backup staff');
      }

      // Recommend best ambulance
      let bestAmbulance = null;
      if (availableAmbulances.length > 0) {
        bestAmbulance = await this.findBestAmbulance(
          availableAmbulances,
          location,
          requiredResources.equipment
        );
      }

      return {
        requiredResources,
        resourceStatus,
        recommendations,
        bestAmbulance,
        estimatedResponseTime: await this.estimateResponseTime(bestAmbulance, location)
      };
    } catch (error) {
      logger.error('Optimize resource allocation error:', error);
      throw error;
    }
  }

  // Find best ambulance
  async findBestAmbulance(ambulances, location, requiredEquipment) {
    let bestAmbulance = null;
    let bestScore = -1;

    for (const ambulance of ambulances) {
      // Calculate distance
      const distance = this.calculateDistance(
        ambulance.location.coordinates,
        [location.coordinates.lng, location.coordinates.lat]
      );

      // Check equipment
      let equipmentScore = 0;
      for (const equipment of requiredEquipment) {
        if (ambulance.equipment.some(e => e.name === equipment && e.status === 'functional')) {
          equipmentScore++;
        }
      }
      equipmentScore /= requiredEquipment.length;

      // Calculate score
      const score = (1 - distance / 50) * 0.6 + equipmentScore * 0.4;

      if (score > bestScore) {
        bestScore = score;
        bestAmbulance = ambulance;
      }
    }

    return bestAmbulance;
  }

  // Estimate response time
  async estimateResponseTime(ambulance, location) {
    if (!ambulance) {
      return null;
    }

    const distance = this.calculateDistance(
      ambulance.location.coordinates,
      [location.coordinates.lng, location.coordinates.lat]
    );

    const traffic = await this.getTrafficData(
      { lat: ambulance.location.coordinates[1], lng: ambulance.location.coordinates[0] },
      location
    );

    const baseTime = distance * 2;
    const estimatedTime = baseTime * (1 + traffic.level / 100);

    return Math.round(estimatedTime);
  }

  // Get AI insights
  async getAIInsights() {
    try {
      // Get data
      const emergencies = await Emergency.find({ status: { $ne: 'completed' } });
      const ambulances = await Ambulance.find();
      const employees = await Employee.find({ status: 'active' });

      // Generate insights
      const insights = {
        currentState: {
          activeEmergencies: emergencies.length,
          availableAmbulances: ambulances.filter(a => a.status === 'available').length,
          availableStaff: employees.length
        },
        recommendations: [],
        predictions: []
      };

      // Check for potential issues
      if (insights.currentState.activeEmergencies > insights.currentState.availableAmbulances * 2) {
        insights.recommendations.push('High emergency volume detected. Request additional ambulance resources.');
      }

      if (insights.currentState.availableStaff < 5) {
        insights.recommendations.push('Low staffing levels. Consider activating backup staff.');
      }

      // Generate predictions
      const volumePrediction = await this.predictEmergencyVolume(
        { type: 'Point', coordinates: [0, 0] }, // Default location
        new Date()
      );
      insights.predictions.push({
        type: 'volume',
        data: volumePrediction
      });

      return insights;
    } catch (error) {
      logger.error('Get AI insights error:', error);
      throw error;
    }
  }

  // Process natural language query
  async processNaturalLanguageQuery(query) {
    try {
      // Parse query intent
      const intent = this.parseQueryIntent(query);
      
      // Execute based on intent
      let result;
      switch (intent.type) {
        case 'emergency_count':
          result = await this.getEmergencyCount(intent.filters);
          break;
        case 'find_ambulance':
          result = await this.findNearbyAmbulances(intent.location);
          break;
        case 'staff_availability':
          result = await this.getStaffAvailability();
          break;
        case 'patient_status':
          result = await this.getPatientStatus(intent.patientId);
          break;
        default:
          result = { message: 'I understand your query but need more specific information.' };
      }

      return {
        query,
        intent,
        result,
        response: this.formatNaturalLanguageResponse(intent, result)
      };
    } catch (error) {
      logger.error('Process natural language query error:', error);
      throw error;
    }
  }

  // Parse query intent
  parseQueryIntent(query) {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('emergency') && (lowerQuery.includes('count') || lowerQuery.includes('how many'))) {
      return { type: 'emergency_count', filters: {} };
    }
    
    if (lowerQuery.includes('ambulance') && (lowerQuery.includes('find') || lowerQuery.includes('near'))) {
      return { type: 'find_ambulance', location: this.extractLocation(query) };
    }
    
    if (lowerQuery.includes('staff') && (lowerQuery.includes('available') || lowerQuery.includes('on duty'))) {
      return { type: 'staff_availability' };
    }
    
    if (lowerQuery.includes('patient') && (lowerQuery.includes('status') || lowerQuery.includes('condition'))) {
      const patientId = this.extractPatientId(query);
      if (patientId) {
        return { type: 'patient_status', patientId };
      }
      return { type: 'patient_status', patientId: null };
    }
    
    return { type: 'unknown', message: 'Query not recognized' };
  }

  // Extract location from query
  extractLocation(query) {
    // Simple location extraction
    const locationMatch = query.match(/(?:near|in|at)\s+([\w\s]+)/i);
    if (locationMatch) {
      return locationMatch[1].trim();
    }
    return null;
  }

  // Extract patient ID from query
  extractPatientId(query) {
    const idMatch = query.match(/patient\s*[#:]?\s*([A-Za-z0-9]+)/i);
    return idMatch ? idMatch[1] : null;
  }

  // Get emergency count
  async getEmergencyCount(filters) {
    return {
      count: await Emergency.countDocuments(filters),
      details: {
        active: await Emergency.countDocuments({ status: { $nin: ['completed', 'cancelled'] } }),
        completed: await Emergency.countDocuments({ status: 'completed' }),
        critical: await Emergency.countDocuments({ priority: 'critical' })
      }
    };
  }

  // Find nearby ambulances
  async findNearbyAmbulances(location) {
    // Implementation would use geospatial queries
    return {
      available: await Ambulance.countDocuments({ status: 'available' }),
      nearest: null // Would find nearest ambulance
    };
  }

  // Get staff availability
  async getStaffAvailability() {
    return {
      total: await Employee.countDocuments({ status: 'active' }),
      onDuty: await Employee.countDocuments({ status: 'active', shift: 'active' }),
      available: await Employee.countDocuments({ status: 'active', shift: 'available' }),
      byRole: await Employee.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ])
    };
  }

  // Get patient status
  async getPatientStatus(patientId) {
    if (!patientId) {
      return { message: 'Please specify a patient ID' };
    }
    
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return { message: 'Patient not found' };
    }
    
    return {
      patient: patient.name,
      status: patient.status || 'stable',
      lastUpdated: patient.updatedAt
    };
  }

  // Format natural language response
  formatNaturalLanguageResponse(intent, result) {
    switch (intent.type) {
      case 'emergency_count':
        return `There are currently ${result.count} emergencies in the system. Active: ${result.details.active}, Completed: ${result.details.completed}, Critical: ${result.details.critical}.`;
      case 'find_ambulance':
        return `I found ${result.available} ambulances available. ${result.nearest ? 'The nearest is at the closest station.' : ''}`;
      case 'staff_availability':
        return `There are ${result.total} staff members active. ${result.onDuty} are on duty, with ${result.available} available.`;
      case 'patient_status':
        if (result.message) return result.message;
        return `Patient ${result.patient} is ${result.status}. Last updated: ${result.lastUpdated}.`;
      default:
        return 'I understand your query but need more specific information. Please try asking about emergencies, ambulances, staff, or patients.';
    }
  }
}

module.exports = new AIService();
