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
        bg: "#07080f",
        s1: "#0e0f1a",
        s2: "#141526",
        s3: "#1c1d30",
        accent: "#7c6cfc",
        a2: "#00e8a2",
        a3: "#ff5f7e",
        a4: "#fbbf24",
        a5: "#38bdf8",
        text: "#eeeeff",
        muted: "#5d5d7d",
        muted2: "#8e8eae",
      },
      borderColor: {
        DEFAULT: "rgba(255,255,255,0.06)",
        "border2": "rgba(255,255,255,0.11)",
      },
      fontFamily: {
        syne: ["var(--font-syne)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      borderRadius: {
        card: "14px",
        btn: "10px",
        input: "8px",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideRight: {
          "0%": { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
      animation: {
        fadeUp: "fadeUp 400ms ease forwards",
        fadeIn: "fadeIn 200ms ease forwards",
        slideRight: "slideRight 300ms ease forwards",
        shimmer: "shimmer 1.5s linear infinite",
        blink: "blink 1s step-end infinite",
        pulse: "pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
