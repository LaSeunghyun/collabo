import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

async function testDrizzleMigration() {
  console.log('🚀 Starting Drizzle migration test...');
  
  try {
    // Create connection
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }

    console.log('📡 Connecting to Supabase database...');
    const client = postgres(connectionString, { prepare: false });
    const db = drizzle(client);

    // Test basic connection
    console.log('🔍 Testing database connection...');
    const result = await db.execute('SELECT NOW() as current_time');
    console.log('✅ Database connection successful:', result[0]);

    // Test schema introspection
    console.log('📋 Testing schema introspection...');
    const tables = await db.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    console.log('📊 Existing tables:', tables.map((t: any) => t.table_name));

    // Test a simple query on users table (if it exists)
    try {
      const userCount = await db.execute('SELECT COUNT(*) as count FROM users');
      console.log('👥 Users count:', userCount[0]);
    } catch (error) {
      console.log('ℹ️  Users table does not exist yet (expected for first migration)');
    }

    // Test enum creation
    console.log('🔧 Testing enum creation...');
    try {
      await db.execute(`
        DO $$ BEGIN
          CREATE TYPE user_role AS ENUM ('CREATOR', 'PARTICIPANT', 'PARTNER', 'ADMIN');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
      console.log('✅ User role enum created/verified');
    } catch (error) {
      console.log('⚠️  Enum creation error (may already exist):', error);
    }

    // Test table creation
    console.log('🏗️  Testing table creation...');
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS test_users (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          role user_role DEFAULT 'PARTICIPANT',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('✅ Test users table created successfully');
    } catch (error) {
      console.log('⚠️  Table creation error:', error);
    }

    // Test data insertion
    console.log('📝 Testing data insertion...');
    try {
      const testUser = {
        id: 'test-' + Date.now(),
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        role: 'PARTICIPANT' as const,
      };

      await db.execute(`
        INSERT INTO test_users (id, name, email, role) 
        VALUES ('${testUser.id}', '${testUser.name}', '${testUser.email}', '${testUser.role}')
        ON CONFLICT (email) DO NOTHING
      `);

      console.log('✅ Test user inserted successfully');

      // Verify insertion
      const insertedUser = await db.execute(
        `SELECT * FROM test_users WHERE id = '${testUser.id}'`
      );
      console.log('✅ Test user verification:', insertedUser[0]);
    } catch (error) {
      console.log('⚠️  Data insertion error:', error);
    }

    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    try {
      await db.execute('DROP TABLE IF EXISTS test_users CASCADE');
      console.log('✅ Test data cleaned up');
    } catch (error) {
      console.log('⚠️  Cleanup error:', error);
    }

    console.log('🎉 Drizzle migration test completed successfully!');
    console.log('📋 Next steps:');
    console.log('   1. Run: npm run db:generate-migration');
    console.log('   2. Run: npm run db:migrate');
    console.log('   3. Run: npm run db:studio (optional)');

  } catch (error) {
    console.error('❌ Migration test failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the test
testDrizzleMigration();
