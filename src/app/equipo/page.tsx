import { Swords } from "lucide-react";
import type { Metadata } from "next";
import { TeamBuilder } from "@/components/team/team-builder";
import { getPokedex } from "@/lib/pokedex";

export const metadata: Metadata = {
  title: "Constructor de equipo",
  description:
    "Arma tu equipo de hasta 6 Pokémon y analiza sus debilidades compartidas, resistencias y cobertura ofensiva por tipos.",
};

export default async function TeamPage() {
  const pokedex = await getPokedex();

  return (
    <div className="flex flex-col gap-5">
      <section
        className="hero-panel border-border relative overflow-hidden rounded-3xl border p-5 sm:p-6"
        style={{ ["--type" as string]: "#ef4444" }}
      >
        <h1 className="text-foreground flex items-center gap-2.5 text-2xl font-bold tracking-tight sm:text-3xl">
          <Swords className="size-7" />
          Constructor de equipo
        </h1>
        <p className="text-muted-foreground mt-1.5 max-w-2xl text-sm sm:text-base">
          Elige hasta seis Pokémon y analiza el equilibrio de tipos del equipo: debilidades
          compartidas, resistencias y cobertura ofensiva. Se guarda en tu navegador.
        </p>
      </section>

      <TeamBuilder entries={pokedex.entries} />
    </div>
  );
}
