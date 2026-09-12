/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vynexa: {
          bg: "#0D0D0D",
          surface: "#141414",
          "surface-secondary": "#191919",
          "surface-elevated": "#202020",
          "text-primary": "#F5F5F5",
          "text-secondary": "#A1A1A1",
          "text-muted": "#6F6F6F",
          border: "#292929",
          "light-surface": "#F7F7F5",
          white: "#FFFFFF",
          // Restrained status colors
          status: {
            success: "#10B981",
            "success-bg": "#064E3B",
            warning: "#F59E0B",
            "warning-bg": "#451A03",
            danger: "#EF4444",
            "danger-bg": "#451212",
            info: "#3B82F6",
            "info-bg": "#172554"
          }
        }
      },
      fontFamily: {
        sans: ['Asap', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace']
      },
      borderRadius: {
        DEFAULT: '8px',
        md: '8px',
        lg: '10px',
        sm: '6px'
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
        elevated: '0 4px 12px 0 rgba(0, 0, 0, 0.6)'
      }
    },
  },
  plugins: [],
}
