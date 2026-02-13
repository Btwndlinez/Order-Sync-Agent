/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./extension/**/*.{ts,tsx}",
    "./contexts/**/*.{ts,tsx}",
    "./styles/**/*.{css}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#1877F2",
          "blue-hover": "#166fe5",
          "blue-light": "#E7F3FF",
          dark: "#1C1E21",
        },
        fbBlue: "#1877F2",
        fbBlueHover: "#166fe5",
        fbGray: "#65676B",
        background: {
          DEFAULT: "#F0F2F5",
          light: "#F0F2F5",
          dark: "#18191A",
        },
        card: {
          DEFAULT: "#FFFFFF",
          light: "#FFFFFF",
          dark: "#242526",
          tertiary: {
            light: "#F0F2F5",
            dark: "#3A3B3C",
          }
        },
        border: {
          DEFAULT: "#CED0D4",
          light: "#CED0D4",
          dark: "#3E4042",
        },
        text: {
          primary: {
            light: "#050505",
            dark: "#E4E6EB",
          },
          secondary: {
            light: "#65676B",
            dark: "#B0B3B8",
          },
          tertiary: {
            light: "#8A8D91",
            dark: "#8A8D91",
          }
        },
        status: {
          green: "#00C851",
          red: "#FF4D4D",
          orange: "#FF9800",
          yellow: "#FFD700",
        }
      },
      borderRadius: {
        lg: "8px",
        xl: "12px",
        fb: "8px",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      fontSize: {
        'h1': ['60px', { lineHeight: '1.1', fontWeight: '800' }],
        'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '500' }],
      },
      spacing: {
        '8': '8px',
        '16': '16px',
        '24': '24px',
        '32': '32px',
        '40': '40px',
        '48': '48px',
        '56': '56px',
        '64': '64px',
        '72': '72px',
        '80': '80px',
      },
      boxShadow: {
        fb: "0 1px 2px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.1)",
        "fb-hover": "0 2px 4px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.1)",
        "fb-dark": "0 1px 2px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.3)",
        "card-hover-light": "0 2px 4px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(0, 0, 0, 0.05)",
        "card-hover-dark": "0 2px 4px rgba(0, 0, 0, 0.3), 0 4px 8px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.1)",
        "sla-soft": "0 0 0 1px rgba(255, 77, 77, 0.15)",
      },
      animation: {
        "sla-pulse": "slaPulseSoft 2s ease-in-out infinite",
        "sla-pulse-dark": "slaPulseDark 2s ease-in-out infinite",
        "sync-pulse": "syncPulse 2s ease-in-out infinite",
        spin: "spin 1s linear infinite",
      },
      keyframes: {
        slaPulseSoft: {
          "0%": { boxShadow: "0 0 0 0 rgba(255, 77, 77, 0.7)" },
          "70%": { boxShadow: "0 0 0 10px rgba(255, 77, 77, 0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(255, 77, 77, 0)" },
        },
        slaPulseDark: {
          "0%": { boxShadow: "0 0 0 0 rgba(255, 107, 107, 0.5)" },
          "70%": { boxShadow: "0 0 0 12px rgba(255, 107, 107, 0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(255, 107, 107, 0)" },
        },
        syncPulse: {
          "0%": { transform: "scale(1)", opacity: "0.8" },
          "50%": { transform: "scale(1.05)", opacity: "0.4" },
          "100%": { transform: "scale(1)", opacity: "0.8" },
        },
        spin: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },
    },
  },
  plugins: [],
}
