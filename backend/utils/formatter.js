// utils/formatter.js
const moment = require('moment');

class Formatter {
  constructor() {
    this.currency = 'USD';
    this.locale = 'en-US';
  }

  // Format date
  formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
    try {
      return moment(date).format(format);
    } catch (error) {
      return date;
    }
  }

  // Format date relative
  formatRelativeDate(date) {
    try {
      return moment(date).fromNow();
    } catch (error) {
      return date;
    }
  }

  // Format currency
  formatCurrency(amount, currency = this.currency, locale = this.locale) {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
      }).format(amount);
    } catch (error) {
      return `${currency} ${amount}`;
    }
  }

  // Format number
  formatNumber(number, decimals = 2, locale = this.locale) {
    try {
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(number);
    } catch (error) {
      return number.toFixed(decimals);
    }
  }

  // Format percentage
  formatPercent(value, decimals = 1, locale = this.locale) {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(value / 100);
    } catch (error) {
      return `${value}%`;
    }
  }

  // Format phone number
  formatPhone(phone) {
    try {
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
      } else if (cleaned.length === 11) {
        return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
      }
      return phone;
    } catch (error) {
      return phone;
    }
  }

  // Format address
  formatAddress(address) {
    try {
      const parts = [];
      if (address.street) parts.push(address.street);
      if (address.city) parts.push(address.city);
      if (address.state) parts.push(address.state);
      if (address.zipCode) parts.push(address.zipCode);
      if (address.country && address.country !== 'USA') parts.push(address.country);
      return parts.join(', ');
    } catch (error) {
      return '';
    }
  }

  // Format name
  formatName(firstName, lastName) {
    try {
      return `${firstName} ${lastName}`.trim();
    } catch (error) {
      return `${firstName || ''} ${lastName || ''}`.trim();
    }
  }

  // Format initials
  formatInitials(firstName, lastName) {
    try {
      const first = firstName ? firstName.charAt(0).toUpperCase() : '';
      const last = lastName ? lastName.charAt(0).toUpperCase() : '';
      return `${first}${last}`;
    } catch (error) {
      return '';
    }
  }

  // Format bytes
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  // Format duration
  formatDuration(seconds) {
    try {
      const duration = moment.duration(seconds, 'seconds');
      const hours = Math.floor(duration.asHours());
      const minutes = duration.minutes();
      const secs = duration.seconds();
      
      if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
      } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
      } else {
        return `${secs}s`;
      }
    } catch (error) {
      return `${seconds}s`;
    }
  }

  // Format time
  formatTime(time, format = 'h:mm A') {
    try {
      return moment(time, 'HH:mm:ss').format(format);
    } catch (error) {
      return time;
    }
  }

  // Format JSON
  formatJSON(obj, spaces = 2) {
    try {
      return JSON.stringify(obj, null, spaces);
    } catch (error) {
      return obj;
    }
  }

  // Format string to slug
  formatSlug(text) {
    try {
      return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
    } catch (error) {
      return text;
    }
  }

  // Format string to title case
  formatTitle(text) {
    try {
      return text
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    } catch (error) {
      return text;
    }
  }

  // Format string to camel case
  formatCamelCase(text) {
    try {
      return text
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
          index === 0 ? word.toLowerCase() : word.toUpperCase()
        )
        .replace(/\s+/g, '');
    } catch (error) {
      return text;
    }
  }

  // Format string to snake case
  formatSnakeCase(text) {
    try {
      return text
        .replace(/\s+/g, '_')
        .replace(/[^\w_]/g, '')
        .toLowerCase();
    } catch (error) {
      return text;
    }
  }

  // Format error message
  formatError(error) {
    try {
      if (typeof error === 'string') return error;
      if (error.message) return error.message;
      if (error.error) return error.error;
      return 'An error occurred';
    } catch (error) {
      return 'An error occurred';
    }
  }

  // Format response
  formatResponse(success, data, message = null, meta = {}) {
    return {
      success,
      data,
      message,
      meta,
      timestamp: new Date().toISOString()
    };
  }

  // Format API error
  formatErrorResponse(error, code = null, details = null) {
    return {
      success: false,
      error: this.formatError(error),
      code: code || 'INTERNAL_ERROR',
      details,
      timestamp: new Date().toISOString()
    };
  }

  // Format validation error
  formatValidationError(errors) {
    return {
      success: false,
      message: 'Validation failed',
      errors,
      timestamp: new Date().toISOString()
    };
  }

  // Format emergency status
  formatEmergencyStatus(status) {
    const statusMap = {
      'pending': 'Pending',
      'dispatched': 'Dispatched',
      'en-route': 'En Route',
      'on-scene': 'On Scene',
      'transporting': 'Transporting',
      'hospital-arrived': 'Arrived at Hospital',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  }

  // Format emergency priority
  formatEmergencyPriority(priority) {
    const priorityMap = {
      'critical': 'Critical',
      'high': 'High',
      'medium': 'Medium',
      'low': 'Low'
    };
    return priorityMap[priority] || priority;
  }

  // Format ambulance status
  formatAmbulanceStatus(status) {
    const statusMap = {
      'available': 'Available',
      'on-duty': 'On Duty',
      'maintenance': 'Maintenance',
      'out-of-service': 'Out of Service'
    };
    return statusMap[status] || status;
  }

  // Format employee role
  formatEmployeeRole(role) {
    const roleMap = {
      'paramedic': 'Paramedic',
      'doctor': 'Doctor',
      'nurse': 'Nurse',
      'dispatcher': 'Dispatcher',
      'admin': 'Administrator',
      'driver': 'Driver'
    };
    return roleMap[role] || role;
  }

  // Format payment status
  formatPaymentStatus(status) {
    const statusMap = {
      'pending': 'Pending',
      'processing': 'Processing',
      'completed': 'Completed',
      'failed': 'Failed',
      'refunded': 'Refunded'
    };
    return statusMap[status] || status;
  }

  // Format to JSON API
  formatJsonApi(data, included = []) {
    return {
      data: data,
      included: included,
      meta: {
        timestamp: new Date().toISOString()
      }
    };
  }

  // Format for CSV
  formatCSV(data, headers = null) {
    try {
      if (!data || data.length === 0) return '';
      
      const csvHeaders = headers || Object.keys(data[0]);
      const csvRows = [
        csvHeaders.join(','),
        ...data.map(row => 
          csvHeaders.map(header => 
            JSON.stringify(row[header] || '')
          ).join(',')
        )
      ];
      
      return csvRows.join('\n');
    } catch (error) {
      return '';
    }
  }

  // Format for Excel
  formatExcel(data, headers = null) {
    // Returns data in format suitable for ExcelJS
    try {
      if (!data || data.length === 0) return { headers: [], rows: [] };
      
      const excelHeaders = headers || Object.keys(data[0]);
      const rows = data.map(row => 
        excelHeaders.map(header => row[header] || '')
      );
      
      return { headers: excelHeaders, rows };
    } catch (error) {
      return { headers: [], rows: [] };
    }
  }

  // Format phone number for display
  formatPhoneDisplay(phone) {
    try {
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
      } else if (cleaned.length === 11) {
        return `${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
      }
      return phone;
    } catch (error) {
      return phone;
    }
  }

  // Format SSN
  formatSSN(ssn) {
    try {
      const cleaned = ssn.replace(/\D/g, '');
      if (cleaned.length === 9) {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
      }
      return ssn;
    } catch (error) {
      return ssn;
    }
  }

  // Format EIN
  formatEIN(ein) {
    try {
      const cleaned = ein.replace(/\D/g, '');
      if (cleaned.length === 9) {
        return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
      }
      return ein;
    } catch (error) {
      return ein;
    }
  }

  // Format coordinates
  formatCoordinates(lat, lng, decimals = 6) {
    try {
      if (!lat || !lng) return null;
      return `${parseFloat(lat).toFixed(decimals)}, ${parseFloat(lng).toFixed(decimals)}`;
    } catch (error) {
      return null;
    }
  }

  // Format distance
  formatDistance(meters) {
    try {
      if (meters >= 1000) {
        return `${(meters / 1000).toFixed(1)} km`;
      } else {
        return `${Math.round(meters)} m`;
      }
    } catch (error) {
      return `${meters} m`;
    }
  }

  // Format temperature
  formatTemperature(celsius, unit = 'C') {
    try {
      if (unit.toUpperCase() === 'F') {
        return `${((celsius * 9/5) + 32).toFixed(1)}°F`;
      }
      return `${celsius.toFixed(1)}°C`;
    } catch (error) {
      return `${celsius}°C`;
    }
  }

  // Format blood pressure
  formatBloodPressure(systolic, diastolic) {
    try {
      return `${systolic}/${diastolic}`;
    } catch (error) {
      return '';
    }
  }

  // Format heart rate
  formatHeartRate(rate) {
    try {
      return `${rate} bpm`;
    } catch (error) {
      return `${rate}`;
    }
  }

  // Format oxygen saturation
  formatOxygenSaturation(saturation) {
    try {
      return `${saturation}%`;
    } catch (error) {
      return `${saturation}`;
    }
  }

  // Format blood glucose
  formatBloodGlucose(level) {
    try {
      return `${level} mg/dL`;
    } catch (error) {
      return `${level}`;
    }
  }

  // Format BMI
  formatBMI(height, weight) {
    try {
      const bmi = weight / ((height / 100) ** 2);
      return bmi.toFixed(1);
    } catch (error) {
      return '0';
    }
  }

  // Format BMI category
  formatBMICategory(bmi) {
    try {
      if (bmi < 18.5) return 'Underweight';
      if (bmi < 25) return 'Normal';
      if (bmi < 30) return 'Overweight';
      if (bmi < 35) return 'Obese Class I';
      if (bmi < 40) return 'Obese Class II';
      return 'Obese Class III';
    } catch (error) {
      return 'Unknown';
    }
  }
}

module.exports = new Formatter();
