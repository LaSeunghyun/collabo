// Global teardown for E2E tests
import { chromium, FullConfig } from '@playwright/test';
import { DataSeeder } from './data-seeder';

async function globalTeardown(config: FullConfig) {
  console.log('?ßπ Starting global teardown...');
  
  // Launch browser for cleanup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Initialize data seeder
    const seeder = new DataSeeder(page);
    
    // Cleanup test data
    console.log('?óëÔ∏?Cleaning up test data...');
    await seeder.cleanupTestData();
    
    // Clear test files
    console.log('?ìÅ Clearing test files...');
    await clearTestFiles();
    
    // Reset test database
    console.log('?óÑÔ∏?Resetting test database...');
    await resetTestDatabase();
    
    // Cleanup test services
    console.log('?îå Cleaning up test services...');
    await cleanupTestServices();
    
    // Generate test report
    console.log('?ìä Generating test report...');
    await generateTestReport();
    
    // Export test data
    console.log('?íæ Exporting test data...');
    await exportTestData();
    
    console.log('??Global teardown completed successfully!');
    
  } catch (error) {
    console.error('??Global teardown failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function clearTestFiles() {
  // Clear test files
  const fs = require('fs');
  const path = require('path');
  
  const testDirs = [
    'test-results',
    'test-files'
  ];
  
  for (const dir of testDirs) {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
}

async function resetTestDatabase() {
  // Reset test database
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    // Drop all tables
    await prisma.$executeRaw`DROP SCHEMA IF EXISTS public CASCADE`;
    await prisma.$executeRaw`CREATE SCHEMA public`;
    
  } catch (error) {
    console.error('Database reset failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function cleanupTestServices() {
  // Cleanup test services
  const Redis = require('ioredis');
  const redis = new Redis(process.env.REDIS_URL);
  
  try {
    // Clear Redis
    await redis.flushall();
    
  } catch (error) {
    console.error('Redis cleanup failed:', error);
    throw error;
  } finally {
    await redis.disconnect();
  }
}

async function generateTestReport() {
  // Generate test report
  const fs = require('fs');
  const path = require('path');
  
  const reportData = {
    timestamp: new Date().toISOString(),
    testSuite: 'E2E Tests',
    version: '1.0.0',
    environment: 'test',
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0
    },
    details: []
  };
  
  // Read test results
  const resultsPath = 'test-results/results.json';
  if (fs.existsSync(resultsPath)) {
    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    reportData.summary = results.summary;
    reportData.details = results.details;
  }
  
  // Write report
  const reportPath = 'test-results/test-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  
  console.log(`?ìä Test report generated: ${reportPath}`);
}

async function exportTestData() {
  // Export test data for analysis
  const fs = require('fs');
  const path = require('path');
  
  const exportData = {
    timestamp: new Date().toISOString(),
    testData: {
      users: [],
      projects: [],
      settlements: [],
      content: []
    },
    metrics: {
      performance: {},
      security: {},
      reliability: {}
    }
  };
  
  // Export test data
  const exportPath = 'test-results/test-data-export.json';
  fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
  
  console.log(`?íæ Test data exported: ${exportPath}`);
}

export default globalTeardown;
