import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(databaseUrl);
  } catch (error) {
    console.error(error);
    throw new Error('Invalid DATABASE_URL format');
  }

  return {
    url: databaseUrl,
    host: parsedUrl.hostname,
    port: parseInt(parsedUrl.port) || 5432,
    username: parsedUrl.username,
    password: parsedUrl.password,
    database: parsedUrl.pathname.slice(1),
    ssl:
      parsedUrl.searchParams.get('sslmode') === 'require' ||
      parsedUrl.hostname.includes('supabase') ||
      process.env.NODE_ENV === 'production',
  };
});
