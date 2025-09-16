import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { SignInDto, SignUpDto } from './dto/auth.dto';
import { ResponseService } from '../common/services/response.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly response: ResponseService,
  ) {}

  @Post('signin')
  @ApiOperation({ summary: 'Sign in with email and password' })
  async signIn(@Body() signInDto: SignInDto) {
    const token = await this.authService.signIn(signInDto);

    if (!token) {
      return this.response.error(
        'SIGNIN_FAILED',
        'Sign in failed',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.response.success(
      { token: token },
      'Signed in successfully',
      HttpStatus.OK,
    );
  }

  @Post('signup')
  @ApiOperation({ summary: 'Sign up with email and password' })
  @ApiResponse({ status: 201, description: 'Successfully signed up' })
  async signUp(@Body() signUpDto: SignUpDto) {
    try {
      const token = await this.authService.signUp(signUpDto);

      if (!token) {
        return this.response.error(
          'SIGNUP_FAILED',
          'Sign up failed',
          HttpStatus.BAD_REQUEST,
        );
      }

      return this.response.success(
        { token: token },
        'Signed up successfully',
        HttpStatus.CREATED,
      );
    } catch (error) {
      this.logger.error('Sign up controller error:', error);
      return this.response.error(
        'SIGNUP_FAILED',
        'Sign up failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('session')
  @ApiOperation({ summary: 'Get current session' })
  async getSession(@Req() req: Request) {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      return this.response.success(
        { session: null },
        'No session found',
        HttpStatus.OK,
      );
    }

    const token = authorization.replace('Bearer ', '');
    const session = await this.authService.getSession(token);

    if (!session) {
      return this.response.success(
        { session: null },
        'Session expired or invalid',
        HttpStatus.OK,
      );
    }

    return this.response.success(
      { ...session },
      'Session fetched successfully',
      HttpStatus.OK,
    );
  }

  @Post('signout')
  @ApiOperation({ summary: 'Sign out current user' })
  async signOut(@Req() req: Request) {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      return this.response.error(
        'SIGNOUT_FAILED',
        'Missing token',
        HttpStatus.BAD_REQUEST,
      );
    }

    const token = authorization.replace('Bearer ', '');

    const result = await this.authService.signOut(token);

    if (!result) {
      return this.response.error(
        'SIGNOUT_FAILED',
        'Sign out failed',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.response.success(
      { success: true },
      'Signed out successfully',
      HttpStatus.OK,
    );
  }
}
