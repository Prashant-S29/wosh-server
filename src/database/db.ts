import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let client: postgres.Sql;
let db: ReturnType<typeof drizzle>;

export const initializeDatabase = (connectionString: string) => {
  if (!client) {
    client = postgres(connectionString);
    db = drizzle(client, { schema });
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
    await client.end();
  }
};

export type Database = typeof db;
