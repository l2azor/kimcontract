import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Legal Futurism Color Palette - High Contrast
        'crystal-white': '#FFFFFF',
        'glass-blue': '#F0F9FF',
        'ice-blue': '#E0F2FE',
        'steel-blue': '#0369A1',
        'deep-ocean': '#0C4A6E',
        'midnight': '#082F49',
        'text-dark': '#0F172A',
        'blockchain-green': '#10B981',
        'verification-cyan': '#06B6D4',
        'signature-gold': '#F59E0B',
        'error-red': '#EF4444',
        'glass-bg': 'rgba(255, 255, 255, 0.95)',
        'glass-border': 'rgba(6, 182, 212, 0.3)',
        'glass-shadow': 'rgba(15, 23, 42, 0.15)',
      },
      fontFamily: {
        display: ['IBM Plex Sans', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
