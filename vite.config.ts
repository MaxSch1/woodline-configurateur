import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Chemins d'assets RELATIFS. Avec la valeur par defaut ("/"), un dist/index.html
  // ouvert depuis le Finder cherche /assets/… a la racine du disque et rend une page
  // blanche. Combine au routeur a diese, l'application s'ouvre alors de partout :
  // serveur de dev, `npm run preview`, hebergement statique, ou double-clic.
  base: "./",
  plugins: [react()],
  server: { port: 5180, open: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
