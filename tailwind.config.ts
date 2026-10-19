import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#0A1628",
          900: "#0F1E33",
          800: "#16294A",
          700: "#1E3A5F",
        },
        accent: {
          DEFAULT: "#10B981",
          dark: "#0B8A5F",
          light: "#D1FAE5",
        },
        ink: "#0F172A",
        muted: "#64748B",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 3px rgba(10,22,40,0.08), 0 4px 16px rgba(10,22,40,0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
