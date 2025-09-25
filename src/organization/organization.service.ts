// organization.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq, count, and, desc } from 'drizzle-orm';
import { Database } from '../database/db';
import {
  organizations,
  deviceRegistrations,
  recoveryBackups,
} from '../database/schema';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { ErrorService } from 'src/common/errors/error.service';

interface ClientInfo {
  userAgent: string;
  ipAddress: string;
}

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);

  constructor(
    private readonly errorService: ErrorService,
    @Inject('DATABASE') private readonly database: Database,
  ) {}

  // Create organization with MKDF (always enabled)
  async create({ dto }: { dto: CreateOrganizationDto }) {
    // Start a database transaction
    return this.database.transaction(async (tx) => {
      try {
        const { deviceInfo, mkdfConfig, ...orgInfo } = dto;

        // 1. Create the organization
        const [org] = await tx
          .insert(organizations)
          .values({
            ...orgInfo,
            ...mkdfConfig,
          })
          .returning({
            id: organizations.id,
            name: organizations.name,
          });

        this.logger.log(`Organization created with ID: ${org.id}`);

        // 2. Register the device
        const [deviceReg] = await tx
          .insert(deviceRegistrations)
          .values({
            ...deviceInfo,
            organizationId: org.id,
            userId: dto.ownerId,
            publicKey: dto.publicKey,
            isActive: true,
          })
          .returning({ id: deviceRegistrations.id });

        this.logger.log(
          `Device registered with ID: ${deviceReg.id} for org ${org.id}`,
        );

        // 3. Create initial recovery backup placeholder
        await tx.insert(recoveryBackups).values({
          organizationId: org.id,
          userId: dto.ownerId,
          backupType: 'recovery_code',
          encryptedBackup: 'pending', // Will be updated when user generates codes
          backupMetadata: {
            description: 'Initial recovery codes - pending generation',
            usageLimit: 10,
            usageCount: 0,
          },
          isUsed: false,
        });

        return {
          data: {
            id: org.id,
            name: org.name,
            deviceRegistrationId: deviceReg.id,
          },
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
    });
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
          requiredFactors: organizations.requiredFactors,
          createdAt: organizations.createdAt,
          updatedAt: organizations.updatedAt,
        })
        .from(organizations)
        .where(eq(organizations.ownerId, ownerId))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(organizations.createdAt));

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
        .select({
          id: organizations.id,
          name: organizations.name,
          ownerId: organizations.ownerId,
          publicKey: organizations.publicKey,
          requiredFactors: organizations.requiredFactors,
          factorConfig: organizations.factorConfig,
          recoveryThreshold: organizations.recoveryThreshold,
          createdAt: organizations.createdAt,
          updatedAt: organizations.updatedAt,
        })
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
    return this.database.transaction(async (tx) => {
      try {
        // First check if organization exists and belongs to owner
        const [org] = await tx
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

        // Delete related records (cascade should handle this, but being explicit)
        await tx
          .delete(deviceRegistrations)
          .where(eq(deviceRegistrations.organizationId, id));

        await tx
          .delete(recoveryBackups)
          .where(eq(recoveryBackups.organizationId, id));

        // Delete the organization
        const deletedRows = await tx
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
    });
  }

  async keys({
    orgId,
    ownerId,
    clientInfo,
  }: {
    ownerId: string;
    orgId: string;
    clientInfo: ClientInfo | null;
  }) {
    try {
      this.logger.log('client info', clientInfo);

      // Get organization data
      const [org] = await this.database
        .select({
          privateKeyEncrypted: organizations.privateKeyEncrypted,
          keyDerivationSalt: organizations.keyDerivationSalt,
          encryptionIv: organizations.encryptionIv,
          publicKey: organizations.publicKey,
          requiredFactors: organizations.requiredFactors,
          factorConfig: organizations.factorConfig,
          mkdfVersion: organizations.mkdfVersion,
        })
        .from(organizations)
        .where(
          and(eq(organizations.ownerId, ownerId), eq(organizations.id, orgId)),
        );

      if (!org) {
        return {
          data: null,
          error: this.errorService.getErrorByCode('ORG_NOT_FOUND'),
          message:
            'Organization not found or you do not have access to its keys',
        };
      }

      // Get device registration info
      const [device] = await this.database
        .select({
          id: deviceRegistrations.id,
          deviceName: deviceRegistrations.deviceName,
          encryptedDeviceKey: deviceRegistrations.encryptedDeviceKey,
          keyDerivationSalt: deviceRegistrations.keyDerivationSalt,
          encryptionIv: deviceRegistrations.encryptionIv,
          combinationSalt: deviceRegistrations.combinationSalt,
          pinSalt: deviceRegistrations.pinSalt,
          deviceFingerprint: deviceRegistrations.deviceFingerprint,
          isActive: deviceRegistrations.isActive,
        })
        .from(deviceRegistrations)
        .where(
          and(
            eq(deviceRegistrations.organizationId, orgId),
            eq(deviceRegistrations.userId, ownerId),
            eq(deviceRegistrations.isActive, true),
          ),
        )
        .limit(1);

      if (device) {
        // Update last used timestamp
        await this.database
          .update(deviceRegistrations)
          .set({ lastUsed: new Date() })
          .where(eq(deviceRegistrations.id, device.id));
      }

      return {
        data: {
          ...org,
          deviceInfo: device,
        },
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

  async getRegisteredDevices({
    organizationId,
    ownerId,
  }: {
    organizationId: string;
    ownerId: string;
  }) {
    try {
      // First verify user has access to this organization
      const hasAccess = await this.hasAccess({ organizationId, ownerId });
      if (!hasAccess) {
        return {
          data: null,
          error: this.errorService.getErrorByCode('ORG_NOT_FOUND'),
          message: 'Organization not found or access denied',
        };
      }

      const devices = await this.database
        .select({
          id: deviceRegistrations.id,
          deviceName: deviceRegistrations.deviceName,
          deviceFingerprint: deviceRegistrations.deviceFingerprint,
          isActive: deviceRegistrations.isActive,
          lastUsed: deviceRegistrations.lastUsed,
          createdAt: deviceRegistrations.createdAt,
        })
        .from(deviceRegistrations)
        .where(
          and(
            eq(deviceRegistrations.organizationId, organizationId),
            eq(deviceRegistrations.userId, ownerId),
          ),
        )
        .orderBy(desc(deviceRegistrations.lastUsed));

      return {
        data: { devices },
        error: null,
        message: 'Registered devices retrieved successfully',
      };
    } catch (error) {
      this.logger.error(
        `Error retrieving devices for organization ${organizationId}:`,
        error,
      );
      const errorDef = this.errorService.getErrorByCode('INTERNAL_ERROR');
      return {
        data: null,
        error: errorDef,
        message: 'Something went wrong while retrieving registered devices',
      };
    }
  }

  async revokeDeviceAccess({
    organizationId,
    deviceId,
    ownerId,
  }: {
    organizationId: string;
    deviceId: string;
    ownerId: string;
  }) {
    try {
      // First verify user has access to this organization
      const hasAccess = await this.hasAccess({ organizationId, ownerId });
      if (!hasAccess) {
        return {
          data: null,
          error: this.errorService.getErrorByCode('ORG_NOT_FOUND'),
          message: 'Organization not found or access denied',
        };
      }

      // Deactivate the device registration
      const [updatedDevice] = await this.database
        .update(deviceRegistrations)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(deviceRegistrations.id, deviceId),
            eq(deviceRegistrations.organizationId, organizationId),
            eq(deviceRegistrations.userId, ownerId),
          ),
        )
        .returning({
          id: deviceRegistrations.id,
          deviceName: deviceRegistrations.deviceName,
        });

      if (!updatedDevice) {
        return {
          data: null,
          error: this.errorService.getErrorByCode('DEVICE_NOT_FOUND'),
          message: 'Device registration not found',
        };
      }

      this.logger.log(
        `Device access revoked: ${updatedDevice.id} for org ${organizationId}`,
      );

      return {
        data: {
          deviceId: updatedDevice.id,
          deviceName: updatedDevice.deviceName,
          revoked: true,
        },
        error: null,
        message: 'Device access revoked successfully',
      };
    } catch (error) {
      this.logger.error(
        `Error revoking device access ${deviceId} for organization ${organizationId}:`,
        error,
      );
      const errorDef = this.errorService.getErrorByCode('INTERNAL_ERROR');
      return {
        data: null,
        error: errorDef,
        message: 'Something went wrong while revoking device access',
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

  // Helper method to generate device names from user agents
  private generateDeviceName(userAgent: string): string {
    const ua = userAgent.toLowerCase();

    let os = 'Unknown OS';
    let browser = 'Unknown Browser';

    // Detect OS
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('mac')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

    // Detect browser
    if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('safari') && !ua.includes('chrome'))
      browser = 'Safari';
    else if (ua.includes('edg')) browser = 'Edge';

    return `${browser} on ${os}`;
  }
}
