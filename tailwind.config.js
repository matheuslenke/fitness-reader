/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  prefix: "tw-",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Montserrat", "sans-serif"],
      },
      colors: {
        background: "#0f172a",
        surface: "#1e293b",
        primary: {
          DEFAULT: "#bef264",
          hover: "#a3e635",
          dim: "rgba(190, 242, 100, 0.1)",
        },
        secondary: "#a855f7",
        danger: "#ef4444",
      },
      backgroundImage: {
        "active-gradient": "linear-gradient(135deg, #bef264 0%, #84cc16 100%)",
      },
    },
  },
  plugins: [],
};
