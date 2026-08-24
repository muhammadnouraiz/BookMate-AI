// Centralized, validated access to environment variables.
// Every other file should import from here instead of touching process.env directly.
require('dotenv').config();

const required = ['DATABASE_URL', 'JWT_SECRET', 'MISTRAL_API_KEY'];

function assertRequiredEnv() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    // Fail fast and loud at boot rather than deep inside a request handler.
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    console.error('Copy .env.example to .env and fill in the values.');
    process.exit(1);
  }
}

const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  databaseUrl: process.env.DATABASE_URL,
  pgSsl: process.env.PGSSL === 'true',

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  mistralApiKey: process.env.MISTRAL_API_KEY,
  mistralModel: process.env.MISTRAL_MODEL || 'mistral-small-latest',
  mistralApiUrl: process.env.MISTRAL_API_URL || 'https://api.mistral.ai/v1/chat/completions',

  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX) || 60,
};

module.exports = { env, assertRequiredEnv };
