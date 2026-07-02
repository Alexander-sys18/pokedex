export function SiteFooter() {
  return (
    // pb-16 on mobile: keep the footer text above the fixed bottom tab bar.
    <footer className="border-border border-t pb-16 sm:pb-0">
      <div className="text-muted-foreground mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-center text-xs sm:flex-row sm:px-6 sm:text-left">
        <p>
          Datos de{" "}
          <a
            href="https://pokeapi.co"
            target="_blank"
            rel="noreferrer"
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            PokéAPI
          </a>
          . Prueba técnica · Next.js + TypeScript.
        </p>
        <p>Pokémon © Nintendo / Game Freak. Uso educativo.</p>
      </div>
    </footer>
  );
}
