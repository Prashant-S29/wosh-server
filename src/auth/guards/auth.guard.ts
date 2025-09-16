import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { AuthenticatedRequest } from 'src/types/authenticatedRequest.types';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.get('Authorization');

    if (!authorization) {
      throw new UnauthorizedException('Authorization header required');
    }

    const token = authorization.replace('Bearer ', '');
    const session = await this.authService.getSession(token);

    if (!session) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Attach user to request object
    request.user = session.user;
    request.session = session;

    return true;
  }
}
