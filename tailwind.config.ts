import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/js/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/css/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0d0d0f",
        surface: "#17181c",
        ink: "#f5f5f7",
        muted: "#9ca0ab",
        line: "#2b2d34",
        accent: "#f5f5f7",
      },
      boxShadow: {
        card: "0 18px 40px rgba(0, 0, 0, 0.28)",
      },
      borderRadius: {
        card: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
