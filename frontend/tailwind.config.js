/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surqo: {
          green: "#22C55E",
          "green-bright": "#4ADE80",
          "green-glow": "#16A34A",
          "green-dim": "#15803D",
          earth: "#92400E",
          "earth-light": "#D97706",
          sky: "#38BDF8",
          warning: "#FCD34D",
          danger: "#F87171",
          bg: "#030B05",
          "bg-surface": "#0A1A0F",
          "bg-elevated": "#0F2418",
          "border": "rgba(34,197,94,0.12)",
          "text": "#F0FDF4",
          "text-secondary": "rgba(240, 253, 244, 0.5)",
          "text-muted": "rgba(240, 253, 244, 0.25)",
        },
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "shimmer": "shimmer 2.5s linear infinite",
        "float": "float 6s ease-in-out infinite",
        "scan": "scan 4s linear infinite",
        "fade-up": "fade-up 0.5s ease-out forwards",
        "spin-slow": "spin 8s linear infinite",
        "mesh": "mesh 15s ease-in-out infinite alternate",
        "spotlight": "spotlight 10s ease-in-out infinite alternate",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(34,197,94,0)" },
          "50%": { boxShadow: "0 0 24px 6px rgba(34,197,94,0.25)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        mesh: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        spotlight: {
          "0%": { transform: "translate(-20%, -20%) scale(1)" },
          "100%": { transform: "translate(20%, 20%) scale(1.2)" },
        },
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(34,197,94,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.04) 1px, transparent 1px)",
        "grid-pattern-dense":
          "linear-gradient(rgba(34,197,94,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.06) 1px, transparent 1px)",
        "hero-gradient":
          "radial-gradient(ellipse 80% 80% at 50% -20%, rgba(34,197,94,0.15), transparent)",
        "card-gradient":
          "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
        "green-gradient":
          "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
        "shimmer-gradient":
          "linear-gradient(90deg, transparent 0%, rgba(34,197,94,0.08) 50%, transparent 100%)",
      },
      backgroundSize: {
        grid: "48px 48px",
        "grid-sm": "24px 24px",
      },
      boxShadow: {
        "glow-sm": "0 0 12px rgba(34,197,94,0.2)",
        "glow-md": "0 0 24px rgba(34,197,94,0.3)",
        "glow-lg": "0 0 48px rgba(34,197,94,0.25)",
        "card": "0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
        "card-hover": "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(34,197,94,0.2)",
        "inner-glow": "inset 0 1px 0 rgba(255,255,255,0.05)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
