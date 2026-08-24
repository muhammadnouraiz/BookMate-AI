const { Pool } = require('pg');
const { env } = require('../config/env');

// Single shared pool, imported by services. No ORM — raw SQL for transparency.
const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.pgSsl ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  // Handles idle client errors so a bad connection doesn't crash the whole process.
  console.error('Unexpected error on idle PG client', err);
});

module.exports = pool;
