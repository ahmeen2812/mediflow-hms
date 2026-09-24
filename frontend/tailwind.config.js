/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        clinical: {
          navy: "#123A56",
          blue: "#176B9C",
          teal: "#0F766E",
          background: "#F5F7F9",
          border: "#D9E1E7",
          text: "#182B3A",
          muted: "#607383",
        },
        status: {
          success: "#16805B",
          warning: "#A66A00",
          critical: "#B42318",
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}