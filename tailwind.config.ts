import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#32004d",
          card: "#500078",
          accent: "#500078",
          light: "#6b009f",
          dark: "#210340",
        },
      },
    },
  },
  plugins: [],
};
export default config;
