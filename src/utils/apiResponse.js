import { NextResponse } from 'next/server';

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid credentials or verification code',
  EMAIL_NOT_VERIFIED: 'Email verification required',
  RATE_LIMITED: 'Too many requests. Please try again later.',
  ACCOUNT_LOCKED: 'Account temporarily locked. Please try again later.',
  INVALID_CODE: 'Invalid or expired verification code',
  CODE_EXPIRED: 'Verification code has expired',
  MAX_ATTEMPTS: 'Maximum attempts exceeded. Please request a new code.',
  SERVER_ERROR: 'An error occurred. Please try again later.',
  INVALID_REQUEST: 'Invalid request',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Access denied'
};

export function successResponse(data, status = 200) {
  return NextResponse.json({
    success: true,
    ...data
  }, { status });
}

export function errorResponse(message, status = 400, code = null) {
  return NextResponse.json({
    success: false,
    message,
    code
  }, { status });
}

export function rateLimitResponse(message, retryAfter) {
  return NextResponse.json({
    success: false,
    message,
    retryAfter
  }, { 
    status: 429,
    headers: {
      'Retry-After': retryAfter.toString()
    }
  });
}

export function unauthorizedResponse(message = AUTH_ERRORS.UNAUTHORIZED) {
  return errorResponse(message, 401);
}

export function forbiddenResponse(message = AUTH_ERRORS.FORBIDDEN) {
  return errorResponse(message, 403);
}

export function validationErrorResponse(message = AUTH_ERRORS.INVALID_REQUEST) {
  return errorResponse(message, 422);
}

export function serverErrorResponse(message = AUTH_ERRORS.SERVER_ERROR) {
  return errorResponse(message, 500);
}

export function tooManyRequestsResponse(message = AUTH_ERRORS.RATE_LIMITED, retryAfter = 60) {
  return rateLimitResponse(message, retryAfter);
}