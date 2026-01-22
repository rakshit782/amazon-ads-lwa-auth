const { Pool } = require('pg');

// Create PostgreSQL connection pool for Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✓ Neon PostgreSQL connected successfully');
    client.release();
  } catch (error) {
    console.error('✗ Neon PostgreSQL connection error:', error.message);
    process.exit(1);
  }
};

// Query helper
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};

module.exports = {
  pool,
  query,
  testConnection
};