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
    }
