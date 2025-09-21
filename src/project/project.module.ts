import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { DatabaseModule } from 'src/database/database.module';
import { AuthService } from 'src/auth/auth.service';
import { ErrorsModule } from 'src/common/errors/errors.module';
import { OrganizationService } from 'src/organization/organization.service';

@Module({
  controllers: [ProjectController],
  providers: [ProjectService, AuthService, OrganizationService],
  imports: [DatabaseModule, ErrorsModule],
})
export class ProjectModule {}
