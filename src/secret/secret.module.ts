import { Module } from '@nestjs/common';
import { SecretService } from './secret.service';
import { SecretController } from './secret.controller';
import { ErrorsModule } from 'src/common/errors/errors.module';
import { DatabaseModule } from 'src/database/database.module';
import { ProjectService } from 'src/project/project.service';
import { AuthService } from 'src/auth/auth.service';
import { OrganizationService } from 'src/organization/organization.service';

@Module({
  controllers: [SecretController],
  providers: [SecretService, ProjectService, AuthService, OrganizationService],
  imports: [DatabaseModule, ErrorsModule],
})
export class SecretModule {}
