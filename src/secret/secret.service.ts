import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq, count, and, ilike } from 'drizzle-orm';
import { Database } from '../database/db';
import { secrets } from '../database/schema';
import { CreateSecretDto } from './dto/create-secret.dto';
import { UpdateSecretDto } from './dto/update-secret.dto';
import { ErrorService } from 'src/common/errors/error.service';

@Injectable()
export class SecretService {
  private readonly logger = new Logger(SecretService.name);

  constructor(
    private readonly errorService: ErrorService,
    @Inject('DATABASE') private readonly database: Database,
  ) {}

  async create({
    dto,
    projectId,
  }: {
    dto: CreateSecretDto;
    projectId: string;
  }) {
    try {
      const [secret] = await this.database
        .insert(secrets)
        .values({
          ...dto,
          projectId,
        })
        .returning({ id: secrets.id });

      this.logger.log(`Secret created with ID: ${secret.id}`);

      return {
        data: secret,
        error: null,
        message: 'Secret created successfully',
      };
    } catch (error) {
      this.logger.error('Error creating secret:', error);
      const errorDef = this.errorService.getErrorByCode('INTERNAL_ERROR');
      return {
        data: null,
        error: errorDef,
        message: 'Something went wrong while creating secret',
      };
    }
  }

  async createMany({
    dtos,
    projectId,
  }: {
    dtos: CreateSecretDto[];
    projectId: string;
  }) {
    try {
      const secretsToInsert = dtos.map((dto) => ({
        ...dto,
        projectId,
      }));

      const createdSecrets = await this.database
        .insert(secrets)
        .values(secretsToInsert)
        .returning({ id: secrets.id });

      this.logger.log(`${createdSecrets.length} secrets created`);

      return {
        data: createdSecrets,
        error: null,
        message: `${createdSecrets.length} secrets created successfully`,
      };
    } catch (error) {
      this.logger.error('Error creating secrets:', error);
      const errorDef = this.errorService.getErrorByCode('INTERNAL_ERROR');
      return {
        data: null,
        error: errorDef,
        message: 'Something went wrong while creating secrets',
      };
    }
  }

  async findAll({
    projectId,
    page,
    limit,
    search,
  }: {
    projectId: string;
    page: number;
    limit: number;
    search?: string;
  }) {
    try {
      if (page < 1) page = 1;
      if (limit < 1) limit = 10;
      if (limit > 100) limit = 100;

      const offset = (page - 1) * limit;

      const baseCondition = eq(secrets.projectId, projectId);
      const whereConditions = search
        ? and(baseCondition, ilike(secrets.keyName, `%${search}%`))!
        : baseCondition;

      const data = await this.database
        .select({
          id: secrets.id,
          keyName: secrets.keyName,
          note: secrets.note,
          ciphertext: secrets.ciphertext,
          nonce: secrets.nonce,
          metadata: secrets.metadata,
          createdAt: secrets.createdAt,
          updatedAt: secrets.updatedAt,
        })
        .from(secrets)
        .where(whereConditions)
        .limit(limit)
        .offset(offset)
        .orderBy(secrets.createdAt);

      const result = await this.database
        .select({ count: count() })
        .from(secrets)
        .where(whereConditions);

      const total = result[0].count;

      return {
        data: {
          allSecrets: data,
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
        message: 'Secrets retrieved successfully',
      };
    } catch (error) {
      this.logger.error('Error retrieving secrets:', error);
      const errorDef = this.errorService.getErrorByCode('INTERNAL_ERROR');
      return {
        data: null,
        error: errorDef,
        message: 'Something went wrong while retrieving secrets',
      };
    }
  }
  async findOne({ id, projectId }: { id: string; projectId: string }) {
    try {
      const [secret] = await this.database
        .select()
        .from(secrets)
        .where(and(eq(secrets.id, id), eq(secrets.projectId, projectId)));

      if (!secret) {
        return {
          data: null,
          error: this.errorService.getErrorByCode('SECRET_NOT_FOUND'),
          message: 'Secret not found',
        };
      }

      return {
        data: secret,
        error: null,
        message: 'Secret found successfully',
      };
    } catch (error) {
      this.logger.error(`Error finding secret with id ${id}:`, error);
      const errorDef = this.errorService.getErrorByCode('INTERNAL_ERROR');
      return {
        data: null,
        error: errorDef,
        message: 'Something went wrong while retrieving secret',
      };
    }
  }

  async update({
    id,
    projectId,
    dto,
  }: {
    id: string;
    projectId: string;
    dto: UpdateSecretDto;
  }) {
    try {
      const [secret] = await this.database
        .select()
        .from(secrets)
        .where(and(eq(secrets.id, id), eq(secrets.projectId, projectId)));

      if (!secret) {
        return {
          data: null,
          error: this.errorService.getErrorByCode('SECRET_NOT_FOUND'),
          message: 'Secret not found',
        };
      }

      const updateData = {
        ...dto,
        updatedAt: new Date(),
      };

      const [updatedSecret] = await this.database
        .update(secrets)
        .set(updateData)
        .where(eq(secrets.id, id))
        .returning();

      if (!updatedSecret) {
        return {
          data: null,
          error: this.errorService.getErrorByCode('UNKNOWN_ERROR'),
          message: 'Unable to update secret',
        };
      }

      this.logger.log(`Secret updated with ID: ${id}`);

      return {
        data: updatedSecret,
        error: null,
        message: 'Secret updated successfully',
      };
    } catch (error) {
      this.logger.error(`Error updating secret with ID ${id}:`, error);
      const errorDef = this.errorService.getErrorByCode('INTERNAL_ERROR');
      return {
        data: null,
        error: errorDef,
        message: 'Something went wrong while updating secret',
      };
    }
  }

  async remove({ id, projectId }: { id: string; projectId: string }) {
    try {
      const [secret] = await this.database
        .select({ id: secrets.id })
        .from(secrets)
        .where(and(eq(secrets.id, id), eq(secrets.projectId, projectId)));

      if (!secret) {
        return {
          data: null,
          error: this.errorService.getErrorByCode('SECRET_NOT_FOUND'),
          message: 'Secret not found',
        };
      }

      const deletedRows = await this.database
        .delete(secrets)
        .where(and(eq(secrets.id, id), eq(secrets.projectId, projectId)));

      if (deletedRows.length === 0) {
        return {
          data: null,
          error: this.errorService.getErrorByCode('UNKNOWN_ERROR'),
          message: 'Unable to delete secret',
        };
      }

      this.logger.log(`Secret deleted with ID: ${id}`);

      return {
        data: { deleted: true, id },
        error: null,
        message: 'Secret deleted successfully',
      };
    } catch (error) {
      this.logger.error(`Error deleting secret with ID ${id}:`, error);
      const errorDef = this.errorService.getErrorByCode('INTERNAL_ERROR');
      return {
        data: null,
        error: errorDef,
        message: 'Something went wrong while deleting secret',
      };
    }
  }

  async exists({
    id,
    projectId,
  }: {
    id: string;
    projectId: string;
  }): Promise<boolean> {
    try {
      const [secret] = await this.database
        .select({ id: secrets.id })
        .from(secrets)
        .where(and(eq(secrets.id, id), eq(secrets.projectId, projectId)));

      return !!secret;
    } catch (error) {
      this.logger.error(`Error checking secret existence ${id}:`, error);
      return false;
    }
  }

  async getSecretCount(projectId: string): Promise<number> {
    try {
      const result = await this.database
        .select({ count: count() })
        .from(secrets)
        .where(eq(secrets.projectId, projectId));

      return result[0].count;
    } catch (error) {
      this.logger.error(
        `Error getting secret count for project ${projectId}:`,
        error,
      );
      return 0;
    }
  }
}
