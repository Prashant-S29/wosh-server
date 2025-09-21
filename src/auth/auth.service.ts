import { Injectable, Inject, Logger } from '@nestjs/common';
import { createAuthConfig } from './auth.config';
import { Database } from 'src/database/db';
import { SignInDto, SignUpDto } from './dto/auth.dto';
import { ErrorService } from 'src/common/errors/error.service';
import { APIError } from 'better-auth';
import { AllErrorCodes } from 'src/config/error.config';

export interface ServiceResponse<T = any> {
  data: T | null;
  error: {
    code: string;
    message: string;
    statusCode: number;
  } | null;
  message: string;
}

@Injectable()
export class AuthService {
  private auth: ReturnType<typeof createAuthConfig>;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly errorService: ErrorService,
    @Inject('DATABASE') private readonly database: Database,
  ) {
    this.auth = createAuthConfig(this.database);
  }

  async signIn(signInDto: SignInDto) {
    try {
      const { headers } = await this.auth.api.signInEmail({
        body: signInDto,
        returnHeaders: true,
      });

      const authToken = headers.get('set-auth-token');

      if (!authToken) {
        const errorDef = this.errorService.getErrorByCode('TOKEN_EXPIRED');
        return {
          data: null,
          error: errorDef,
          message: 'Authentication successful but token not received',
        };
      }

      return {
        data: { token: authToken },
        error: null,
        message: 'Successfully signed in',
      };
    } catch (error) {
      this.logger.error('Sign in error:', error);

      if (error instanceof APIError) {
        const errorCode = this.mapBetterAuthErrorToCode(error);
        const errorDef = this.errorService.getErrorByCode(errorCode);

        return {
          data: null,
          error: errorDef,
          message: this.getErrorMessage(errorCode, 'signin'),
        };
      }

      return {
        data: null,
        error: this.errorService.getErrorByCode('INTERNAL_ERROR'),
        message: 'Something went wrong during sign in',
      };
    }
  }

  async signUp(
    signUpDto: SignUpDto,
  ): Promise<ServiceResponse<{ token: string }>> {
    try {
      const { headers } = await this.auth.api.signUpEmail({
        body: { ...signUpDto },
        returnHeaders: true,
      });

      const authToken = headers.get('set-auth-token');

      if (!authToken) {
        const errorDef = this.errorService.getErrorByCode(
          'TOKEN_MISSING' as AllErrorCodes,
        );
        return {
          data: null,
          error: errorDef || {
            code: 'TOKEN_MISSING',
            message: 'Authentication token not received',
            statusCode: 400,
          },
          message: 'Account created successfully but token not received',
        };
      }

      return {
        data: { token: authToken },
        error: null,
        message: 'Account created successfully',
      };
    } catch (error) {
      this.logger.error('Sign up error:', error);

      if (error instanceof APIError) {
        const errorCode = this.mapBetterAuthErrorToCode(error);
        const errorDef = this.errorService.getErrorByCode(errorCode);

        return {
          data: null,
          error: errorDef || {
            code: errorCode,
            message: error.body?.message || error.message || 'Sign up failed',
            statusCode: error.statusCode || 400,
          },
          message: this.getErrorMessage(errorCode, 'signup'),
        };
      }

      const errorDef = this.errorService.getErrorByCode(
        'INTERNAL_ERROR' as AllErrorCodes,
      );
      return {
        data: null,
        error: errorDef || {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          statusCode: 500,
        },
        message: 'Something went wrong during account creation',
      };
    }
  }

  async getSession(token: string) {
    try {
      const session = await this.auth.api.getSession({
        headers: new Headers({ Authorization: `Bearer ${token}` }),
      });

      return {
        data: session,
        error: null,
        message: 'Session retrieved successfully',
      };
    } catch (error) {
      this.logger.error('Get session error:', error);

      if (error instanceof APIError) {
        const errorCode = this.mapBetterAuthErrorToCode(error);
        const errorDef = this.errorService.getErrorByCode(errorCode);

        return {
          data: { session: null },
          error: errorDef || {
            code: errorCode,
            message:
              error.body?.message ||
              error.message ||
              'Session retrieval failed',
            statusCode: error.statusCode || 401,
          },
          message: this.getErrorMessage(errorCode, 'session'),
        };
      }

      const errorDef = this.errorService.getErrorByCode(
        'INTERNAL_ERROR' as AllErrorCodes,
      );
      return {
        data: { session: null },
        error: errorDef || {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          statusCode: 500,
        },
        message: 'Something went wrong while retrieving session',
      };
    }
  }

  async getSessionFromAuthCookie(authCookie: string | undefined) {
    if (!authCookie || !authCookie.startsWith('Bearer ')) {
      const errorDef = this.errorService.getErrorByCode('TOKEN_MISSING');
      return {
        data: null,
        error: errorDef || {
          code: 'TOKEN_MISSING',
          message: 'Authentication token is required',
          statusCode: 400,
        },
        message: 'Authorization token is required',
      };
    }

    const token = this.extractTokenFromHeader(authCookie);

    if (!token) {
      const errorDef = this.errorService.getErrorByCode('TOKEN_MISSING');
      return {
        data: null,
        error: errorDef || {
          code: 'TOKEN_MISSING',
          message: 'Authentication token is required',
          statusCode: 400,
        },
        message: 'Authorization token is required',
      };
    }

    const session = await this.getSession(token);

    if (!session.data?.session) {
      return {
        data: null,
        error: session.error,
        message: 'Session not found or expired',
      };
    }

    return {
      data: session.data,
      error: null,
      message: 'Successfully signed in',
    };
  }

  async signOut(token: string): Promise<ServiceResponse<{ success: boolean }>> {
    try {
      await this.auth.api.signOut({
        headers: new Headers({ Authorization: `Bearer ${token}` }),
      });

      return {
        data: { success: true },
        error: null,
        message: 'Successfully signed out',
      };
    } catch (error) {
      this.logger.error('Sign out error:', error);

      if (error instanceof APIError) {
        const errorCode = this.mapBetterAuthErrorToCode(error);
        const errorDef = this.errorService.getErrorByCode(errorCode);

        return {
          data: null,
          error: errorDef || {
            code: errorCode,
            message: error.body?.message || error.message || 'Sign out failed',
            statusCode: error.statusCode || 400,
          },
          message: this.getErrorMessage(errorCode, 'signout'),
        };
      }

      const errorDef = this.errorService.getErrorByCode(
        'INTERNAL_ERROR' as AllErrorCodes,
      );
      return {
        data: null,
        error: errorDef || {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          statusCode: 500,
        },
        message: 'Something went wrong during sign out',
      };
    }
  }

  /**
   * Map Better Auth error codes to our standardized error codes
   */
  private mapBetterAuthErrorToCode(error: APIError): AllErrorCodes {
    const errorCode = error.body?.code || error.message;
    const errorMessage = error.body?.message || error.message || '';

    // Map specific Better Auth error codes
    if (
      errorCode === 'INVALID_EMAIL_OR_PASSWORD' ||
      errorMessage.toLowerCase().includes('invalid password') ||
      errorMessage.toLowerCase().includes('user not found')
    ) {
      return 'INVALID_EMAIL_OR_PASSWORD' as AllErrorCodes;
    }

    if (
      errorCode === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL' ||
      errorMessage.toLowerCase().includes('already exists')
    ) {
      return 'USER_ALREADY_EXISTS' as AllErrorCodes;
    }

    if (
      errorMessage.toLowerCase().includes('invalid email') ||
      errorMessage.toLowerCase().includes('email format')
    ) {
      return 'INVALID_EMAIL_FORMAT' as AllErrorCodes;
    }

    if (
      errorMessage.toLowerCase().includes('weak password') ||
      errorMessage.toLowerCase().includes('password')
    ) {
      return 'WEAK_PASSWORD' as AllErrorCodes;
    }

    if (
      errorMessage.toLowerCase().includes('rate limit') ||
      errorMessage.toLowerCase().includes('too many')
    ) {
      return 'RATE_LIMITED' as AllErrorCodes;
    }

    if (
      errorMessage.toLowerCase().includes('session') &&
      errorMessage.toLowerCase().includes('expired')
    ) {
      return 'SESSION_EXPIRED' as AllErrorCodes;
    }

    if (
      errorMessage.toLowerCase().includes('token') &&
      errorMessage.toLowerCase().includes('expired')
    ) {
      return 'TOKEN_EXPIRED' as AllErrorCodes;
    }

    if (
      errorMessage.toLowerCase().includes('unauthorized') ||
      error.statusCode === 401
    ) {
      return 'TOKEN_EXPIRED' as AllErrorCodes;
    }

    if (
      errorMessage.toLowerCase().includes('forbidden') ||
      error.statusCode === 403
    ) {
      return 'ACCESS_DENIED' as AllErrorCodes;
    }

    // Default fallback based on status code
    if (error.statusCode >= 500) {
      return 'INTERNAL_ERROR' as AllErrorCodes;
    }

    return 'BAD_REQUEST' as AllErrorCodes;
  }

  /**
   * Get user-friendly error messages
   */
  private getErrorMessage(errorCode: AllErrorCodes, operation: string): string {
    switch (errorCode) {
      case 'INVALID_EMAIL_OR_PASSWORD':
        return 'Invalid email or password. Please check your credentials and try again.';
      case 'USER_ALREADY_EXISTS':
        return 'An account with this email already exists. Please sign in instead.';
      case 'INVALID_EMAIL_FORMAT':
        return 'Please enter a valid email address.';
      case 'WEAK_PASSWORD':
        return 'Password is too weak. Please choose a stronger password.';
      case 'RATE_LIMITED':
        return 'Too many attempts. Please try again later.';
      case 'SESSION_EXPIRED':
      case 'TOKEN_EXPIRED':
        return 'Your session has expired. Please sign in again.';
      case 'ACCESS_DENIED':
        return 'Access denied. You do not have permission to perform this action.';
      case 'INTERNAL_ERROR':
        return 'Server error occurred. Please try again later.';
      default:
        switch (operation) {
          case 'signin':
            return 'Sign in failed. Please check your credentials and try again.';
          case 'signup':
            return 'Account creation failed. Please try again.';
          case 'session':
            return 'Unable to retrieve session information.';
          case 'signout':
            return 'Sign out failed. Please try again.';
          case 'validation':
            return 'User validation failed. Please check your credentials.';
          case 'creation':
            return 'User creation failed. Please try again.';
          default:
            return 'Something went wrong. Please try again.';
        }
    }
  }

  private extractTokenFromHeader(authorization: string): string | null {
    try {
      const token = authorization.replace('Bearer ', '').trim();
      return token || null;
    } catch (error) {
      this.logger.error('Error extracting token from header:', error);
      return null;
    }
  }

  getAuthHandler() {
    return this.auth.handler;
  }
}
