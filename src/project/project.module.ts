import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  controllers: [ProjectController],
  providers: [ProjectService],
  imports: [DatabaseModule],
})
export class ProjectModule {}
