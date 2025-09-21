import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  HttpStatus,
  Logger,
  HttpCode,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { SignInDto, SignUpDto } from './dto/auth.dto';
import { ErrorService } from 'src/common/errors/error.service';
import { Protected } from 'src/common/decorators';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly errorService: ErrorService,
  ) {}

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with email and password' })
  async signIn(@Body() signInDto: SignInDto, @Res() res: Response) {
    const result = await this.authService.signIn(signInDto);
    const statusCode = result.error ? result.error.statusCode : HttpStatus.OK;

    return res.status(statusCode).json(result);
  }

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Sign up with email and password' })
  async signUp(@Body() signUpDto: SignUpDto, @Res() res: Response) {
    const result = await this.authService.signUp(signUpDto);
    const statusCode = result.error
      ? result.error.statusCode
      : HttpStatus.CREATED;

    return res.status(statusCode).json(result);
  }

  @Get('session')
  @HttpCode(HttpStatus.OK)
  @Protected()
  @ApiOperation({ summary: 'Get current session' })
  async getSession(@Req() req: Request, @Res() res: Response) {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(HttpStatus.OK).json({
        data: { session: null },
        error: null,
        message: 'No session found',
      });
    }

    const token = this.extractTokenFromHeader(authorization);

    if (!token) {
      const errorDef = this.errorService.getErrorByCode('TOKEN_MISSING');
      return res.status(errorDef?.statusCode || HttpStatus.BAD_REQUEST).json({
        data: null,
        error: errorDef || {
          code: 'TOKEN_MISSING',
          message: 'Authentication token is required',
          statusCode: 400,
        },
        message: 'Invalid token format',
      });
    }

    const result = await this.authService.getSession(token);
    const statusCode = result.error ? result.error.statusCode : HttpStatus.OK;

    return res.status(statusCode).json(result);
  }

  @Post('signout')
  @HttpCode(HttpStatus.OK)
  @Protected()
  @ApiOperation({ summary: 'Sign out current user' })
  async signOut(@Req() req: Request, @Res() res: Response) {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      const errorDef = this.errorService.getErrorByCode('TOKEN_MISSING');
      return res.status(errorDef?.statusCode || HttpStatus.BAD_REQUEST).json({
        data: null,
        error: errorDef || {
          code: 'TOKEN_MISSING',
          message: 'Authentication token is required',
          statusCode: 400,
        },
        message: 'Authorization token is required',
      });
    }

    const token = this.extractTokenFromHeader(authorization);

    if (!token) {
      const errorDef = this.errorService.getErrorByCode('TOKEN_MISSING');
      return res.status(errorDef?.statusCode || HttpStatus.BAD_REQUEST).json({
        data: null,
        error: errorDef || {
          code: 'TOKEN_MISSING',
          message: 'Authentication token is required',
          statusCode: 400,
        },
        message: 'Invalid token format',
      });
    }

    const result = await this.authService.signOut(token);
    const statusCode = result.error ? result.error.statusCode : HttpStatus.OK;

    return res.status(statusCode).json(result);
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
}
