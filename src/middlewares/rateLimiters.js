const { ipKeyGenerator, rateLimit } = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = String(req.body?.email || '').trim().toLowerCase().slice(0, 254);
    return 'login:' + ipKeyGenerator(req.ip) + ':' + email;
  },
  message: { error: 'too_many_requests' },
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => 'register:' + ipKeyGenerator(req.ip),
  message: { error: 'too_many_requests' },
});

const startSessionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => 'session:' + String(req.user?.id || req.user?.email || ipKeyGenerator(req.ip)),
  message: { error: 'too_many_requests' },
});

const sendMessageMinuteLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => 'message-minute:' + String(req.user?.id || req.user?.email || ipKeyGenerator(req.ip)),
  message: { error: 'too_many_requests' },
});

const sendMessageDailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  limit: 500,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => 'message-day:' + String(req.user?.id || req.user?.email || ipKeyGenerator(req.ip)),
  message: { error: 'daily_message_limit_reached' },
});

module.exports = {
  loginLimiter,
  registerLimiter,
  startSessionLimiter,
  sendMessageMinuteLimiter,
  sendMessageDailyLimiter,
};
