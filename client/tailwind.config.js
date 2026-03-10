/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
      },
      // EAI-39: bump all font sizes up by ~2px for readability
      fontSize: {
        xs:   ['0.875rem', { lineHeight: '1.25rem' }],  // 14px (was 12px)
        sm:   ['1rem',     { lineHeight: '1.5rem'  }],  // 16px (was 14px)
        base: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px (was 16px)
        lg:   ['1.25rem',  { lineHeight: '1.75rem' }],  // 20px (was 18px)
        xl:   ['1.375rem', { lineHeight: '1.875rem'}],  // 22px (was 20px)
        '2xl':['1.625rem', { lineHeight: '2rem'    }],  // 26px (was 24px)
        '3xl':['2rem',     { lineHeight: '2.25rem' }],  // 32px (was 30px)
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
        '3xl': 'calc(var(--radius) + 16px)',
      },
      zIndex: {
        nav: '10',
        overlay: '40',
        modal: '50',
        chrome: '90',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        mint: 'hsl(var(--mint))',
      },
    },
  },
  plugins: [],
};
