// services/ai.service.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { logger } = require('../utils/logger');
const config = require('../config/server');

class AIService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.initialized = false;
    this.initialize();
  }

  initialize() {
    try {
      if (config.gemini.enabled && config.gemini.apiKey) {
        this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
        this.model = this.genAI.getGenerativeModel({ 
          model: config.gemini.model || 'gemini-pro' 
        });
        this.initialized = true;
        logger.info('✅ Gemini AI initialized successfully');
      } else {
        logger.warn('⚠️ Gemini AI not configured');
      }
    } catch (error) {
      logger.error('❌ Gemini AI initialization error:', error.message);
    }
  }

  // Triage emergency using Gemini
  async triageEmergency(emergencyData) {
    try {
      if (!this.initialized) {
        return this.fallbackTriage(emergencyData);
      }

      const { symptoms, description, patientInfo, location } = emergencyData;

      const prompt = `
        You are an emergency medical triage assistant for Gimbie Adventist General Hospital.
        
        Patient Information:
        - Age: ${patientInfo?.age || 'Unknown'}
        - Gender: ${patientInfo?.gender || 'Unknown'}
        - Symptoms: ${symptoms || 'Not specified'}
        - Description: ${description || 'Not specified'}
        - Location: ${location?.address || 'Unknown'}

        Please provide:
        1. Priority Level (critical/high/medium/low)
        2. Emergency Type (cardiac/respiratory/trauma/stroke/burn/poisoning/obstetric/pediatric/psychiatric/other)
        3. Confidence Score (0-1)
        4. Immediate Actions Needed
        5. Required Equipment
        6. Recommended Ambulance Type (basic/advanced/critical_care)
        7. Team Size Needed

        Respond in JSON format:
        {
          "priority": "critical",
          "type": "cardiac",
          "confidence": 0.95,
          "immediateActions": ["Action 1", "Action 2"],
          "requiredEquipment": ["Equipment 1", "Equipment 2"],
          "ambulanceType": "critical_care",
          "teamSize": 3
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          priority: parsed.priority || 'medium',
          type: parsed.type || 'other',
          confidence: parsed.confidence || 0.5,
          recommendations: {
            immediateActions: parsed.immediateActions || [],
            requiredEquipment: parsed.requiredEquipment || [],
            ambulanceType: parsed.ambulanceType || 'basic',
            teamSize: parsed.teamSize || 2
          },
          analysis: text
        };
      }

      return this.fallbackTriage(emergencyData);
    } catch (error) {
      logger.error('Gemini triage error:', error);
      return this.fallbackTriage(emergencyData);
    }
  }

  // Analyze patient condition using Gemini
  async analyzePatientCondition(vitals, symptoms, history) {
    try {
      if (!this.initialized) {
        return this.fallbackAnalysis(vitals);
      }

      const prompt = `
        You are a medical AI assistant for Gimbie Adventist General Hospital.
        
        Patient Vitals:
        - Heart Rate: ${vitals?.heartRate || 'Unknown'} bpm
        - Blood Pressure: ${vitals?.bloodPressure || 'Unknown'} mmHg
        - Temperature: ${vitals?.temperature || 'Unknown'} °C
        - Oxygen Saturation: ${vitals?.oxygenSaturation || 'Unknown'} %
        - Respiratory Rate: ${vitals?.respiratoryRate || 'Unknown'} /min
        
        Symptoms: ${symptoms || 'Not specified'}
        Medical History: ${history || 'Not specified'}

        Please provide:
        1. Patient Stability (stable/moderate/critical)
        2. Risk Factors (list)
        3. Recommendations (list)
        4. Alert Level (normal/warning/critical)

        Respond in JSON format:
        {
          "stability": "stable",
          "riskFactors": ["Risk 1", "Risk 2"],
          "recommendations": ["Recommendation 1", "Recommendation 2"],
          "alertLevel": "normal"
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          stability: parsed.stability || 'stable',
          riskFactors: parsed.riskFactors || [],
          recommendations: parsed.recommendations || ['Continue monitoring'],
          alertLevel: parsed.alertLevel || 'normal'
        };
      }

      return this.fallbackAnalysis(vitals);
    } catch (error) {
      logger.error('Gemini analysis error:', error);
      return this.fallbackAnalysis(vitals);
    }
  }

  // Predict emergency volume using Gemini
  async predictEmergencyVolume(data) {
    try {
      if (!this.initialized) {
        return this.fallbackPrediction();
      }

      const { location, date, historicalData } = data;

      const prompt = `
        Predict emergency volume for Gimbie Adventist General Hospital.
        
        Location: ${location || 'Gimbie, Ethiopia'}
        Date: ${date || new Date().toISOString().split('T')[0]}
        Historical Data: ${JSON.stringify(historicalData || {})}

        Provide:
        1. Predicted Emergency Volume (number)
        2. Confidence Level (0-1)
        3. Peak Times (list of hours)
        4. Recommendations (list)

        Respond in JSON format:
        {
          "volume": 45,
          "confidence": 0.85,
          "peakTimes": [8, 9, 10],
          "recommendations": ["Recommendation 1", "Recommendation 2"]
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          predictedVolume: parsed.volume || 0,
          confidence: parsed.confidence || 0.5,
          peakTimes: parsed.peakTimes || [],
          recommendations: parsed.recommendations || ['Normal operations predicted']
        };
      }

      return this.fallbackPrediction();
    } catch (error) {
      logger.error('Gemini prediction error:', error);
      return this.fallbackPrediction();
    }
  }

  // Generate health insights using Gemini
  async generateHealthInsights(patientData) {
    try {
      if (!this.initialized) {
        return { insights: 'AI not available' };
      }

      const prompt = `
        Generate health insights for a patient at Gimbie Adventist General Hospital.
        
        Patient Data: ${JSON.stringify(patientData)}

        Provide:
        1. Health Summary
        2. Risk Assessment
        3. Recommendations
        4. Follow-up Suggestions

        Respond in JSON format:
        {
          "summary": "Health summary here",
          "riskAssessment": "Risk assessment here",
          "recommendations": ["Recommendation 1", "Recommendation 2"],
          "followUpSuggestions": ["Suggestion 1", "Suggestion 2"]
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return { insights: text };
    } catch (error) {
      logger.error('Gemini insights error:', error);
      return { insights: 'Unable to generate insights' };
    }
  }

  // Fallback methods (no AI)
  fallbackTriage(data) {
    const { symptoms = '', description = '' } = data;
    const text = (symptoms + ' ' + description).toLowerCase();
    
    let priority = 'medium';
    let type = 'other';
    
    if (text.includes('cardiac') || text.includes('heart') || text.includes('chest pain')) {
      priority = 'critical';
      type = 'cardiac';
    } else if (text.includes('stroke') || text.includes('paralysis') || text.includes('facial droop')) {
      priority = 'critical';
      type = 'stroke';
    } else if (text.includes('bleeding') || text.includes('trauma') || text.includes('injury')) {
      priority = 'high';
      type = 'trauma';
    } else if (text.includes('breathing') || text.includes('asthma') || text.includes('short of breath')) {
      priority = 'high';
      type = 'respiratory';
    }
    
    return {
      priority,
      type,
      confidence: 0.5,
      recommendations: {
        immediateActions: ['Assess patient', 'Check vital signs'],
        requiredEquipment: ['Basic medical kit'],
        ambulanceType: 'basic',
        teamSize: 2
      },
      analysis: 'Fallback triage used (AI not available)'
    };
  }

  fallbackAnalysis(vitals) {
    return {
      stability: 'stable',
      riskFactors: [],
      recommendations: ['Continue monitoring'],
      alertLevel: 'normal'
    };
  }

  fallbackPrediction() {
    return {
      predictedVolume: 0,
      confidence: 0,
      peakTimes: [],
      recommendations: ['AI not available']
    };
  }

  // Check if AI is available
  isAvailable() {
    return this.initialized;
  }
}

module.exports = new AIService();
