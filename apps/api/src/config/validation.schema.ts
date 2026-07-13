/**
 * Validates required environment variables at startup so the app fails fast
 * instead of throwing confusing errors deep in a request handler.
 */

export interface EnvConfig {
  NODE_ENV: 'development' | 'staging' | 'production' | 'test';
  DATABASE_URL: string;
  JWT_SECRET: string;
  PORT: string;
  HOST: string;
  FRONTEND_URL: string;
  ALLOWED_ORIGINS: string;
}

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const errors: string[] = [];

  const nodeEnv = (config.NODE_ENV as string) || 'development';
  if (!['development', 'staging', 'production', 'test'].includes(nodeEnv)) {
    errors.push(`NODE_ENV: invalid value "${nodeEnv}"`);
  }

  const databaseUrl = config.DATABASE_URL as string | undefined;
  if (!databaseUrl || !databaseUrl.startsWith('postgresql://')) {
    errors.push('DATABASE_URL: must be a postgresql:// connection string');
  }

  const jwtSecret = config.JWT_SECRET as string | undefined;
  if (!jwtSecret || jwtSecret.length < 32) {
    errors.push('JWT_SECRET: must be at least 32 characters');
  }

  if (errors.length > 0) {
    console.error('❌ Environment validation failed:');
    errors.forEach((e) => console.error(`  • ${e}`));
    console.error('\nQuick fix: cp .env.example .env and fill in the values.');
    process.exit(1);
  }

  return {
    NODE_ENV: nodeEnv as EnvConfig['NODE_ENV'],
    DATABASE_URL: databaseUrl!,
    JWT_SECRET: jwtSecret!,
    PORT: (config.PORT as string) || '3000',
    HOST: (config.HOST as string) || '0.0.0.0',
    FRONTEND_URL: (config.FRONTEND_URL as string) || 'http://localhost:3001',
    ALLOWED_ORIGINS: (config.ALLOWED_ORIGINS as string) || '',
  };
}
