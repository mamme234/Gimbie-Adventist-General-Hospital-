// middleware/notFound.js
const { AuditLog } = require('../models/AuditLog');
const { logger } = require('./logger');

const notFoundHandler = (req, res, next) => {
  // Log 404
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  // Log to audit for security (potential scanning)
  if (isSuspiciousPath(req.originalUrl)) {
    AuditLog.logAction({
      action: 'not_found',
      resource: 'security',
      userId: req.user?._id || null,
      details: {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      status: 'failure',
      severity: 'warning'
    }).catch(err => logger.error('Audit log error:', err));
  }

  // Check if request expects HTML
  const acceptsHtml = req.accepts('html');
  if (acceptsHtml) {
    // For SPA, serve index.html
    if (req.path.startsWith('/app')) {
      return res.sendFile('index.html', { root: './public' });
    }
  }

  // API JSON response
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
    code: 'NOT_FOUND',
    path: req.originalUrl,
    method: req.method
  });
};

// Check for suspicious paths (potential security scanning)
function isSuspiciousPath(path) {
  const suspiciousPatterns = [
    /\.env/i,
    /\.git/i,
    /\/admin\//i,
    /\/wp-admin/i,
    /\/phpmyadmin/i,
    /\/cpanel/i,
    /\/webmail/i,
    /\.sql/i,
    /\.log/i,
    /\/backup/i,
    /\/config/i,
    /\.htaccess/i,
    /\/server-status/i,
    /\/info\.php/i,
    /\/test/i,
    /\/vendor/i,
    /\/node_modules/i,
    /\.aws/i,
    /\.ssh/i,
    /\.docker/i,
    /\/api\/v1\/?$/i,
    /\/\.env/i,
    /\/\.git/i,
    /\/\.svn/i,
    /\/\.hg/i,
    /\/\.bzr/i,
    /\/\.cvs/i,
    /\/\/\//, // Multiple slashes (path traversal)
    /\/\.\./, // Directory traversal
    /%2e%2e/, // URL encoded traversal
    /%00/, // Null byte
    /<script/i, // XSS attempt
    /javascript:/i, // XSS attempt
    /onerror=/i, // XSS attempt
    /onload=/i // XSS attempt
  ];

  return suspiciousPatterns.some(pattern => pattern.test(path));
}

module.exports = notFoundHandler;
