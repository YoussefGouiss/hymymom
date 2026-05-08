const rateLimitStore = new Map();

const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS = 5;

function cleanupExpiredEntries(key) {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record) return false;
  
  const validTimestamps = record.timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW);
  
  if (validTimestamps.length === 0) {
    rateLimitStore.delete(key);
    return false;
  }
  
  record.timestamps = validTimestamps;
  rateLimitStore.set(key, record);
  return true;
}

export function checkRateLimit(identifier, limit = MAX_REQUESTS) {
  const now = Date.now();
  const key = identifier;
  
  let record = rateLimitStore.get(key);
  
  if (!record || !cleanupExpiredEntries(key)) {
    record = {
      timestamps: [now],
      blockedUntil: null
    };
  }
  
    if (record.blockedUntil && now < record.blockedUntil) {
      const remainingTime = Math.ceil((record.blockedUntil - now) / 1000);
      return {
        allowed: false,
        remainingTime,
        message: `Too many attempts. Try again in ${remainingTime}s`
      };
    }
    
    const validTimestamps = record.timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW);
    
    if (validTimestamps.length >= limit) {
      record.blockedUntil = now + RATE_LIMIT_WINDOW;
      rateLimitStore.set(key, record);
      return {
        allowed: false,
        remainingTime: Math.ceil(RATE_LIMIT_WINDOW / 1000),
        message: 'Too many attempts. Try again in 1 minute'
      };
    }
  
  record.timestamps = [...validTimestamps, now];
  record.blockedUntil = null;
  rateLimitStore.set(key, record);
  
  return {
    allowed: true,
    remainingRequests: limit - record.timestamps.length,
    remainingTime: 0
  };
}

export function getClientIdentifier(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';
  return ip;
}

export function getEmailIdentifier(email) {
  return `email:${email.toLowerCase()}`;
}

export function clearRateLimit(identifier) {
  rateLimitStore.delete(identifier);
}

export function clearAllRateLimits() {
  rateLimitStore.clear();
}