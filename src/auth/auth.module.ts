import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CommonModule } from 'src/common/common.module';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [CommonModule, DatabaseModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
