import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../auth.service';
import { AuthenticatedRequest } from 'src/types/authenticatedRequest.types';
import { PROTECTED_KEY } from 'src/common/decorators';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private authService: AuthService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is protected
    const isProtected = this.reflector.getAllAndOverride<boolean>(
      PROTECTED_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!isProtected) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = (
      request.headers as Headers & { authorization?: string }
    )?.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        data: null,
        error: {
          code: 'TOKEN_MISSING',
          message: 'Authentication token is required',
          statusCode: 401,
        },
        message: 'Authorization header required',
      });
    }

    const token = authorization.replace('Bearer ', '').trim();

    if (!token) {
      throw new UnauthorizedException({
        data: null,
        error: {
          code: 'TOKEN_MISSING',
          message: 'Authentication token is required',
          statusCode: 401,
        },
        message: 'Invalid token format',
      });
    }

    try {
      const sessionResult = await this.authService.getSession(token);

      if (sessionResult.error || !sessionResult.data) {
        throw new UnauthorizedException({
          data: null,
          error: sessionResult.error || {
            code: 'TOKEN_EXPIRED',
            message: 'Authentication token has expired',
            statusCode: 401,
          },
          message: 'Invalid or expired token',
        });
      }

      // Attach user to request object
      request.user = sessionResult.data.user;
      request.session = sessionResult.data;

      return true;
    } catch (error) {
      this.logger.error('Auth guard error:', error);

      // If it's already an UnauthorizedException, re-throw it
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // For other errors, throw a generic unauthorized exception
      throw new UnauthorizedException({
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          statusCode: 500,
        },
        message: 'Authentication failed',
      });
    }
  }
}
