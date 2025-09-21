import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq, count, and } from 'drizzle-orm';
import { Database } from '../database/db';
import { organizations } from '../database/schema';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { ErrorService } from 'src/common/errors/error.service';
import { Protected } from 'src/common/decorators';

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);

  constructor(
    private readonly errorService: ErrorService,
    @Inject('DATABASE') private readonly database: Database,
  ) {}

  async create({ dto }: { dto: CreateOrganizationDto }) {
    try {
      const [org] = await this.database
        .insert(organizations)
        .values(dto)
        .returning({ id: organizations.id });

      this.logger.log(`Organization created with ID: ${org.id}`);

      return {
        data: org,
        error: null,
        message: 'Organization created successfully',
      };
    } catch (error) {
      this.logger.error('Error creating organization:', error);
      const errorDef = this.errorService.getErrorByCode('INTERNAL_ERROR');
      return {
        data: null,
        error: errorDef,
        message: 'Something went wrong while creating organization',
      };
    }
  }

  async findAll({
    ownerId,
    page,
    limit,
  }: {
    ownerId: string;
    page: number;
    limit: number;
  }) {
    try {
      if (page < 1) page = 1;
      if (limit < 1) limit = 10;
      if (limit > 100) limit = 100;

      const offset = (page - 1) * limit;

      // Fetch paginated data
      const data = await this.database
        .select({
          id: organizations.id,
          name: organizations.name,
          createdAt: organizations.createdAt,
          updatedAt: organizations.updatedAt,
        })
        .from(organizations)
        .where(eq(organizations.ownerId, ownerId))
        .limit(limit)
        .offset(offset)
        .orderBy(organizations.createdAt);

      // Get total count for pagination
      const result = await this.database
        .select({ count: count() })
        .from(organizations)
        .where(eq(organizations.ownerId, ownerId));

      const total = result[0].count;

      return {
        data: {
          allOrgs: data,
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
        message: 'Organizations retrieved successfully',
      };
    } catch (error) {
      this.logger.error('Error retrieving organizations:', error);
      const errorDef = this.errorService.getErrorByCode('INTERNAL_ERROR');
      return {
        data: null,
        error: errorDef,
        message: 'Something went wrong while retrieving organizations',
      };
    }
  }

  async findOne({ id, ownerId }: { id: string; ownerId: string }) {
    try {
      const [org] = await this.database
        .select()
        .from(organizations)
        .where(
          and(eq(organizations.id, id), eq(organizations.ownerId, ownerId)),
        );

      if (!org) {
        return {
          data: null,
          error: this.errorService.getErrorByCode('ORG_NOT_FOUND'),
          message: 'Organization not found',
        };
      }

      return {
        data: org,
        error: null,
        message: 'Organization found successfully',
      };
    } catch (error) {
      this.logger.error(`Error finding organization with id ${id}:`, error);
      const errorDef = this.errorService.getErrorByCode('INTERNAL_ERROR');
      return {
        data: null,
        error: errorDef,
        message: 'Something went wrong while retrieving organization',
      };
    }
  }

  async update({
    id,
    ownerId,
    dto,
  }: {
    id: string;
    ownerId: string;
    dto: UpdateOrganizationDto;
  }) {
    try {
      // Check if organization exists and belongs to owner
      const [org] = await this.database
        .select()
        .from(organizations)
        .where(
          and(eq(organizations.id, id), eq(organizations.ownerId, ownerId)),
        );

      if (!org) {
        return {
          data: null,
          error: this.errorService.getErrorByCode('ORG_NOT_FOUND'),
          message: 'Organization not found',
        };
      }

      const { name } = dto;

      const [updatedOrg] = await this.database
        .update(organizations)
        .set({ name })
        .where(eq(organizations.id, id))
        .returning();

      if (!updatedOrg) {
        return {
          data: null,
          error: this.errorService.getErrorByCode('UNKNOWN_ERROR'),
          message: 'Unable to update organization',
        };
      }

      this.logger.log(`Organization updated with ID: ${id}`);

      return {
        data: updatedOrg,
        error: null,
        message: 'Organization updated successfully',
      };
    } catch (error) {
      this.logger.error(`Error updating organization with ID ${id}:`, error);
      const errorDef = this.errorService.getErrorByCode('INTERNAL_ERROR');
      return {
        data: null,
        error: errorDef,
        message: 'Something went wrong while updating organization',
      };
    }
  }

  async remove({ id, ownerId }: { id: string; ownerId: string }) {
    try {
      // First check if organization exists and belongs to owner
      const [org] = await this.database
        .select({ id: organizations.id })
        .from(organizations)
        .where(
          and(eq(organizations.id, id), eq(organizations.ownerId, ownerId)),
        );

      if (!org) {
        return {
          data: null,
          error: this.errorService.getErrorByCode('ORG_NOT_FOUND'),
          message: 'Organization not found',
        };
      }

      // Delete the organization
      const deletedRows = await this.database
        .delete(organizations)
        .where(
          and(eq(organizations.id, id), eq(organizations.ownerId, ownerId)),
        );

      if (deletedRows.length === 0) {
        return {
          data: null,
          error: this.errorService.getErrorByCode('UNKNOWN_ERROR'),
          message: 'Unable to delete organization',
        };
      }

      this.logger.log(`Organization deleted with ID: ${id}`);

      return {
        data: { deleted: true, id },
        error: null,
        message: 'Organization deleted successfully',
      };
    } catch (error) {
      this.logger.error(`Error deleting organization with ID ${id}:`, error);
      const errorDef = this.errorService.getErrorByCode('INTERNAL_ERROR');
      return {
        data: null,
        error: errorDef,
        message: 'Something went wrong while deleting organization',
      };
    }
  }

  @Protected()
  async keys({ orgId, ownerId }: { ownerId: string; orgId: string }) {
    try {
      const [orgKeys] = await this.database
        .select({
          privateKeyEncrypted: organizations.privateKeyEncrypted,
          keyDerivationSalt: organizations.keyDerivationSalt,
          encryptionIv: organizations.encryptionIv,
          publicKey: organizations.publicKey,
        })
        .from(organizations)
        .where(
          and(eq(organizations.ownerId, ownerId), eq(organizations.id, orgId)),
        );

      if (!orgKeys) {
        return {
          data: null,
          error: this.errorService.getErrorByCode('ORG_NOT_FOUND'),
          message:
            'Organization not found or you do not have access to its keys',
        };
      }

      return {
        data: orgKeys,
        error: null,
        message: 'Organization keys retrieved successfully',
      };
    } catch (error) {
      this.logger.error(
        `Error retrieving keys for organization ${orgId}:`,
        error,
      );
      const errorDef = this.errorService.getErrorByCode('INTERNAL_ERROR');
      return {
        data: null,
        error: errorDef,
        message: 'Something went wrong while retrieving organization keys',
      };
    }
  }

  async hasAccess({
    organizationId,
    ownerId,
  }: {
    ownerId: string;
    organizationId: string;
  }) {
    try {
      const [org] = await this.database
        .select({ id: organizations.id })
        .from(organizations)
        .where(
          and(
            eq(organizations.ownerId, ownerId),
            eq(organizations.id, organizationId),
          ),
        );

      return !!org;
    } catch (error) {
      this.logger.error(
        `Error checking access for organization ${organizationId}:`,
        error,
      );
      return false;
    }
  }
}
