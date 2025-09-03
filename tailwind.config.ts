// tailwind.config.ts
import type { Config } from "tailwindcss";


const config: Config = {
    content: [
        "./app/**/*.{ts,tsx}",
        "./components/**/*.{ts,tsx}",
        "./lib/**/*.{ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                sand: "#EFE7DD",
                terracotta: "#C36B5E",
                sage: "#B9C4B1",
                clay: "#9E6B56",
                charcoal: "#3E3A39",
            },
            borderRadius: {
                xl: "1rem",
                "2xl": "1.25rem",
            }
        },
    },
    plugins: [],
};
export default config;