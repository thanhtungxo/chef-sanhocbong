const { fontFamily } = require("tailwindcss/defaultTheme");

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
        heading: ["var(--font-heading)", ...fontFamily.sans],
      },
      borderRadius: {
        DEFAULT: "8px",
        secondary: "4px",
        container: "12px",
      },
      boxShadow: {
        DEFAULT: "0 1px 4px rgba(0, 0, 0, 0.1)",
        hover: "0 2px 8px rgba(0, 0, 0, 0.12)",
      },
      colors: {
        /* Shadcn UI token mapping to brand variables */
        border: "rgb(229 231 235 / <alpha-value>)", // gray-200
        input: "rgb(229 231 235 / <alpha-value>)",
        ring: "rgb(var(--color-primary-rgb) / <alpha-value>)",
        background: "rgb(var(--color-neutral-light-rgb) / <alpha-value>)",
        foreground: "rgb(var(--color-neutral-dark-rgb) / <alpha-value>)",

        primary: {
          DEFAULT: "rgb(var(--color-primary-rgb) / <alpha-value>)",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "rgb(var(--color-secondary-rgb) / <alpha-value>)",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "rgb(239 68 68 / <alpha-value>)", // red-500
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "rgb(var(--color-neutral-light-rgb) / <alpha-value>)",
          foreground: "rgb(107 114 128 / <alpha-value>)", // gray-500
        },
        accent: {
          DEFAULT: "rgb(var(--color-accent-orange-rgb) / <alpha-value>)",
          foreground: "#ffffff",
        },
        popover: {
          DEFAULT: "rgb(var(--color-neutral-light-rgb) / <alpha-value>)",
          foreground: "rgb(var(--color-neutral-dark-rgb) / <alpha-value>)",
        },
        card: {
          DEFAULT: "rgb(var(--color-neutral-light-rgb) / <alpha-value>)",
          foreground: "rgb(var(--color-neutral-dark-rgb) / <alpha-value>)",
        },
      },
      spacing: {
        "form-field": "16px",
        section: "32px",
      },
    },
  },
};
