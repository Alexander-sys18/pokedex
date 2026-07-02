import type { MetadataRoute } from "next";

/**
 * Web App Manifest — makes the Pokédex installable (PWA). Next.js serves this
 * at /manifest.webmanifest and links it automatically from every page.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pokédex · Explorador en tiempo real",
    short_name: "Pokédex",
    description:
      "Explora los 1025 Pokémon: busca con evoluciones, filtra por tipo y generación, compara y arma tu equipo.",
    start_url: "/",
    display: "standalone",
    background_color: "#08090d",
    theme_color: "#08090d",
    lang: "es",
    categories: ["education", "entertainment", "games"],
    icons: [
      { src: "/icon-app.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-app.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
