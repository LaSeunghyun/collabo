import type { Config } from 'jest';

const config: Config = {
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/__tests__/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '^@components/(.*)$': '<rootDir>/components/$1',
        '^@lib/(.*)$': '<rootDir>/lib/$1',
        '^next/image$': '<rootDir>/__mocks__/next/image.tsx',
        '^.+\\.(css|less|scss|sass)$': 'identity-obj-proxy'
      },
      testPathIgnorePatterns: ['/node_modules/', '/.next/'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }]
      }
    },
    {
      displayName: 'react',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/tests/**/*.test.tsx'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '^@components/(.*)$': '<rootDir>/components/$1',
        '^@lib/(.*)$': '<rootDir>/lib/$1',
        '^next/image$': '<rootDir>/__mocks__/next/image.tsx',
        '^.+\\.(css|less|scss|sass)$': 'identity-obj-proxy'
      },
      testPathIgnorePatterns: ['/node_modules/', '/.next/'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }]
      }
    }
  ]
};

export default config;
