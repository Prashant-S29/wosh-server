import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';
import postgres from 'postgres';

let client: postgres.Sql;
let db: ReturnType<typeof drizzle>;

export const initializeDatabase = async (connectionString: string) => {
  if (!client) {
    const postgres = await import('postgres');
    const postgresClient = postgres.default || postgres;

    const connectionOptions = {
      ssl:
        connectionString.includes('supabase') ||
        connectionString.includes('sslmode=require') ||
        process.env.NODE_ENV === 'production'
          ? 'require'
          : false,

      max: 10,
      idle_timeout: 20,
      connect_timeout: 60,

      connection: {
        application_name: 'nestjs-app',
      },
    } satisfies postgres.Options<any>;

    client = postgresClient(connectionString, connectionOptions);
    db = drizzle(client, { schema });

    // Test the connection
    try {
      await client`SELECT 1`;
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }
  return db;
};

export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return db;
};

export const closeDatabaseConnection = async () => {
  if (client) {
    console.log('Closing database connection...');
    await client.end();
    console.log('Database connection closed');
  }
};

export type Database = typeof db;
