/**
 * Base error definition type
 */
export interface ErrorDefinition {
  code: string;
  message: string;
  statusCode: number;
}

/**
 * Categorized error definitions
 */
export const ALL_ERRORS = {
  AUTH: [
    {
      code: 'INVALID_EMAIL_OR_PASSWORD',
      message: 'Invalid email or password',
      statusCode: 401,
    },
    {
      code: 'TOKEN_EXPIRED',
      message: 'Authentication token has expired',
      statusCode: 401,
    },
    {
      code: 'TOKEN_MISSING',
      message: 'Authentication token is required',
      statusCode: 401,
    },
    {
      code: 'ACCOUNT_LOCKED',
      message: 'Account is temporarily locked',
      statusCode: 423,
    },
    {
      code: 'USER_NOT_FOUND',
      message: 'User account not found',
      statusCode: 404,
    },
    {
      code: 'USER_ALREADY_EXISTS',
      message: 'User account already exists',
      statusCode: 409,
    },
    {
      code: 'INVALID_EMAIL_FORMAT',
      message: 'Invalid email format',
      statusCode: 400,
    },
    {
      code: 'WEAK_PASSWORD',
      message: 'Password is too weak',
      statusCode: 400,
    },
    {
      code: 'RATE_LIMITED',
      message: 'Too many attempts, please try again later',
      statusCode: 429,
    },
    {
      code: 'SESSION_EXPIRED',
      message: 'Session has expired',
      statusCode: 401,
    },
  ],
  ORGANIZATION: [
    {
      code: 'ORG_NOT_FOUND',
      message: 'Organization not found',
      statusCode: 404,
    },
    {
      code: 'ORG_NOT_MEMBER',
      message: 'User is not a member of this organization',
      statusCode: 403,
    },
    {
      code: 'ORG_INVITATION_EXISTS',
      message: 'Invitation already sent to this user',
      statusCode: 409,
    },
    {
      code: 'ORG_MEMBER_LIMIT_EXCEEDED',
      message: 'Organization member limit exceeded',
      statusCode: 402,
    },
    {
      code: 'DEVICE_NOT_FOUND',
      message: 'Device registration not found',
      statusCode: 404,
    },
  ],
  PROJECT: [
    {
      code: 'PROJECT_NOT_FOUND',
      message: 'Project not found',
      statusCode: 404,
    },
    {
      code: 'PROJECT_NAME_CONFLICT',
      message: 'Project name already exists',
      statusCode: 409,
    },
    {
      code: 'PROJECT_CREATION_LIMIT_EXCEEDED',
      message: 'Project creation limit exceeded',
      statusCode: 402,
    },
    {
      code: 'PROJECT_HAS_ACTIVE_RESOURCES',
      message: 'Cannot delete project with active resources',
      statusCode: 409,
    },
  ],
  SERVER: [
    {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      statusCode: 500,
    },
    {
      code: 'DATABASE_ERROR',
      message: 'Database connection error',
      statusCode: 503,
    },
    {
      code: 'SERVICE_UNAVAILABLE',
      message: 'Service temporarily unavailable',
      statusCode: 503,
    },
    {
      code: 'REQUEST_TIMEOUT',
      message: 'Request timeout',
      statusCode: 504,
    },
  ],
  VALIDATION: [
    {
      code: 'REQUIRED_FIELD',
      message: 'Required field is missing',
      statusCode: 400,
    },
    {
      code: 'INVALID_FORMAT',
      message: 'Invalid field format',
      statusCode: 400,
    },
    {
      code: 'VALUE_OUT_OF_RANGE',
      message: 'Value is out of allowed range',
      statusCode: 400,
    },
    {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      statusCode: 400,
    },
  ],
  PERMISSION: [
    {
      code: 'INSUFFICIENT_PERMISSIONS',
      message: 'Insufficient permissions',
      statusCode: 403,
    },
    {
      code: 'ACCESS_DENIED',
      message: 'Access denied to this resource',
      statusCode: 403,
    },
  ],
  RATE_LIMIT: [
    {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests',
      statusCode: 429,
    },
    {
      code: 'QUOTA_EXCEEDED',
      message: 'API quota exceeded',
      statusCode: 429,
    },
  ],
  GENERIC: [
    {
      code: 'NOT_FOUND',
      message: 'Resource not found',
      statusCode: 404,
    },
    {
      code: 'BAD_REQUEST',
      message: 'Bad request',
      statusCode: 400,
    },
    {
      code: 'UNKNOWN_ERROR',
      message: 'Unknown error occurred',
      statusCode: 500,
    },
    {
      code: 'FORBIDDEN',
      message: 'Forbidden',
      statusCode: 403,
    },
  ],
} as const;

/**
 * Extract all error codes as a union type
 */
export type AllErrorCodes =
  (typeof ALL_ERRORS)[keyof typeof ALL_ERRORS][number]['code'];

/**
 * Helper function to get error by code
 */
export function getErrorByCode(code: string): ErrorDefinition | undefined {
  for (const category of Object.values(ALL_ERRORS)) {
    const error = category.find((err) => err.code === code);
    if (error) return error;
  }
  return undefined;
}

/**
 * Helper function to get all errors as a flat array
 */
export function getAllErrors(): ErrorDefinition[] {
  return Object.values(ALL_ERRORS).flat();
}
