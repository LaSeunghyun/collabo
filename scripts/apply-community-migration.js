const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'collabo',
    user: 'postgres',
    password: 'password'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'drizzle', '20251011075818_opposite_next_avengers.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by statement-breakpoint and execute each statement
    const statements = migrationSQL.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s);
    
    for (const statement of statements) {
      console.log('Executing:', statement);
      await client.query(statement);
    }
    
    console.log('Migration applied successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

applyMigration();
