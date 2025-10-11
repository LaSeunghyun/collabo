const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function applySchemaFix() {
  const client = new Client({
    host: 'aws-1-us-east-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.tsdnwdwcwnqygyepojaq',
    password: 'V7mgCwC7zV4IciHn',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read SQL file
    const sqlPath = path.join(__dirname, 'fix-database-schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute SQL
    await client.query(sql);
    console.log('Schema fix applied successfully');
  } catch (error) {
    console.error('Schema fix failed:', error);
  } finally {
    await client.end();
  }
}

applySchemaFix();
