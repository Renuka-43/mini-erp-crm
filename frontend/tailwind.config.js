/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "hsl(220, 90%, 55%)",
        accent: "hsl(340, 80%, 55%)",
        surface: "hsl(0, 0%, 98%)",
        "surface-dark": "hsl(220, 10%, 12%)",
        brand: {
          50: "#f0f7ff",
          100: "#e0effe",
          200: "#c0defe",
          300: "#90c3ff",
          400: "#5faeff",
          500: "#0284c7",
          600: "#0369a1",
          700: "#075985",
          800: "#0c4a6e",
          900: "#0b3b5e",
        },
      },
    },
  },
  darkMode: "class",
  plugins: [],
};
