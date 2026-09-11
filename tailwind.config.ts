import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./features/**/*.{js,ts,jsx,tsx}", // include features folder
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-poppins)", "var(--font-lato)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
