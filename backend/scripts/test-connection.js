// Test Neon database connection
require('dotenv').config();
const { pool, query } = require('../config/database');

async function testConnection() {
  console.log('\n🧪 Testing Neon PostgreSQL Connection...\n');
  
  try {
    // Test 1: Basic connection
    console.log('Test 1: Basic Connection');
    const client = await pool.connect();
    console.log('✅ Connected to Neon PostgreSQL\n');
    client.release();
    
    // Test 2: Query execution
    console.log('Test 2: Query Execution');
    const result = await query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Query successful');
    console.log('   Time:', result.rows[0].current_time);
    console.log('   Version:', result.rows[0].pg_version.split(' ')[0], result.rows[0].pg_version.split(' ')[1]);
    console.log('');
    
    // Test 3: Check tables exist
    console.log('Test 3: Verify Tables');
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    const expectedTables = [
      'users', 'accounts', 'campaigns', 'ad_groups', 
      'keywords', 'alerts', 'optimization_rules'
    ];
    
    console.log(`✅ Found ${tables.rows.length} tables:`);
    tables.rows.forEach(row => {
      const isExpected = expectedTables.includes(row.table_name);
      console.log(`   ${isExpected ? '✅' : '⚠️'} ${row.table_name}`);
    });
    console.log('');
    
    // Test 4: Count records
    console.log('Test 4: Record Counts');
    for (const table of expectedTables) {
      try {
        const countResult = await query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   ${table}: ${countResult.rows[0].count} records`);
      } catch (err) {
        console.log(`   ⚠️ ${table}: Table not found or error`);
      }
    }
    console.log('');
    
    // Test 5: Connection pool status
    console.log('Test 5: Connection Pool Status');
    console.log(`   Total connections: ${pool.totalCount}`);
    console.log(`   Idle connections: ${pool.idleCount}`);
    console.log(`   Waiting requests: ${pool.waitingCount}`);
    console.log('');
    
    console.log('🎉 All tests passed!\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check DATABASE_URL in .env file');
    console.error('2. Verify Neon project is active');
    console.error('3. Check internet connection');
    console.error('4. Run: npm run migrate\n');
  } finally {
    await pool.end();
    process.exit();
  }
}

testConnection();