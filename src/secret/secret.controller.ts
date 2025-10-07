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
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { SecretService } from './secret.service';
import { CreateSecretDto, CreateManySecretsDto } from './dto/create-secret.dto';
import { UpdateSecretDto } from './dto/update-secret.dto';
import { Protected } from 'src/common/decorators';
import { ErrorService } from 'src/common/errors/error.service';
import { AuthService } from 'src/auth/auth.service';
import { OrganizationService } from 'src/organization/organization.service';
import { ProjectService } from 'src/project/project.service';

@ApiTags('Secrets')
@Controller('secret')
@Protected()
export class SecretController {
  private readonly logger = new Logger(SecretController.name);

  constructor(
    private readonly secretService: SecretService,
    private readonly errorService: ErrorService,
    private readonly authService: AuthService,
    private readonly organizationService: OrganizationService,
    private readonly projectService: ProjectService,
  ) {}

  /**
   * Validates project ID, authenticates user, and verifies organization access
   * @returns Object with validation result and user ID if successful, or null if failed (response already sent)
   */
  private async validateAccessAndAuth(
    projectId: string,
    authCookie: string | undefined,
    res: Response,
  ): Promise<{ userId: string; projectData: any } | null> {
    // Validate project ID
    if (!projectId) {
      const errorDef = this.errorService.getErrorByCode('VALIDATION_ERROR');
      res.status(errorDef?.statusCode || HttpStatus.BAD_REQUEST).json({
        data: null,
        error: errorDef || {
          code: 'VALIDATION_ERROR',
          message: 'Project ID is required',
          statusCode: 400,
        },
        message: 'Project ID is required',
      });
      return null;
    }

    // Validate session
    const session = await this.authService.getSessionFromAuthCookie(authCookie);
    if (!session.data) {
      res.status(session.error?.statusCode || HttpStatus.UNAUTHORIZED).json({
        data: null,
        error: session.error,
        message: 'Session not found or expired',
      });
      return null;
    }

    // Get project to verify organization access
    const projectResult = await this.projectService.findOneById({
      id: projectId,
    });

    if (!projectResult.data) {
      const errorDef = this.errorService.getErrorByCode('PROJECT_NOT_FOUND');
      res.status(errorDef?.statusCode || HttpStatus.NOT_FOUND).json({
        data: null,
        error: errorDef || {
          code: 'PROJECT_NOT_FOUND',
          message: 'Project not found',
          statusCode: 404,
        },
        message: 'Project not found',
      });
      return null;
    }

    // Verify user has access to the organization
    const orgAccess = await this.organizationService.hasAccess({
      ownerId: session.data.session.userId,
      organizationId: projectResult.data.organizationId,
    });

    if (!orgAccess) {
      const errorDef = this.errorService.getErrorByCode('ORG_NOT_FOUND');
      res.status(errorDef?.statusCode || HttpStatus.FORBIDDEN).json({
        data: null,
        error: errorDef || {
          code: 'ORG_NOT_FOUND',
          message: 'Organization not found or access denied',
          statusCode: 403,
        },
        message: 'You do not have access to this organization',
      });
      return null;
    }

    return {
      userId: session.data.session.userId,
      projectData: projectResult.data,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a single secret' })
  async create(
    @Query('projectId') projectId: string,
    @Body() createSecretDto: CreateSecretDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const authCookie = req.headers.authorization;
    const validation = await this.validateAccessAndAuth(
      projectId,
      authCookie,
      res,
    );
    if (!validation) return;

    const result = await this.secretService.create({
      dto: createSecretDto,
      projectId,
    });

    const statusCode = result.error
      ? result.error.statusCode
      : HttpStatus.CREATED;

    return res.status(statusCode).json(result);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create multiple secrets' })
  async createBulk(
    @Query('projectId') projectId: string,
    @Body() createManySecretsDto: CreateManySecretsDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const authCookie = req.headers.authorization;
    const validation = await this.validateAccessAndAuth(
      projectId,
      authCookie,
      res,
    );
    if (!validation) return;

    console.log(createManySecretsDto);

    const result = await this.secretService.createMany({
      dtos: createManySecretsDto.secrets,
      projectId,
    });

    const statusCode = result.error
      ? result.error.statusCode
      : HttpStatus.CREATED;

    return res.status(statusCode).json(result);
  }
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all secrets for a project' })
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Query('projectId') projectId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search?: string,
  ) {
    const authCookie = req.headers.authorization;
    const validation = await this.validateAccessAndAuth(
      projectId,
      authCookie,
      res,
    );
    if (!validation) return;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    const result = await this.secretService.findAll({
      projectId,
      page: pageNumber,
      limit: limitNumber,
      search,
    });

    const statusCode = result.error ? result.error.statusCode : HttpStatus.OK;
    return res.status(statusCode).json(result);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get secret by ID' })
  async findOne(
    @Query('projectId') projectId: string,
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const authCookie = req.headers.authorization;
    const validation = await this.validateAccessAndAuth(
      projectId,
      authCookie,
      res,
    );
    if (!validation) return;

    const result = await this.secretService.findOne({
      id,
      projectId,
    });
    const statusCode = result.error ? result.error.statusCode : HttpStatus.OK;

    return res.status(statusCode).json(result);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a secret' })
  async update(
    @Query('projectId') projectId: string,
    @Param('id') id: string,
    @Body() updateSecretDto: UpdateSecretDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const authCookie = req.headers.authorization;
    const validation = await this.validateAccessAndAuth(
      projectId,
      authCookie,
      res,
    );
    if (!validation) return;

    const result = await this.secretService.update({
      id,
      projectId,
      dto: updateSecretDto,
    });

    const statusCode = result.error ? result.error.statusCode : HttpStatus.OK;

    return res.status(statusCode).json(result);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a secret' })
  async remove(
    @Query('projectId') projectId: string,
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const authCookie = req.headers.authorization;
    const validation = await this.validateAccessAndAuth(
      projectId,
      authCookie,
      res,
    );
    if (!validation) return;

    const result = await this.secretService.remove({
      id,
      projectId,
    });

    return res.status(result.error?.statusCode || HttpStatus.OK).json(result);
  }
}
