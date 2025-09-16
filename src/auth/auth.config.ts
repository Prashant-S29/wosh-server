import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { randomUUID } from 'crypto';
import { Database } from '../database/db';
import { account, session, user, verification } from '../database/schema';

import { bearer } from 'better-auth/plugins';

export const createAuthConfig = (database: Database) => {
  return betterAuth({
    database: drizzleAdapter(database, {
      provider: 'pg',
      schema: {
        user,
        session,
        account,
        verification,
      },
    }),

    secret: process.env.BETTER_AUTH_SECRET!,
    baseURL: process.env.BETTER_AUTH_URL!,

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },

    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        enabled: !!(
          process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ),
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID || '',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
        enabled: !!(
          process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
        ),
      },
    },

    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
      },
    },
    plugins: [bearer()],

    advanced: {
      database: {
        generateId: () => randomUUID(),
      },
    },
  });
};

export type AuthSession = ReturnType<
  typeof createAuthConfig
>['$Infer']['Session'];
