const rateLimit = require('express-rate-limit');

const adminLoginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { error: true, message: "Juda ko'p so'rovlar. Iltimos, keyinroq qayta urinib ko'ring." },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: true, message: "Juda ko'p so'rovlar. Iltimos, keyinroq qayta urinib ko'ring." },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { adminLoginLimiter, apiLimiter };
