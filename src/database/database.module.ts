import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initializeDatabase, getDatabase } from './db';

const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('database.url');
        return initializeDatabase(databaseUrl!);
      },
    },
    {
      provide: 'DATABASE',
      useFactory: () => getDatabase(),
    },
  ],
  exports: ['DATABASE'],
})
export class DatabaseModule {}
