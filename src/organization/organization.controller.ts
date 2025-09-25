import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  HttpStatus,
  Res,
  HttpCode,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Protected } from 'src/common/decorators';
import { ErrorService } from 'src/common/errors/error.service';
import { AuthService } from 'src/auth/auth.service';

@ApiTags('Organizations')
@Controller('organization')
@Protected()
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly errorService: ErrorService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new organization with MKDF support',
    description:
      'Creates an organization with multi-factor key derivation and device registration',
  })
  @ApiResponse({
    status: 201,
    description: 'Organization created successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            mkdfEnabled: { type: 'boolean' },
            deviceRegistrationId: { type: 'string', format: 'uuid' },
          },
        },
        error: { type: 'null' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async create(
    @Body() createOrganizationDto: CreateOrganizationDto,
    @Headers('user-agent') userAgent: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const authCookie = req.headers.authorization;

    const session = await this.authService.getSessionFromAuthCookie(authCookie);
    if (!session.data) {
      return res
        .status(session.error?.statusCode || HttpStatus.UNAUTHORIZED)
        .json({
          data: null,
          error: session.error,
          message: 'Session not found or expired',
        });
    }

    // Verify the owner ID matches the authenticated user
    if (createOrganizationDto.ownerId !== session.data.session.userId) {
      const errorDef = this.errorService.getErrorByCode('FORBIDDEN');
      return res.status(errorDef?.statusCode || HttpStatus.FORBIDDEN).json({
        data: null,
        error: errorDef,
        message: 'Cannot create organization for another user',
      });
    }

    const result = await this.organizationService.create({
      dto: createOrganizationDto,
    });

    const statusCode = result.error
      ? result.error.statusCode
      : HttpStatus.CREATED;

    return res.status(statusCode).json(result);
  }

  @Get(':id/all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all organizations for authenticated user',
    description:
      'Returns paginated list of organizations owned by the user with MKDF status',
  })
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const authCookie = req.headers.authorization;

    const session = await this.authService.getSessionFromAuthCookie(authCookie);
    if (!session.data) {
      return res
        .status(session.error?.statusCode || HttpStatus.UNAUTHORIZED)
        .json({
          data: null,
          error: session.error,
          message: 'Session not found or expired',
        });
    }

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    const result = await this.organizationService.findAll({
      ownerId: session.data.session.userId,
      page: pageNumber,
      limit: limitNumber,
    });
    const statusCode = result.error ? result.error.statusCode : HttpStatus.OK;

    return res.status(statusCode).json(result);
  }

  @Get('keys')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get organization encryption keys',
    description:
      'Returns organization encryption keys for MKDF reconstruction with device verification',
  })
  async keys(
    @Query('orgId') orgId: string,
    @Headers('user-agent') userAgent: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!orgId) {
      const errorDef = this.errorService.getErrorByCode('VALIDATION_ERROR');
      return res.status(errorDef?.statusCode || HttpStatus.BAD_REQUEST).json({
        data: null,
        error: errorDef || {
          code: 'VALIDATION_ERROR',
          message: 'Organization ID is required',
          statusCode: 400,
        },
        message: 'Organization ID is required',
      });
    }

    const authCookie = req.headers.authorization;

    const session = await this.authService.getSessionFromAuthCookie(authCookie);
    if (!session.data) {
      return res
        .status(session.error?.statusCode || HttpStatus.UNAUTHORIZED)
        .json({
          data: null,
          error: session.error,
          message: 'Session not found or expired',
        });
    }

    // Extract client information for device verification
    const clientInfo = {
      userAgent: userAgent || 'Unknown',
      ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
    };

    const result = await this.organizationService.keys({
      orgId,
      ownerId: session.data.session.userId,
      clientInfo,
    });
    const statusCode = result.error ? result.error.statusCode : HttpStatus.OK;

    return res.status(statusCode).json(result);
  }

  @Get(':id/devices')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get registered devices for organization',
    description: 'Returns list of devices registered for this organization',
  })
  async getDevices(
    @Param('id') organizationId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const authCookie = req.headers.authorization;

    const session = await this.authService.getSessionFromAuthCookie(authCookie);
    if (!session.data) {
      return res
        .status(session.error?.statusCode || HttpStatus.UNAUTHORIZED)
        .json({
          data: null,
          error: session.error,
          message: 'Session not found or expired',
        });
    }

    const result = await this.organizationService.getRegisteredDevices({
      organizationId,
      ownerId: session.data.session.userId,
    });

    const statusCode = result.error ? result.error.statusCode : HttpStatus.OK;
    return res.status(statusCode).json(result);
  }

  @Delete(':id/devices/:deviceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revoke device access',
    description: 'Revokes access for a specific device registration',
  })
  async revokeDevice(
    @Param('id') organizationId: string,
    @Param('deviceId') deviceId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const authCookie = req.headers.authorization;

    const session = await this.authService.getSessionFromAuthCookie(authCookie);
    if (!session.data) {
      return res
        .status(session.error?.statusCode || HttpStatus.UNAUTHORIZED)
        .json({
          data: null,
          error: session.error,
          message: 'Session not found or expired',
        });
    }

    const result = await this.organizationService.revokeDeviceAccess({
      organizationId,
      deviceId,
      ownerId: session.data.session.userId,
    });

    const statusCode = result.error ? result.error.statusCode : HttpStatus.OK;
    return res.status(statusCode).json(result);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get organization by ID' })
  async findOne(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const authCookie = req.headers.authorization;

    const session = await this.authService.getSessionFromAuthCookie(authCookie);
    if (!session.data) {
      return res
        .status(session.error?.statusCode || HttpStatus.UNAUTHORIZED)
        .json({
          data: null,
          error: session.error,
          message: 'Session not found or expired',
        });
    }

    const result = await this.organizationService.findOne({
      id,
      ownerId: session.data.session.userId,
    });
    const statusCode = result.error ? result.error.statusCode : HttpStatus.OK;
    return res.status(statusCode).json(result);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update organization' })
  async update(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const authCookie = req.headers.authorization;

    const session = await this.authService.getSessionFromAuthCookie(authCookie);
    if (!session.data) {
      return res
        .status(session.error?.statusCode || HttpStatus.UNAUTHORIZED)
        .json({
          data: null,
          error: session.error,
          message: 'Session not found or expired',
        });
    }

    const result = await this.organizationService.update({
      id,
      ownerId: session.data.session.userId,
      dto: updateOrganizationDto,
    });
    const statusCode = result.error ? result.error.statusCode : HttpStatus.OK;

    return res.status(statusCode).json(result);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete organization' })
  async remove(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const authCookie = req.headers.authorization;

    const session = await this.authService.getSessionFromAuthCookie(authCookie);
    if (!session.data) {
      return res
        .status(session.error?.statusCode || HttpStatus.UNAUTHORIZED)
        .json({
          data: null,
          error: session.error,
          message: 'Session not found or expired',
        });
    }

    const result = await this.organizationService.remove({
      id,
      ownerId: session.data.session.userId,
    });

    return res.status(result.error?.statusCode || HttpStatus.OK).json(result);
  }
}
