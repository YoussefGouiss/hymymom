export const AUTH_ERRORS = {
  // Registration errors
  EMAIL_EXISTS: {
    code: 'EMAIL_EXISTS',
    title: 'Email Already Registered',
    message: 'This email is already linked to an account. Would you like to sign in instead?',
    type: 'warning',
    action: { text: 'Sign In Instead', link: '/login' }
  },
  WEAK_PASSWORD: {
    code: 'WEAK_PASSWORD',
    title: 'Password Too Weak',
    message: 'Your password must be at least 8 characters and include a number.',
    type: 'error'
  },
  PASSWORD_MISMATCH: {
    code: 'PASSWORD_MISMATCH',
    title: 'Passwords Do Not Match',
    message: 'Please make sure both passwords are identical.',
    type: 'error'
  },
  EMPTYFields: {
    code: 'EMPTY_FIELDS',
    title: 'Missing Information',
    message: 'Please fill in all required fields.',
    type: 'error'
  },
  INVALID_EMAIL: {
    code: 'INVALID_EMAIL',
    title: 'Invalid Email Address',
    message: 'Please enter a valid email address.',
    type: 'error'
  },

  // Login errors
  INVALID_CREDENTIALS: {
    code: 'INVALID_CREDENTIALS',
    title: 'Invalid Credentials',
    message: 'The email or password you entered is incorrect. Please try again.',
    type: 'error'
  },
  UNREGISTERED_USER: {
    code: 'UNREGISTERED_USER',
    title: 'Account Not Found',
    message: 'This email is not registered yet. Would you like to create an account?',
    type: 'warning',
    action: { text: 'Create Account', link: '/register' }
  },
  ACCOUNT_LOCKED: {
    code: 'ACCOUNT_LOCKED',
    title: 'Account Temporarily Locked',
    message: 'Too many failed attempts. Please try again in 15 minutes.',
    type: 'error'
  },

  // Verification errors
  INVALID_CODE: {
    code: 'INVALID_CODE',
    title: 'Invalid Verification Code',
    message: 'The code you entered is incorrect. Please check and try again.',
    type: 'error'
  },
  EXPIRED_CODE: {
    code: 'EXPIRED_CODE',
    title: 'Code Expired',
    message: 'Your verification code has expired. Would you like us to resend a new one?',
    type: 'warning',
    action: { text: 'Resend Code', action: 'resend' }
  },
  CODE_NOT_FOUND: {
    code: 'CODE_NOT_FOUND',
    title: 'Verification Required',
    message: 'Please verify your email to continue.',
    type: 'warning'
  },

  // OAuth errors
  GOOGLE_AUTH_FAILED: {
    code: 'GOOGLE_AUTH_FAILED',
    title: 'Google Sign-In Failed',
    message: 'We couldn\'t complete the Google sign-in. Please try again.',
    type: 'error'
  },
  GOOGLE_AUTH_CANCELLED: {
    code: 'GOOGLE_AUTH_CANCELLED',
    title: 'Sign-In Cancelled',
    message: 'The Google sign-in was cancelled. Please try again.',
    type: 'info'
  },
  NO_TOKEN_RECEIVED: {
    code: 'NO_TOKEN_RECEIVED',
    title: 'Authentication Error',
    message: 'No authentication token was received. Please try again.',
    type: 'error'
  },

  // Network/Server errors
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    title: 'Connection Error',
    message: 'Unable to connect to the server. Please check your internet connection.',
    type: 'error'
  },
  SERVER_ERROR: {
    code: 'SERVER_ERROR',
    title: 'Server Error',
    message: 'Something went wrong on our end. Please try again later.',
    type: 'error'
  },
  UNKNOWN_ERROR: {
    code: 'UNKNOWN_ERROR',
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again.',
    type: 'error'
  }
};

export function parseAuthError(response, data, error) {
  const status = response?.status;
  const message = data?.message || error?.message || data?.error?.message || '';
  
  // Handle string messages directly
  if (typeof data === 'string') {
    return {
      code: 'SERVER_MESSAGE',
      title: 'Notice',
      message: data,
      type: 'info'
    };
  }
  
  // Handle object with message property
  if (data?.message && typeof data.message === 'string' && data.message.length > 0) {
    // Already has a message, will be parsed below
  }

  // Registration errors
  if (message.includes('already been taken') || message.includes('email has already') || message.includes('User already registered') || message.includes('already been registered') || message.includes('already registered')) {
    return {
      ...AUTH_ERRORS.EMAIL_EXISTS,
      message: message // Use the actual message from the backend
    };
  }
  if (message.includes('password') && message.includes('weak')) {
    return AUTH_ERRORS.WEAK_PASSWORD;
  }
  if (message.includes('confirmed')) {
    return AUTH_ERRORS.PASSWORD_MISMATCH;
  }
  if (message.includes('required') || message.includes('filled')) {
    return AUTH_ERRORS.EMPTYFields;
  }
  if (message.includes('invalid email') || (message.includes('email') && message.includes('valid') && !message.includes('password'))) {
    return AUTH_ERRORS.INVALID_EMAIL;
  }

  // Login errors
  if (status === 401 || status === 400 || message.includes('Invalid') || message.includes('password')) {
    return AUTH_ERRORS.INVALID_CREDENTIALS;
  }
  if (status === 404 || message.includes('not found') || message.includes('not registered') || message.includes('User not found')) {
    return AUTH_ERRORS.UNREGISTERED_USER;
  }
  if (status === 403 || message.includes('verify')) {
    return AUTH_ERRORS.CODE_NOT_FOUND;
  }
  if (message.includes('locked') || message.includes('too many attempts')) {
    return AUTH_ERRORS.ACCOUNT_LOCKED;
  }

  // Verification errors
  if (message.includes('Wrong') || (message.includes('Invalid') && message.includes('code')) || message.includes('Incorrect')) {
    return AUTH_ERRORS.INVALID_CODE;
  }
  if (message.includes('expired')) {
    return AUTH_ERRORS.EXPIRED_CODE;
  }
  if (message.includes('verify')) {
    return AUTH_ERRORS.CODE_NOT_FOUND;
  }

  // OAuth errors
  if (message.includes('token_exchange_failed')) {
    return AUTH_ERRORS.GOOGLE_AUTH_FAILED;
  }
  if (message.includes('cancelled')) {
    return AUTH_ERRORS.GOOGLE_AUTH_CANCELLED;
  }
  if (message.includes('no_token') || message.includes('token received')) {
    return AUTH_ERRORS.NO_TOKEN_RECEIVED;
  }

  // Network/Server errors
  if (message.includes('network') || message.includes('fetch')) {
    return AUTH_ERRORS.NETWORK_ERROR;
  }
  if (status >= 500) {
    return AUTH_ERRORS.SERVER_ERROR;
  }

  return AUTH_ERRORS.UNKNOWN_ERROR;
}