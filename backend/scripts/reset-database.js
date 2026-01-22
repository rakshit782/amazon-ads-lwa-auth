require('dotenv').config();
const { query, pool } = require('../config/database');

async function resetDatabase() {
  try {
    console.log('🗑️  Dropping existing tables...');
    
    // Drop the users table if it exists
    await query('DROP TABLE IF EXISTS users CASCADE');
    console.log('✓ Dropped users table');
    
    console.log('\n🔨 Creating fresh tables...');
    
    // Import User model and create table
    const User = require('../models/User');
    await User.createTable();
    
    console.log('\n✅ Database reset complete!');
    console.log('You can now run: npm run dev\n');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Reset failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

resetDatabase();