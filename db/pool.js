const { Pool } = require('pg');

const options = {};

if (process.env.DATABASE_URL) {
  options.connectionString = process.env.DATABASE_URL;
}

if (process.env.DATABASE_SSL === 'true' || process.env.PGSSLMODE === 'require') {
  options.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(options);

module.exports = pool;
