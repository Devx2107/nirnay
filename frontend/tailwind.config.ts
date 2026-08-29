import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff5f5",
          100: "#ffe3e3",
          500: "#dc2626",
          600: "#b91c1c",
          700: "#991b1b",
        },
      },
    },
  },
  plugins: [],
};

export default config;
