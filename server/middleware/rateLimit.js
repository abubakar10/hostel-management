const buckets = new Map();

export function rateLimit({ windowMs = 15 * 60 * 1000, max = 20, message } = {}) {
  return (req, res, next) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const bucket = buckets.get(key) || [];
    const recent = bucket.filter((time) => now - time < windowMs);
    recent.push(now);
    buckets.set(key, recent);

    if (recent.length > max) {
      return res.status(429).json({
        error: message || 'Too many attempts. Please wait a few minutes and try again.'
      });
    }

    next();
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, times] of buckets.entries()) {
    const recent = times.filter((time) => now - time < 60 * 60 * 1000);
    if (recent.length === 0) buckets.delete(key);
    else buckets.set(key, recent);
  }
}, 10 * 60 * 1000).unref?.();
