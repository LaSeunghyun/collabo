import '@testing-library/jest-dom';

// Set test environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db?schema=public';
process.env.NEXTAUTH_SECRET = 'lash';
process.env.NEXTAUTH_URL = 'http://localhost:3000';