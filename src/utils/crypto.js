import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

function deriveKey(salt) {
  const key = process.env.OTP_ENCRYPTION_KEY;
  if (!key || key.length < 32) {
    console.warn('OTP_ENCRYPTION_KEY not set or too short, using temporary key');
    return crypto.pbkdf2Sync('temporary-development-key-please-change', salt, ITERATIONS, KEY_LENGTH, 'sha256');
  }
  return crypto.pbkdf2Sync(key, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

export function hashOTP(otp) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(otp, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return `${salt.toString('hex')}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

export function verifyOTP(otp, hashedOTP) {
  try {
    const [saltHex, ivHex, tagHex, encrypted] = hashedOTP.split(':');
    
    if (!saltHex || !ivHex || !tagHex || !encrypted) {
      return false;
    }
    
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const key = deriveKey(salt);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted === otp;
  } catch (error) {
    console.error('OTP verification error:', error.message);
    return false;
  }
}

export function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export function verifyPassword(password, storedHash) {
  try {
    const [saltHex, hashHex] = storedHash.split(':');
    const salt = Buffer.from(saltHex, 'hex');
    const hash = Buffer.from(hashHex, 'hex');
    
    const derivedHash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
    
    return crypto.timingSafeEqual(hash, derivedHash);
  } catch (error) {
    console.error('Password verification error:', error.message);
    return false;
  }
}