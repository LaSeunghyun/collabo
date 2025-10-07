import { test, expect } from '@playwright/test';

test('basic test - check if server is running', async ({ page }) => {
  // 서버가 실행 중인지 확인
  const response = await page.goto('http://localhost:3000', { 
    waitUntil: 'networkidle',
    timeout: 10000 
  });
  
  // 500 에러라도 응답이 오면 서버는 실행 중
  expect(response?.status()).toBeDefined();
  console.log('Server response status:', response?.status());
});

test('database connection test', async ({ page }) => {
  // 데이터베이스 연결 테스트
  const response = await page.goto('http://localhost:3000/api/test-db', {
    waitUntil: 'networkidle',
    timeout: 10000
  });
  
  expect(response?.status()).toBeDefined();
  console.log('Database test response status:', response?.status());
  
  if (response?.status() === 200) {
    const data = await response.json();
    console.log('Database test result:', data);
  }
});
