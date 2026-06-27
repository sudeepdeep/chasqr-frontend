/** @type {import('tailwindcss').Config} */

// ─── Single source of truth for Tailwind color names ───────────────────────
// These map to the CSS variables in index.css.
// Opacity modifiers (bg-primary/50) work automatically via the RGB channel format.

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        bebas: ["Bebas Neue", "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          dark:    "rgb(var(--primary-dark) / <alpha-value>)",
          light:   "rgb(var(--primary-light) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          dark:    "rgb(var(--accent-dark) / <alpha-value>)",
          light:   "rgb(var(--accent-light) / <alpha-value>)",
        },
        // Keep these so existing Tailwind slate/green/red still work
      },
    },
  },
  plugins: [],
};
