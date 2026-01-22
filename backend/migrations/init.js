require('dotenv').config();
const User = require('../models/User');

async function runMigrations() {
  try {
    console.log('Running database migrations...');
    
    // Create users table
    await User.createTable();
    
    console.log('✓ All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();