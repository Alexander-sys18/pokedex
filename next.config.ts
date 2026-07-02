import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output keeps the production image small and lets Render/Docker
  // run the app with a single `node server.js` (see Dockerfile).
  output: "standalone",

  // The generated Pokédex index lives outside the JS bundle and is read at
  // runtime with `fs`. Force Next's file tracer to ship it in the standalone
  // build so the home page can read it inside the container.
  outputFileTracingIncludes: {
    "/": ["./src/data/pokedex.generated.json"],
  },

  images: {
    // Sprite/artwork URLs are immutable (content-addressed by dex id), so the
    // optimizer can keep its transformed copies for a month without re-fetching.
    minimumCacheTTL: 2_678_400,
    remotePatterns: [
      // Official artwork and sprites are served from the PokéAPI sprites repo.
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/PokeAPI/sprites/**",
      },
      // Trading-card scans (Spanish) from TCGdex.
      {
        protocol: "https",
        hostname: "assets.tcgdex.net",
      },
      // Professor Oak trainer sprite (chat assistant avatar).
      {
        protocol: "https",
        hostname: "play.pokemonshowdown.com",
        pathname: "/sprites/**",
      },
    ],
  },

  experimental: {
    // Smaller client bundles: only the icons actually used are pulled in.
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
