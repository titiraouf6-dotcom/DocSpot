import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
        },
        primary: "#10B981",
        "primary-light": "#34D399",
        "primary-dark": "#059669",
        secondary: "#065f46",
        cta: "#10B981",
        danger: "#EF4444",
        warning: "#F59E0B",
        "gray-bg": "#F0FDF4",
        "gray-dark": "#064E3B",
        "gray-medium": "#065F46",
      },
      keyframes: {
        heartbeat: {
          "0%, 100%": { transform: "scale(1)" },
          "14%": { transform: "scale(1.1)" },
          "28%": { transform: "scale(1)" },
          "42%": { transform: "scale(1.1)" },
          "70%": { transform: "scale(1)" },
        },
        wave: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "20%": { transform: "rotate(-25deg)" },
          "40%": { transform: "rotate(10deg)" },
          "60%": { transform: "rotate(-15deg)" },
          "80%": { transform: "rotate(5deg)" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        heartbeat: "heartbeat 3s ease-in-out infinite",
        wave: "wave 1.5s ease-in-out",
        "fade-in-up": "fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) both",
        "scale-in": "scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-tajawal)", "sans-serif"],
        display: ["var(--font-manrope)", "var(--font-tajawal)", "sans-serif"],
      },
      boxShadow: {
        sm: "0 1px 3px 0 rgba(16, 185, 129, 0.06)",
        DEFAULT: "0 2px 8px 0 rgba(16, 185, 129, 0.08)",
        md: "0 4px 16px -2px rgba(16, 185, 129, 0.12)",
        lg: "0 10px 30px -4px rgba(16, 185, 129, 0.15)",
        xl: "0 20px 50px -8px rgba(16, 185, 129, 0.18)",
        "2xl": "0 25px 60px -12px rgba(16, 185, 129, 0.28)",
        card: "0 2px 12px rgba(6, 78, 59, 0.06)",
        "card-hover": "0 8px 32px rgba(6, 78, 59, 0.1)",
        glow: "0 0 20px rgba(16, 185, 129, 0.25)",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      backdropBlur: {
        xs: "4px",
      },
    },
  },
  plugins: [],
};

export default config;
