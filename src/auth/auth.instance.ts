import { createAuthConfig } from './auth.config';
import { Database, initializeDatabase } from '../database/db';

let db: any;
void (async () => {
  db = await initializeDatabase(process.env.DATABASE_URL!);
})();

export const auth = createAuthConfig(db as Database);
export default auth;
