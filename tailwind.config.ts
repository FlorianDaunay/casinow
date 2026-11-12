import type { Config } from "tailwindcss";
import { tailwindThemeExtension } from "./src/themes/tailwind";

const extension = tailwindThemeExtension() as unknown as Record<string, Record<string, unknown>>;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      ...extension,
      fontFamily: {
        ...extension.fontFamily,
        // Fixed brand typography (not theme tokens): the casino keeps its voice in every theme.
        display: ['"Bodoni Moda"', "Didot", "serif"],
        deco: ['"Josefin Sans"', "sans-serif"],
        serif: ['"Cormorant Garamond"', "Georgia", "serif"],
      },
    },
  },
} satisfies Config;
