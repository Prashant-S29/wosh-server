import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq, count, and } from 'drizzle-orm';
import { Database } from '../database/db';
import { projects } from '../database/schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ErrorService } from 'src/common/errors/error.service';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(
    private readonly errorService: ErrorService,
    @Inject('DATABASE') private readonly database: Database,
  ) {}

  async create({ dto }: { dto: CreateProjectDto }) {
    try {
      const [project] = await this.database
        .insert(projects)
        .values(dto)
        .returning({ id: projects.id });

      this.logger.log(`Project created with ID: ${project.id}`);

      return {
        data: project,
        error: null,
        message: 'Project created successfully',
      };
    } catch (error) {
      this.logger.error('Error creating project:', error);
      const errorDef = this.errorService.getErrorByCode('INTERNAL_ERROR');
      return {
        data: null,
        error: errorDef,
        message: 'Something went wrong while creating project',
      };
    }
  }

  async findAll({
    organizationId,
    page,
    limit,
  }: {
    organizationId: string;
    page: number;
    limit: number;
  }) {
    try {
      if (page < 1) page = 1;
      if (limit < 1) limit = 10;
      if (limit > 100) limit = 100;

      const offset = (page - 1) * limit;

      // Fetch paginated data - only filter by organizationId since ownership is verified in controller
      const data = await this.database
        .select({
          id: projects.id,
          name: projects.name,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
          organizationId: projects.organizationId,
        })
        .from(projects)
        .where(eq(projects.organizationId, organizationId))
        .limit(limit)
        .offset(offset)
        .orderBy(projects.createdAt);

      // Get total count for pagination
      const result = await this.database
        .select({ count: count() })
        .from(projects)
        .where(eq(projects.organizationId, organizationId));

      const total = result[0].count;

      return {
        data: {
          allProjects: data,
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1,
          },
        },
        error: null,
        message: 'Projects retrieved successfully',
      };
    } catch (error) {
      this.logger.error('Error retrieving projects:', error);
      const errorDef = this.errorService.getErrorByCode('INTERNAL_ERROR');
      return {
        data: null,
        error: errorDef,
        message: 'Something went wrong while retrieving projects',
      };
    }
  }

  async findOne({
    id,
    organizationId,
  }: {
    id: string;
    organizationId: string;
  }) {
    try {
      const [project] = await this.database
        .select()
        .from(projects)
        .where(
          and(eq(projects.id, id), eq(projects.organizationId, organizationId)),
        );

      if (!project) {
        return {
          data: null,
          error: this.errorService.getErrorByCode('PROJECT_NOT_FOUND'),
          message: 'Project not found',
        };
      }

      return {
        data: project,
        error: null,
        message: 'Project found successfully',
      };
    } catch (error) {
      this.logger.error(`Error finding project with id ${id}:`, error);
      const errorDef = this.errorService.getErrorByCode('INTERNAL_ERROR');
      return {
        data: null,
        error: errorDef,
        message: 'Something went wrong while retrieving project',
      };
    }
  }

  async update({
    id,
    organizationId,
    dto,
  }: {
    id: string;
    organizationId: string;
    dto: UpdateProjectDto;
  }) {
    try {
      // Check if project exists and belongs to organization
      const [project] = await this.database
        .select()
        .from(projects)
        .where(
          and(eq(projects.id, id), eq(projects.organizationId, organizationId)),
        );

      if (!project) {
        return {
          data: null,
          error: this.errorService.getErrorByCode('PROJECT_NOT_FOUND'),
          message: 'Project not found',
        };
      }

      // Extract updatable fields from dto
      const updateData = {
        ...dto,
        updatedAt: new Date(),
      };

      const [updatedProject] = await this.database
        .update(projects)
        .set(updateData)
        .where(eq(projects.id, id))
        .returning();

      if (!updatedProject) {
        return {
          data: null,
          error: this.errorService.getErrorByCode('UNKNOWN_ERROR'),
          message: 'Unable to update project',
        };
      }

      this.logger.log(`Project updated with ID: ${id}`);

      return {
        data: updatedProject,
        error: null,
        message: 'Project updated successfully',
      };
    } catch (error) {
      this.logger.error(`Error updating project with ID ${id}:`, error);
      const errorDef = this.errorService.getErrorByCode('INTERNAL_ERROR');
      return {
        data: null,
        error: errorDef,
        message: 'Something went wrong while updating project',
      };
    }
  }

  async remove({ id, organizationId }: { id: string; organizationId: string }) {
    try {
      // First check if project exists and belongs to organization
      const [project] = await this.database
        .select({ id: projects.id })
        .from(projects)
        .where(
          and(eq(projects.id, id), eq(projects.organizationId, organizationId)),
        );

      if (!project) {
        return {
          data: null,
          error: this.errorService.getErrorByCode('PROJECT_NOT_FOUND'),
          message: 'Project not found',
        };
      }

      // Delete the project
      const deletedRows = await this.database
        .delete(projects)
        .where(
          and(eq(projects.id, id), eq(projects.organizationId, organizationId)),
        );

      if (deletedRows.length === 0) {
        return {
          data: null,
          error: this.errorService.getErrorByCode('UNKNOWN_ERROR'),
          message: 'Unable to delete project',
        };
      }

      this.logger.log(`Project deleted with ID: ${id}`);

      return {
        data: { deleted: true, id },
        error: null,
        message: 'Project deleted successfully',
      };
    } catch (error) {
      this.logger.error(`Error deleting project with ID ${id}:`, error);
      const errorDef = this.errorService.getErrorByCode('INTERNAL_ERROR');
      return {
        data: null,
        error: errorDef,
        message: 'Something went wrong while deleting project',
      };
    }
  }

  /**
   * Check if project exists in organization
   */
  async exists({
    id,
    organizationId,
  }: {
    id: string;
    organizationId: string;
  }): Promise<boolean> {
    try {
      const [project] = await this.database
        .select({ id: projects.id })
        .from(projects)
        .where(
          and(eq(projects.id, id), eq(projects.organizationId, organizationId)),
        );

      return !!project;
    } catch (error) {
      this.logger.error(`Error checking project existence ${id}:`, error);
      return false;
    }
  }

  /**
   * Get project count for a specific organization
   */
  async getProjectCount(organizationId: string): Promise<number> {
    try {
      const result = await this.database
        .select({ count: count() })
        .from(projects)
        .where(eq(projects.organizationId, organizationId));

      return result[0].count;
    } catch (error) {
      this.logger.error(
        `Error getting project count for organization ${organizationId}:`,
        error,
      );
      return 0;
    }
  }
}
