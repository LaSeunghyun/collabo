// Global setup for E2E tests
import { chromium, FullConfig } from '@playwright/test';
import { DataSeeder } from './data-seeder';

async function globalSetup(config: FullConfig) {
  console.log('?? Starting global setup...');
  
  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Initialize data seeder
    const seeder = new DataSeeder(page);
    
    // Setup test environment
    console.log('?ìä Setting up test environment...');
    await seeder.setupTestEnvironment();
    
    // Seed test data
    console.log('?å± Seeding test data...');
    await seeder.seedAll();
    
    // Validate test data
    console.log('??Validating test data...');
    const validation = await seeder.validateTestData();
    
    if (!validation.valid) {
      throw new Error(`Test data validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Setup test files
    console.log('?ìÅ Setting up test files...');
    await setupTestFiles();
    
    // Setup test environment variables
    console.log('?îß Setting up environment variables...');
    await setupEnvironmentVariables();
    
    // Setup test database
    console.log('?óÑÔ∏?Setting up test database...');
    await setupTestDatabase();
    
    // Setup test services
    console.log('?îå Setting up test services...');
    await setupTestServices();
    
    console.log('??Global setup completed successfully!');
    
  } catch (error) {
    console.error('??Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function setupTestFiles() {
  // Create test file directories
  const fs = require('fs');
  const path = require('path');
  
  const testDirs = [
    'test-results',
    'test-results/screenshots',
    'test-results/videos',
    'test-results/traces',
    'test-files',
    'test-files/images',
    'test-files/documents'
  ];
  
  for (const dir of testDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  
  // Create sample test files
  const sampleFiles = [
    'test-files/sample-image.jpg',
    'test-files/high-res-image.jpg',
    'test-files/studio-receipt.jpg',
    'test-files/copyright-claim.pdf',
    'test-files/invoice.pdf',
    'test-files/contract.pdf',
    'test-files/valid-image.jpg',
    'test-files/large-file.jpg',
    'test-files/malicious.exe',
    'test-files/script.js',
    'test-files/backdoor.php',
    'test-files/virus.zip'
  ];
  
  for (const file of sampleFiles) {
    if (!fs.existsSync(file)) {
      // Create empty file for testing
      fs.writeFileSync(file, '');
    }
  }
}

async function setupEnvironmentVariables() {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/test_collabo';
  process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6379';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.ENCRYPTION_KEY = 'test-encryption-key';
  process.env.STRIPE_SECRET_KEY = 'sk_test_1234567890';
  process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_1234567890';
  process.env.SMTP_HOST = 'localhost';
  process.env.SMTP_PORT = '1025';
  process.env.SMTP_USER = 'test';
  process.env.SMTP_PASS = 'test';
  process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
  process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
  process.env.AWS_REGION = 'us-east-1';
  process.env.AWS_S3_BUCKET = 'test-bucket';
}

async function setupTestDatabase() {
  // Setup test database
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    // Reset database
    await prisma.$executeRaw`DROP SCHEMA IF EXISTS public CASCADE`;
    await prisma.$executeRaw`CREATE SCHEMA public`;
    
    // Run migrations
    const { execSync } = require('child_process');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    
    // Generate Prisma client
    execSync('npx prisma generate', { stdio: 'inherit' });
    
  } catch (error) {
    console.error('Database setup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function setupTestServices() {
  // Setup test services (Redis, SMTP, etc.)
  const Redis = require('ioredis');
  const redis = new Redis(process.env.REDIS_URL);
  
  try {
    // Clear Redis
    await redis.flushall();
    
    // Setup Redis test data
    await redis.set('test:setup', 'completed');
    
  } catch (error) {
    console.error('Redis setup failed:', error);
    throw error;
  } finally {
    await redis.disconnect();
  }
}

export default globalSetup;
