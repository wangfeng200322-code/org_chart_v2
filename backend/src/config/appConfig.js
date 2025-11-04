// Application configuration with environment overrides

export const rateLimitConfig = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '', 10) || 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || '', 10) || 100
};


