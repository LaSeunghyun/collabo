import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Design System Colors
        'gray-000': '#FFFFFF',
        'gray-050': '#F7F7F7',
        'gray-100': '#F0F0F0',
        'gray-200': '#E6E6E6',
        'gray-300': '#D9D9D9',
        'gray-400': '#BFBFBF',
        'gray-500': '#999999',
        'gray-600': '#737373',
        'gray-700': '#525252',
        'gray-800': '#333333',
        'gray-900': '#1A1A1A',
        
        // Status Colors
        'status-success': '#27AE60',
        'status-alert': '#F2C94C',
        'status-error': '#EB5757',
        'status-info': '#2D9CDB',
        
        // Coral Colors (for Header component)
        'coral-50': '#FFF5F5',
        'coral-100': '#FED7D7',
        'coral-200': '#FEB2B2',
        'coral-300': '#FC8181',
        'coral-400': '#F56565',
        'coral-500': '#E53E3E',
        'coral-600': '#C53030',
        'coral-700': '#9B2C2C',
        'coral-800': '#822727',
        'coral-900': '#63171B',
        
        // Semantic Colors
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        'card-foreground': 'var(--card-foreground)',
        popover: 'var(--popover)',
        'popover-foreground': 'var(--popover-foreground)',
        primary: 'var(--primary)',
        'primary-foreground': 'var(--primary-foreground)',
        secondary: 'var(--secondary)',
        'secondary-foreground': 'var(--secondary-foreground)',
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        accent: 'var(--accent)',
        'accent-foreground': 'var(--accent-foreground)',
        destructive: 'var(--destructive)',
        'destructive-foreground': 'var(--destructive-foreground)',
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular'],
      },
      fontSize: {
        'display': ['var(--text-display)', { lineHeight: 'var(--line-height-display)' }],
        'h1': ['var(--text-h1)', { lineHeight: 'var(--line-height-h1)' }],
        'h2': ['var(--text-h2)', { lineHeight: 'var(--line-height-h2)' }],
        'h3': ['var(--text-h3)', { lineHeight: 'var(--line-height-h3)' }],
        'body-l': ['var(--text-body-l)', { lineHeight: 'var(--line-height-body-l)' }],
        'body-m': ['var(--text-body-m)', { lineHeight: 'var(--line-height-body-m)' }],
        'caption': ['var(--text-caption)', { lineHeight: 'var(--line-height-caption)' }],
        'button': ['var(--text-button)', { lineHeight: 'var(--line-height-button)' }],
      },
      spacing: {
        '2': 'var(--space-2)',
        '4': 'var(--space-4)',
        '8': 'var(--space-8)',
        '12': 'var(--space-12)',
        '16': 'var(--space-16)',
        '20': 'var(--space-20)',
        '24': 'var(--space-24)',
        '32': 'var(--space-32)',
        '40': 'var(--space-40)',
      },
      boxShadow: {
        'xs': 'var(--tw-shadow-xs)',
        'sm': 'var(--tw-shadow-sm)',
        'md': 'var(--tw-shadow-md)',
        'lg': 'var(--tw-shadow-lg)',
      }
    },
  },
  plugins: [],
}

export default config

