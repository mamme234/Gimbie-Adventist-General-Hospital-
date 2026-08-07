// middleware/notFound.js
const { logger } = require('../utils/logger');

const notFoundHandler = (req, res, next) => {
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
    code: 'NOT_FOUND',
    path: req.originalUrl,
    method: req.method
  });
};

module.exports = notFoundHandler;
