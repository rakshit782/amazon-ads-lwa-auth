const { Pool } = require('pg');

// Create PostgreSQL connection pool optimized for Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // Neon-optimized settings
  max: 10, // Reduced for Neon's connection limits
  idleTimeoutMillis: 30000, // 30 seconds
  connectionTimeoutMillis: 10000, // Increased to 10 seconds for Neon wake-up
  allowExitOnIdle: true, // Important for Neon serverless
});

// Test connection with retries
const testConnection = async () => {
  const maxRetries = 3;
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Attempting to connect to Neon PostgreSQL... (attempt ${i + 1}/${maxRetries})`);
      const client = await pool.connect();
      console.log('✓ Neon PostgreSQL connected successfully');
      client.release();
      return; // Success, exit function
    } catch (error) {
      lastError = error;
      console.log(`✗ Connection attempt ${i + 1} failed: ${error.message}`);
      
      if (i < maxRetries - 1) {
        console.log(`Retrying in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  // All retries failed
  console.error('\n✗ Failed to connect to Neon PostgreSQL after', maxRetries, 'attempts');
  console.error('Error:', lastError.message);
  console.error('\nPlease check:');
  console.error('1. DATABASE_URL in .env is correct');
  console.error('2. Neon project is not suspended');
  console.error('3. Your IP is not blocked');
  console.error('4. Internet connection is stable\n');
  process.exit(1);
};

// Query helper with error handling
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    // Only log slow queries (> 1 second) to reduce noise
    if (duration > 1000) {
      console.log('Slow query detected', { duration: `${duration}ms`, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('Query error:', error.message);
    throw error;
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing database pool');
  pool.end(() => {
    console.log('Database pool closed');
  });
});

module.exports = {
  pool,
  query,
  testConnection
};