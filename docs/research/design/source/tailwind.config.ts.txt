import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    fontSize: {
      xs: ["var(--text-xs)", "1.5"],
      sm: ["var(--text-sm)", "1.6"],
      base: ["var(--text-base)", "1.7"],
      lg: ["var(--text-lg)", "1.6"],
      xl: ["var(--text-xl)", "1.4"],
      "2xl": ["var(--text-2xl)", "1.3"],
      "3xl": ["var(--text-3xl)", "1.25"],
      "4xl": ["var(--text-4xl)", "1.15"],
      "5xl": ["var(--text-5xl)", "1.05"],
    },
    extend: {
      colors: {
        primary: "var(--color-primary)",
        "primary-soft": "var(--color-primary-soft)",
        dark: "var(--color-dark)",
        accent: "var(--color-accent)",
        whatsapp: "var(--color-whatsapp)",
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        muted: "var(--color-muted)",
        border: "var(--color-border)",
      },
      borderRadius: {
        card: "var(--radius-card)",
        button: "var(--radius-button)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
      },
    },
  },
  plugins: [],
};

export default config;
