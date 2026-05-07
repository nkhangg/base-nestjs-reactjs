/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      /* ─── Fonts ───────────────────────────────────────────────────── */
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },

      /* ─── Colors ──────────────────────────────────────────────────── */
      colors: {
        /* Nihongo design system tokens */
        ink: {
          DEFAULT: 'hsl(var(--ink))',
          2: 'hsl(var(--ink-2))',
          3: 'hsl(var(--ink-3))',
          4: 'hsl(var(--ink-4))',
        },
        paper: 'hsl(var(--paper))',
        surface: {
          DEFAULT: 'hsl(var(--surface))',
          2: 'hsl(var(--surface-2))',
        },
        vermillion: {
          DEFAULT: 'hsl(var(--vermillion))',
          light: 'hsl(var(--vermillion-lt))',
          mid: 'hsl(var(--vermillion-md))',
        },
        pine: {
          DEFAULT: 'hsl(var(--pine))',
          light: 'hsl(var(--pine-lt))',
        },
        amber: {
          DEFAULT: 'hsl(var(--amber))',
          light: 'hsl(var(--amber-lt))',
        },

        /* shadcn/ui semantic tokens */
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
      },

      /* ─── Border radius ───────────────────────────────────────────── */
      borderRadius: {
        sm:   'var(--radius-sm)',              /* 8px  */
        md:   'calc(var(--radius) - 2px)',     /* 12px */
        lg:   'var(--radius)',                 /* 14px — main */
        xl:   'var(--radius-lg)',              /* 20px */
        '2xl': '1.5rem',
        full:  '9999px',
      },

      /* ─── Keyframes ───────────────────────────────────────────────── */
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'float-up': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'float-up': 'float-up 3s ease-in-out infinite',
        'fade-up': 'fade-up 0.5s ease both',
      },
    },
  },
  plugins: [],
}
