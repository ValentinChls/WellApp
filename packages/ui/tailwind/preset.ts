import type { Config } from 'tailwindcss'
import { brand, secondary, primaryScale } from '../tokens/colors'
import { fontFamily } from '../tokens/typography'

/**
 * Preset Tailwind Wellpharma — consommé par l'app admin (Next.js + shadcn/ui).
 * - Palette de marque exposée sous `wellpharma.*` (valeurs charte, hex direct).
 * - Jetons sémantiques shadcn (`background`, `primary`, …) via variables CSS
 *   définies dans `app/globals.css` (permet le dark mode).
 */
const preset: Omit<Config, 'content'> = {
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        // Palette de marque (charte)
        wellpharma: {
          DEFAULT: brand.primary,
          primary: brand.primary,
          navy: brand.navy,
          ...primaryScale,
          ...secondary,
        },
        // Jetons sémantiques shadcn (pilotés par variables CSS HSL)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
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
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        sans: fontFamily.sans,
        display: fontFamily.display,
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}

export default preset
