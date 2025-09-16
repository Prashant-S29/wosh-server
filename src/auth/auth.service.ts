import { Injectable, Inject, Logger } from '@nestjs/common';
import { createAuthConfig } from './auth.config';
import { Database } from 'src/database/db';
import { SignInDto, SignUpDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private auth: ReturnType<typeof createAuthConfig>;
  private readonly logger = new Logger(AuthService.name);

  constructor(@Inject('DATABASE') private database: Database) {
    this.auth = createAuthConfig(this.database);
  }

  async signIn(signInDto: SignInDto) {
    try {
      const result = await this.auth.api.signInEmail({
        body: signInDto,
        asResponse: true,
      });

      const authToken = result.headers.get('set-auth-token');

      return authToken;
    } catch (error) {
      this.logger.error('Sign in error:', error);
      return null;
    }
  }

  async signUp(signUpDto: SignUpDto) {
    try {
      const result = await this.auth.api.signUpEmail({
        body: signUpDto,
        asResponse: true,
      });

      const authToken = result.headers.get('set-auth-token');
      return authToken;
    } catch (error) {
      this.logger.error('Sign up error:', error);
      throw error;
    }
  }

  async getSession(token: string) {
    try {
      const session = await this.auth.api.getSession({
        headers: new Headers({ Authorization: `Bearer ${token}` }),
      });

      return session;
    } catch (error) {
      this.logger.error('Session error:', error);
      return null;
    }
  }

  async signOut(token: string) {
    try {
      const result = await this.auth.api.signOut({
        headers: new Headers({ Authorization: `Bearer ${token}` }),
      });
      return result;
    } catch (error) {
      this.logger.error('Sign out error:', error);
      return null;
    }
  }

  async validateUser(email: string, password: string) {
    try {
      const result = await this.auth.api.signInEmail({
        body: {
          email,
          password,
        },
      });
      return result;
    } catch (error) {
      this.logger.error('User validation error:', error);
      return null;
    }
  }

  async createUser(email: string, password: string, name: string) {
    try {
      const result = await this.auth.api.signUpEmail({
        body: {
          email,
          password,
          name,
        },
      });
      return result;
    } catch (error) {
      this.logger.error('User creation error:', error);
      throw error;
    }
  }

  getAuthHandler() {
    return this.auth.handler;
  }
}
