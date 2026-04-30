/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["'DM Mono'", "monospace"],
        serif: ["'Playfair Display'", "serif"],
      },
      colors: {
        ink: "#1a1410",
        parchment: "#f5f0e8",
        purple: {
          50: "#EEEDFE",
          200: "#AFA9EC",
          400: "#7F77DD",
          600: "#534AB7",
          800: "#3C3489",
        },
        teal: {
          50: "#E1F5EE",
          600: "#0F6E56",
          800: "#085041",
        },
      },
    },
  },
  plugins: [],
};
