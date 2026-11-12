import { defineTheme } from "../define";

export default defineTheme({
  id: "maison-noire",
  name: "Maison Noire",
  description: "Warm black lacquer, brushed gold and ivory: a 1920s private club.",
  scheme: "dark",
  colors: {
    canvas: "#0A0907",
    surface: "#13110D",
    surfaceHover: "#1C1913",
    border: "#C9A55A2E",
    textPrimary: "#F1E7D2",
    textSecondary: "#C7BBA2",
    textMuted: "#8A806D",
    accent: "#C9A55A",
    accentForeground: "#120F09",
    success: "#4FA585",
    warning: "#D9A441",
    danger: "#B5463F",
  },
  radius: { control: "2px", tile: "4px", card: "6px", pill: "9999px" },
  shadow: {
    card: "0 0 0 1px rgb(201 165 90 / 0.14), 0 18px 40px -18px rgb(0 0 0 / 0.9)",
    overlay: "0 0 0 1px rgb(201 165 90 / 0.25), 0 30px 80px -20px rgb(0 0 0 / 0.95)",
    control: "inset 0 1px 0 rgb(255 240 200 / 0.35), 0 6px 18px -8px rgb(201 165 90 / 0.6)",
    inset: "inset 0 2px 6px rgb(0 0 0 / 0.6)",
  },
  fonts: { sans: '"Josefin Sans", "Segoe UI", sans-serif' },
});
