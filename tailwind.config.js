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
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      colors: {
        paper: "#F7F5F2",
        ink: "#141210",
        champagne: "#E8DCC4",
        moss: "#3D3A2E",
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
      },
      borderRadius: {
        field: "14px",
        panel: "24px",
      },
      boxShadow: {
        editorial: "0 40px 80px -60px rgba(20, 18, 16, 0.12)",
        card: "0 10px 30px -24px rgba(20, 18, 16, 0.20)",
        floating: "0 24px 48px -28px rgba(20, 18, 16, 0.18)",
      },
      letterSpacing: {
        editorial: "0.22em",
      },
      transitionTimingFunction: {
        editorial: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
    },
  },
  plugins: [],
};
