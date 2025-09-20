import { Inject, Injectable } from '@nestjs/common';
import { eq, count, and } from 'drizzle-orm';
import { Database } from '../database/db';
import { organizations } from '../database/schema';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationService {
  constructor(@Inject('DATABASE') private readonly db: Database) {}

  async create(dto: CreateOrganizationDto) {
    const [org] = await this.db
      .insert(organizations)
      .values(dto)
      .returning({ id: organizations.id });
    return org;
  }

  async findAll(ownerId: string, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    // Fetch paginated data
    const data = await this.db
      .select({ id: organizations.id, name: organizations.name })
      .from(organizations)
      .where(eq(organizations.ownerId, ownerId))
      .limit(limit)
      .offset(offset);

    // Type the result array explicitly
    const result = await this.db
      .select({ count: count() })
      .from(organizations)
      .where(eq(organizations.ownerId, ownerId));

    const total = result[0].count;

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const [org] = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id));
    return org;
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    const [org] = await this.db
      .update(organizations)
      .set(dto)
      .where(eq(organizations.id, id))
      .returning();
    return org;
  }

  async remove(id: string) {
    await this.db.delete(organizations).where(eq(organizations.id, id));
    return { deleted: true };
  }

  async keys(ownerId: string, orgId: string) {
    const [orgKeys] = await this.db
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

    return orgKeys;
  }
}
