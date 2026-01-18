const rateLimit = require('express-rate-limit');

// Rate limiter untuk auth endpoints (login/register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5, // Limit 5 requests per windowMs
  message: {
    success: false,
    message: 'Terlalu banyak percobaan. Silakan coba lagi setelah 15 menit.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter umum untuk API
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 menit
  max: 100, // 100 requests per menit
  message: {
    success: false,
    message: 'Terlalu banyak request. Silakan coba lagi nanti.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter untuk forgot password
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 jam
  max: 3, // 3 requests per jam
  message: {
    success: false,
    message: 'Terlalu banyak permintaan reset password. Silakan coba lagi setelah 1 jam.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  apiLimiter,
  forgotPasswordLimiter
};
