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
  Logger,
  HttpStatus,
  Res,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ProjectService } from './project.service';
import { CreateProjectDto, ShareSecretsDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Protected } from 'src/common/decorators';
import { ErrorService } from 'src/common/errors/error.service';
import { AuthService } from 'src/auth/auth.service';
import { OrganizationService } from 'src/organization/organization.service';

@ApiTags('Projects')
@Controller('project')
@Protected()
export class ProjectController {
  private readonly logger = new Logger(ProjectController.name);

  constructor(
    private readonly projectService: ProjectService,
    private readonly errorService: ErrorService,
    private readonly authService: AuthService,
    private readonly organizationService: OrganizationService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new project' })
  async create(
    @Body() createProjectDto: CreateProjectDto,
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

    // Verify user has access to the organization
    const orgAccess = await this.organizationService.hasAccess({
      ownerId: session.data.session.userId,
      organizationId: createProjectDto.organizationId,
    });

    if (!orgAccess) {
      const errorDef = this.errorService.getErrorByCode('ORG_NOT_FOUND');
      return res.status(errorDef?.statusCode || HttpStatus.FORBIDDEN).json({
        data: null,
        error: errorDef || {
          code: 'ORG_NOT_FOUND',
          message: 'Organization not found or access denied',
          statusCode: 403,
        },
        message: 'You do not have access to this organization',
      });
    }

    const result = await this.projectService.create({
      dto: createProjectDto,
    });
    const statusCode = result.error
      ? result.error.statusCode
      : HttpStatus.CREATED;

    return res.status(statusCode).json(result);
  }

  @Get(':organizationId/all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all projects for an organization' })
  async findAll(
    @Param('organizationId', new ParseUUIDPipe({ version: '4' }))
    organizationId: string,
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

    // Verify user has access to the organization
    const orgAccess = await this.organizationService.hasAccess({
      ownerId: session.data.session.userId,
      organizationId,
    });

    if (!orgAccess) {
      const errorDef = this.errorService.getErrorByCode('ORG_NOT_FOUND');
      return res.status(errorDef?.statusCode || HttpStatus.FORBIDDEN).json({
        data: null,
        error: errorDef || {
          code: 'ORG_NOT_FOUND',
          message: 'Organization not found or access denied',
          statusCode: 403,
        },
        message: 'You do not have access to this organization',
      });
    }

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    const result = await this.projectService.findAll({
      organizationId,
      page: pageNumber,
      limit: limitNumber,
    });
    const statusCode = result.error ? result.error.statusCode : HttpStatus.OK;

    return res.status(statusCode).json(result);
  }

  @Get(':organizationId/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get project by ID' })
  async findOne(
    @Param('organizationId', new ParseUUIDPipe({ version: '4' }))
    organizationId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
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

    // Verify user has access to the organization
    const orgAccess = await this.organizationService.hasAccess({
      ownerId: session.data.session.userId,
      organizationId,
    });

    if (!orgAccess) {
      const errorDef = this.errorService.getErrorByCode('ORG_NOT_FOUND');
      return res.status(errorDef?.statusCode || HttpStatus.FORBIDDEN).json({
        data: null,
        error: errorDef || {
          code: 'ORG_NOT_FOUND',
          message: 'Organization not found or access denied',
          statusCode: 403,
        },
        message: 'You do not have access to this organization',
      });
    }

    const result = await this.projectService.findOne({
      id,
      organizationId: organizationId,
    });
    const statusCode = result.error ? result.error.statusCode : HttpStatus.OK;

    return res.status(statusCode).json(result);
  }

  @Get('keys')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get project wrapped keys',
    description: 'Returns project wrapped keys',
  })
  async keys(
    @Query('orgId', new ParseUUIDPipe({ version: '4' })) orgId: string,
    @Query('projectId', new ParseUUIDPipe({ version: '4' })) projectId: string,
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

    // Verify user has access to the organization
    const orgAccess = await this.organizationService.hasAccess({
      ownerId: session.data.session.userId,
      organizationId: orgId,
    });

    if (!orgAccess) {
      const errorDef = this.errorService.getErrorByCode('ORG_NOT_FOUND');
      return res.status(errorDef?.statusCode || HttpStatus.FORBIDDEN).json({
        data: null,
        error: errorDef || {
          code: 'ORG_NOT_FOUND',
          message: 'Organization not found or access denied',
          statusCode: 403,
        },
        message: 'You do not have access to this organization',
      });
    }

    const result = await this.projectService.keys({
      projectId,
    });

    const statusCode = result.error ? result.error.statusCode : HttpStatus.OK;
    return res.status(statusCode).json(result);
  }

  @Post(':organizationId/:id/share')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Share project secrets' })
  async shareProjectSecrets(
    @Param('organizationId', new ParseUUIDPipe({ version: '4' }))
    organizationId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() shareSecretsDto: ShareSecretsDto,
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

    // Verify user has access to the organization
    const orgAccess = await this.organizationService.hasAccess({
      ownerId: session.data.session.userId,
      organizationId,
    });

    if (!orgAccess) {
      const errorDef = this.errorService.getErrorByCode('ORG_NOT_FOUND');
      return res.status(errorDef?.statusCode || HttpStatus.FORBIDDEN).json({
        data: null,
        error: errorDef || {
          code: 'ORG_NOT_FOUND',
          message: 'Organization not found or access denied',
          statusCode: 403,
        },
        message: 'You do not have access to this organization',
      });
    }

    const result = await this.projectService.shareSecrets({
      projectId: id,
      ...shareSecretsDto,
    });

    const statusCode = result.error ? result.error.statusCode : HttpStatus.OK;

    return res.status(statusCode).json(result);
  }

  @Post(':organizationId/:id/disable-secret-sharing')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable secret sharing for project' })
  async disableSecretSharing(
    @Param('organizationId', new ParseUUIDPipe({ version: '4' }))
    organizationId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() shareSecretsDto: ShareSecretsDto,
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

    // Verify user has access to the organization
    const orgAccess = await this.organizationService.hasAccess({
      ownerId: session.data.session.userId,
      organizationId,
    });

    if (!orgAccess) {
      const errorDef = this.errorService.getErrorByCode('ORG_NOT_FOUND');
      return res.status(errorDef?.statusCode || HttpStatus.FORBIDDEN).json({
        data: null,
        error: errorDef || {
          code: 'ORG_NOT_FOUND',
          message: 'Organization not found or access denied',
          statusCode: 403,
        },
        message: 'You do not have access to this organization',
      });
    }

    const result = await this.projectService.disableSecretSharing({
      projectId: id,
      ...shareSecretsDto,
    });

    const statusCode = result.error ? result.error.statusCode : HttpStatus.OK;

    return res.status(statusCode).json(result);
  }

  @Get(':organizationId/:id/secret-sharing-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get secret sharing code' })
  async getSecretSharingCode(
    @Param('organizationId', new ParseUUIDPipe({ version: '4' }))
    organizationId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
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

    // Verify user has access to the organization
    const orgAccess = await this.organizationService.hasAccess({
      ownerId: session.data.session.userId,
      organizationId,
    });

    if (!orgAccess) {
      const errorDef = this.errorService.getErrorByCode('ORG_NOT_FOUND');
      return res.status(errorDef?.statusCode || HttpStatus.FORBIDDEN).json({
        data: null,
        error: errorDef || {
          code: 'ORG_NOT_FOUND',
          message: 'Organization not found or access denied',
          statusCode: 403,
        },
        message: 'You do not have access to this organization',
      });
    }

    const result = await this.projectService.getSecretSharingCode({
      projectId: id,
    });

    const statusCode = result.error ? result.error.statusCode : HttpStatus.OK;

    return res.status(statusCode).json(result);
  }

  @Patch(':organizationId/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update project' })
  async update(
    @Param('organizationId', new ParseUUIDPipe({ version: '4' }))
    organizationId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateProjectDto: UpdateProjectDto,
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

    // Verify user has access to the organization
    const orgAccess = await this.organizationService.hasAccess({
      ownerId: session.data.session.userId,
      organizationId,
    });

    if (!orgAccess) {
      const errorDef = this.errorService.getErrorByCode('ORG_NOT_FOUND');
      return res.status(errorDef?.statusCode || HttpStatus.FORBIDDEN).json({
        data: null,
        error: errorDef || {
          code: 'ORG_NOT_FOUND',
          message: 'Organization not found or access denied',
          statusCode: 403,
        },
        message: 'You do not have access to this organization',
      });
    }

    const result = await this.projectService.update({
      id,
      organizationId,
      dto: updateProjectDto,
    });
    const statusCode = result.error ? result.error.statusCode : HttpStatus.OK;

    return res.status(statusCode).json(result);
  }

  @Delete(':organizationId/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete project' })
  async remove(
    @Param('organizationId', new ParseUUIDPipe({ version: '4' }))
    organizationId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
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

    // Verify user has access to the organization
    const orgAccess = await this.organizationService.hasAccess({
      ownerId: session.data.session.userId,
      organizationId,
    });

    if (!orgAccess) {
      const errorDef = this.errorService.getErrorByCode('ORG_NOT_FOUND');
      return res.status(errorDef?.statusCode || HttpStatus.FORBIDDEN).json({
        data: null,
        error: errorDef || {
          code: 'ORG_NOT_FOUND',
          message: 'Organization not found or access denied',
          statusCode: 403,
        },
        message: 'You do not have access to this organization',
      });
    }

    const result = await this.projectService.remove({
      id,
      organizationId,
    });

    return res.status(result.error?.statusCode || HttpStatus.OK).json(result);
  }
}
