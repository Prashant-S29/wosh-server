import { Module } from '@nestjs/common';
import { ResponseService } from './services/response.service';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { ErrorService } from './errors/error.service';

@Module({
  providers: [ResponseService, ErrorService, GlobalExceptionFilter],
  exports: [ResponseService, ErrorService, GlobalExceptionFilter],
})
export class CommonModule {}
