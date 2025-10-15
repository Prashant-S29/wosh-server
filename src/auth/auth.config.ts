import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { randomUUID } from 'crypto';
import { Database } from '../database/db';
import { account, session, user, verification } from '../database/schema';

import { bearer, emailOTP } from 'better-auth/plugins';

import { sendEmail } from 'src/config/resend.config';
import { SignInOtpTemplate } from 'src/common/emailTemplate';

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
    plugins: [
      bearer(),
      emailOTP({
        async sendVerificationOTP({ email, otp, type }) {
          if (process.env.NODE_ENV === 'development') {
            console.log({
              email,
              otp,
              type,
            });
            return;
          }

          if (type === 'sign-in') {
            const sendEmailRes = await sendEmail({
              from: 'Wosh <support@woshvalut.xyz>',
              to: [email],
              subject: 'Verify your email address',
              html: SignInOtpTemplate({ email, otp }),
            });

            if (sendEmailRes.error) {
              throw new Error(sendEmailRes.message, {
                cause: 'RESEND_ERROR',
              });
            }
          } else if (type === 'email-verification') {
            // Send the OTP for email verification
          } else {
            // Send the OTP for password reset
          }
        },
      }),
    ],

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
