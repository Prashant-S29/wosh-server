import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initializeDatabase, Database } from './db';

@Module({
  providers: [
    {
      provide: 'DATABASE',
      useFactory: async (configService: ConfigService): Promise<Database> => {
        const databaseUrl = configService.get<string>('database.url');

        if (!databaseUrl) {
          throw new Error('DATABASE_URL is not configured');
        }

        return await initializeDatabase(databaseUrl);
      },
      inject: [ConfigService],
    },
  ],
  exports: ['DATABASE'],
})
export class DatabaseModule {}
