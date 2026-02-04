/** @type {import('tailwindcss').Config} */
const tailwindConfig = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // base: {
        //   white: "var(--base-white)",
        //   black: "var(--base-black)",
        // },
        primary: {
          100: "var(--primary-100)",
          200: "var(--primary-200)",
          300: "var(--primary-300)",
          400: "var(--primary-400)",
          test: "var(--primary-500)",
          600: "var(--primary-600)",
          700: "var(--primary-700)",
          800: "var(--primary-800)",
          900: "var(--primary-900)",
          1000: "var(--primary-1000)",
        },
        secondary: {
          100: "var(--secondary-100)",
          200: "var(--secondary-200)",
          300: "var(--secondary-300)",
          400: "var(--secondary-400)",
          500: "var(--secondary-500)",
          600: "var(--secondary-600)",
          700: "var(--secondary-700)",
          800: "var(--secondary-800)",
          900: "var(--secondary-900)",
          1000: "var(--secondary-1000)",
        },
        tertiary: {
          100: "var(--tertiary-100)",
          200: "var(--tertiary-200)",
          300: "var(--tertiary-300)",
          400: "var(--tertiary-400)",
          500: "var(--tertiary-500)",
          600: "var(--tertiary-600)",
          700: "var(--tertiary-700)",
          800: "var(--tertiary-800)",
          900: "var(--tertiary-900)",
          1000: "var(--tertiary-1000)",
        },
        neutral: {
          100: "var(--neutral-100)",
          200: "var(--neutral-200)",
          300: "var(--neutral-300)",
          400: "var(--neutral-400)",
          500: "var(--neutral-500)",
          600: "var(--neutral-600)",
          700: "var(--neutral-700)",
          800: "var(--neutral-800)",
          900: "var(--neutral-900)",
          1000: "var(--neutral-1000)",
        },
        success: {
          100: "var(--success-100)",
          200: "var(--success-200)",
          300: "var(--success-300)",
        },
        warning: {
          100: "var(--warning-100)",
          200: "var(--warning-200)",
          300: "var(--warning-300)",
        },
        error: {
          100: "var(--error-100)",
          200: "var(--error-200)",
          300: "var(--error-300)",
        },
      },
    },
  },
  plugins: [],
};

export default tailwindConfig;
