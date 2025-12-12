/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      colors: {
        paper: "#F7F5F2",
        stone: {
          50: "#FAFAF9",
          100: "#EBE9E4",
          200: "#D6D3D1",
          300: "#B8B2AC",
          400: "#A8A29E",
          500: "#78716C",
          600: "#5C584E",
          700: "#454139",
          800: "#2E2B26",
          900: "#23211F",
          950: "#141210",
        },
        bronze: "#9C8666",
        olive: "#5F5B4C"
      }
    },
  },
  plugins: [],
};