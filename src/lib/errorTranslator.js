/**
 * Error message mapping utility
 * Translates technical errors to user-friendly messages
 */

export function translateErrorMessage(error) {
  if (!error) {
    return 'An unexpected error occurred. Please try again.';
  }

  const errorStr = error.message || error.toString();
  const errorLower = errorStr.toLowerCase();

  // Database validation errors
  if (errorLower.includes('invalid input syntax for type date')) {
    return 'Birth date format is invalid. Please select a valid date.';
  }

  if (errorLower.includes('invalid input syntax for type uuid')) {
    return 'Invalid family ID. Please refresh and try again.';
  }

  if (errorLower.includes('invalid input syntax for type numeric')) {
    return 'Package amount must be a valid number.';
  }

  // Foreign key constraint errors
  if (errorLower.includes('violates foreign key')) {
    return 'This record references data that no longer exists. Please refresh and try again.';
  }

  // Unique constraint errors
  if (errorLower.includes('duplicate key') || errorLower.includes('unique constraint')) {
    return 'This record already exists. Please check your entries.';
  }

  // NOT NULL constraint errors
  if (errorLower.includes('not-null constraint')) {
    return 'Some required fields are missing. Please fill in all required fields.';
  }

  if (errorLower.includes('null value in column')) {
    return 'Some required information is missing. Please complete all required fields.';
  }

  // Check constraint errors
  if (errorLower.includes('new row violates check constraint')) {
    return 'One or more fields contain invalid values. Please check your entries.';
  }

  // Timeout errors
  if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
    return 'Request took too long. Please try again.';
  }

  // Network errors
  if (errorLower.includes('network') || errorLower.includes('connection')) {
    return 'Network error. Please check your internet connection and try again.';
  }

  // Authentication errors
  if (errorLower.includes('unauthorized') || errorLower.includes('jwt')) {
    return 'Your session has expired. Please log in again.';
  }

  // Permission errors
  if (errorLower.includes('permission') || errorLower.includes('forbidden')) {
    return 'You do not have permission to perform this action.';
  }

  // Not found errors
  if (errorLower.includes('not found') || errorLower.includes('does not exist')) {
    return 'This record could not be found. It may have been deleted. Please refresh the page.';
  }

  // Default fallback
  console.warn('Unhandled error:', errorStr);
  return 'An error occurred while saving. Please try again.';
}

export function getFieldError(error, fieldName) {
  if (!error) return null;

  const errorStr = error.message || error.toString();
  const errorLower = errorStr.toLowerCase();

  // Map specific field errors
  if (errorLower.includes('mother') || errorLower.includes('name')) {
    return 'Please enter a valid name.';
  }

  if (errorLower.includes('date') || errorLower.includes('birth')) {
    return 'Birth date format is invalid.';
  }

  if (errorLower.includes('amount') || errorLower.includes('numeric')) {
    return 'Package amount must be a valid number.';
  }

  return null;
}
