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
    // Official artwork and sprites are served from the PokéAPI sprites repo.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/PokeAPI/sprites/**",
      },
    ],
  },

  experimental: {
    // Smaller client bundles: only the icons/animations actually used are pulled in.
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
