import { Inject, Injectable } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Database } from 'src/database/db';
import { projects } from 'src/database/schema';
import { count, eq } from 'drizzle-orm';

@Injectable()
export class ProjectService {
  constructor(@Inject('DATABASE') private readonly db: Database) {}

  async create(createProjectDto: CreateProjectDto) {
    const [project] = await this.db
      .insert(projects)
      .values(createProjectDto)
      .returning({ id: projects.id });
    return project;
  }

  async findAll(organizationId: string, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    const data = await this.db
      .select({ id: projects.id, name: projects.name })
      .from(projects)
      .where(eq(projects.organizationId, organizationId))
      .limit(limit)
      .offset(offset);

    // Type the result array explicitly
    const result = await this.db
      .select({ count: count() })
      .from(projects)
      .where(eq(projects.organizationId, organizationId));

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

  findOne(id: number) {
    return `This action returns a #${id} project`;
  }

  update(id: number, updateProjectDto: UpdateProjectDto) {
    console.log(updateProjectDto);
    return `This action updates a #${id} project`;
  }

  remove(id: number) {
    return `This action removes a #${id} project`;
  }
}
