import type { Config } from 'tailwindcss'
 
const config: Config = {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
 
  theme: {
    extend: {
 
      // ─── Brand Colors ────────────────────────────────────────────
      colors: {
        brand: {
          red:      '#940002',   // primary — buttons, active states, top bar
          redHover: '#7a0002',   // primary hover (8% darker)
          redPress: '#600001',   // primary pressed (12% darker)
          surface:  '#E6DDD4',   // page background (warm rose-beige)
          black:    '#1b1b1b',   // deep neutral black used in track-admin/instructor UIs
          muted:    '#4c4546',   // secondary label text (warm dark grey)
          danger:   '#ba1a1a',   // error/warning state used in grade UI
          cream:    '#ebdfc2',   // late-attendance warm tint
        },
 
        // ─── Neutrals ──────────────────────────────────────────────
        neutral: {
          0:   '#FFFFFF',        // card surface
          50:  '#FAF7F5',        // table row hover / subtle tint
          100: '#F5EDEA',        // sidebar active bg / input fill
          200: '#E6DDD4',        // same as brand.surface — aliased here for semantic use
          300: '#C9BDB8',        // borders, dividers, input outlines
          400: '#AEAEAE',        // placeholder text
          500: '#888888',        // tertiary text / uppercase labels
          600: '#666666',        // secondary text
          800: '#1A0000',        // primary text (deep warm black)
          900: '#0D0000',        // headings max contrast
        },
 
        // ─── Semantic / Status ─────────────────────────────────────
        success: {
          DEFAULT: '#2D6A4F',    // present / passed
          light:   '#D1FAE5',    // success background tint
        },
        warning: {
          DEFAULT: '#92400E',    // at-risk / pending
          light:   '#FEF3C7',    // warning background tint
        },
        danger: {
          DEFAULT: '#991B1B',    // absent / failed / danger
          light:   '#FEE2E2',    // danger background tint
        },
        info: {
          DEFAULT: '#1E3A5F',    // informational
          light:   '#DBEAFE',    // info background tint
        },
      },
 
      // ─── Typography ──────────────────────────────────────────────
      fontFamily: {
        serif:  ['"DM Serif Display"', 'Georgia', 'serif'],   // H1, H2, grand totals, key headings
        sans:   ['"DM Sans"', 'system-ui', 'sans-serif'],     // all UI text, body, labels
      },
 
      fontSize: {
        // Uppercase micro-labels  (DM Sans, tracking-widest)
        'label': ['11px', { lineHeight: '1', letterSpacing: '0.12em', fontWeight: '400' }],
 
        // Body
        'sm':   ['13px', { lineHeight: '1.6' }],
        'base': ['14px', { lineHeight: '1.75' }],
        'md':   ['15px', { lineHeight: '1.7'  }],
 
        // UI headings (DM Sans 500)
        'h3':  ['18px', { lineHeight: '1.4', fontWeight: '500' }],
 
        // Page headings (DM Serif Display)
        'h2':  ['26px', { lineHeight: '1.25' }],
        'h1':  ['36px', { lineHeight: '1.2'  }],
 
        // Data / grand total numbers
        'data-lg': ['32px', { lineHeight: '1',   fontWeight: '500' }],
        'data-xl': ['52px', { lineHeight: '1',   fontWeight: '400' }],  // grand total
      },
 
      // ─── Spacing ─────────────────────────────────────────────────
      spacing: {
        '4.5': '1.125rem',   // 18px — card inner padding supplement
        '18':  '4.5rem',     // 72px — section gap
        '22':  '5.5rem',     // 88px — top bar height on xl
      },
 
      // ─── Border Radius ───────────────────────────────────────────
      borderRadius: {
        'card':   '10px',    // cards, modals
        'badge':  '6px',     // role badges, status pills
        'btn':    '6px',     // all buttons — never pill-shaped
        'input':  '6px',     // form inputs
        'full':   '9999px',  // avatar circles only
      },
 
      // ─── Box Shadow ──────────────────────────────────────────────
      // Design uses borders, not shadows — but keep a subtle one for modals/drawers
      boxShadow: {
        'card':   'none',
        'modal':  '0 8px 32px rgba(0,0,0,0.12)',
        'drawer': '-4px 0 24px rgba(0,0,0,0.08)',
      },
 
      // ─── Layout ──────────────────────────────────────────────────
      maxWidth: {
        'content': '1100px',   // main content area max-width
      },
 
      height: {
        'topbar':  '56px',     // fixed top navigation bar height
        'btn':     '38px',     // default button height
        'btn-sm':  '34px',     // small button
        'btn-xs':  '30px',     // extra small button
        'input':   '40px',     // all form inputs
      },
 
      width: {
        'sidebar': '240px',    // left sidebar width
        'drawer':  '440px',    // right-side detail drawer
      },
 
      // ─── Transitions ─────────────────────────────────────────────
      transitionDuration: {
        DEFAULT: '150ms',
        'fast':  '100ms',
        'slow':  '250ms',
      },
 
      transitionTimingFunction: {
        'ui': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
 
      // ─── Z-index Scale ───────────────────────────────────────────
      zIndex: {
        'topbar':  '50',
        'sidebar': '40',
        'drawer':  '60',
        'modal':   '70',
        'toast':   '80',
        'overlay': '55',
      },
    },
  },
 
  plugins: [],
}
 
export default config
 