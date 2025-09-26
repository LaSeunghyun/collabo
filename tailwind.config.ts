import type { Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultTheme';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './ui/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Pretendard"', '"Noto Sans KR"', ...fontFamily.sans]
      },
      colors: {
        primary: {
          DEFAULT: '#6366F1',
          foreground: '#FFFFFF'
        },
        neutral: {
          950: '#0F0F10'
        },
        category: {
          music: '#6366F1',
          performance: '#EF4444',
          art: '#F97316',
          tech: '#10B981'
        }
      }
    }
  },
  plugins: []
};

export default config;
