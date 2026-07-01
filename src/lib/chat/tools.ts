import "server-only";
import { primaryTypeColor } from "@/lib/pokedex/colors";
import {
  GENERATION_REGIONS,
  POKEMON_TYPES,
  STAT_LABELS_ES,
  TYPE_LABELS_ES,
  generationLabel,
} from "@/lib/pokedex/constants";
import { getPokemonDetail } from "@/lib/pokedex/detail";
import { eggGroupLabel, locationLabel, versionLabel } from "@/lib/pokedex/labels";
import { getPokedex } from "@/lib/pokedex";
import type { EvolutionNode, PokemonTypeName } from "@/lib/pokedex/types";
import { normalizeSearch, prettifyName } from "@/lib/utils";

/** Anthropic tool definitions the model can call (Spanish domain vocabulary). */
export const CHAT_TOOLS = [
  {
    name: "buscar_pokemon",
    description:
      "Busca Pokémon en la Pokédex por nombre (parcial), tipo y/o generación. Devuelve una " +
      "lista con id, nombre, tipos y generación. Úsalo para encontrar candidatos o resolver a " +
      "qué Pokémon se refiere el usuario. No incluye estadísticas: para stats usa detalle_pokemon.",
    input_schema: {
      type: "object" as const,
      properties: {
        nombre: { type: "string", description: "Texto del nombre a buscar (parcial)." },
        tipo: {
          type: "string",
          enum: [...POKEMON_TYPES],
          description: "Tipo en inglés (p. ej. fire, water, dragon).",
        },
        generacion: { type: "integer", minimum: 1, maximum: 9 },
        limite: {
          type: "integer",
          minimum: 1,
          maximum: 50,
          description: "Máximo de resultados (def. 20).",
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "detalle_pokemon",
    description:
      "Devuelve la ficha completa de UN Pokémon (por nombre o id): generación, tipos, " +
      "estadísticas base y total, altura, peso, habilidades, descripción y evoluciones. " +
      "Úsalo para responder sobre un Pokémon concreto o comparar (una llamada por Pokémon).",
    input_schema: {
      type: "object" as const,
      properties: {
        nombre_o_id: {
          type: "string",
          description: "Nombre (p. ej. 'pikachu') o id (p. ej. '25').",
        },
      },
      required: ["nombre_o_id"],
      additionalProperties: false,
    },
  },
] as const;

export interface ToolResult {
  content: string;
  /** Pokémon surfaced by this call, to render as clickable chips. */
  pokemon: { id: number; name: string }[];
}

/** Resolve a name-or-id string to a national dex id using the prebuilt index. */
async function resolveId(nameOrId: string): Promise<number | null> {
  const trimmed = nameOrId.trim();
  // Accept dex formats the app itself displays: "25", "#25", "025", "#0025".
  const numeric = trimmed.replace(/^#/, "").replace(/^0+(?=\d)/, "");
  if (/^\d+$/.test(numeric)) {
    const id = Number(numeric);
    return id >= 1 && id <= 1025 ? id : null;
  }
  const pokedex = await getPokedex();
  const query = normalizeSearch(trimmed);
  if (!query) return null;
  const exact = pokedex.entries.find((e) => normalizeSearch(e.name) === query);
  if (exact) return exact.id;
  const partial = pokedex.entries.find((e) => normalizeSearch(e.name).includes(query));
  return partial?.id ?? null;
}

async function buscarPokemon(input: Record<string, unknown>): Promise<ToolResult> {
  const pokedex = await getPokedex();
  const nombre = typeof input.nombre === "string" ? normalizeSearch(input.nombre) : "";
  const tipo =
    typeof input.tipo === "string" && (POKEMON_TYPES as readonly string[]).includes(input.tipo)
      ? (input.tipo as PokemonTypeName)
      : null;
  const generacion = typeof input.generacion === "number" ? input.generacion : null;
  const limite = Math.min(50, Math.max(1, typeof input.limite === "number" ? input.limite : 20));

  let results = pokedex.entries;
  if (nombre) results = results.filter((e) => normalizeSearch(e.name).includes(nombre));
  if (tipo) results = results.filter((e) => e.types.includes(tipo));
  if (generacion) results = results.filter((e) => e.generation === generacion);

  const total = results.length;
  const shown = results.slice(0, limite).map((e) => ({
    id: e.id,
    nombre: prettifyName(e.name),
    tipos: e.types.map((t) => TYPE_LABELS_ES[t]),
    generacion: generationLabel(e.generation),
  }));

  // Broad searches don't emit chips (too noisy) — only detalle_pokemon does.
  return {
    content: JSON.stringify({ total, mostrados: shown.length, resultados: shown }),
    pokemon: [],
  };
}

async function detallePokemon(input: Record<string, unknown>): Promise<ToolResult> {
  const nombreOId = typeof input.nombre_o_id === "string" ? input.nombre_o_id : "";
  const id = await resolveId(nombreOId);
  if (id === null) {
    return {
      content: JSON.stringify({ error: `No se encontró ningún Pokémon para "${nombreOId}".` }),
      pokemon: [],
    };
  }
  const detail = await getPokemonDetail(id);
  if (!detail) {
    return { content: JSON.stringify({ error: `No hay datos para el id ${id}.` }), pokemon: [] };
  }

  const evoluciones: string[] = [];
  const walk = (node: EvolutionNode | null): void => {
    if (!node) return;
    evoluciones.push(prettifyName(node.name));
    node.children.forEach(walk);
  };
  walk(detail.evolutionRoot);

  const compact = {
    id: detail.id,
    nombre: prettifyName(detail.name),
    categoria: detail.genus,
    generacion: generationLabel(detail.generation),
    region: GENERATION_REGIONS[detail.generation],
    tipos: detail.types.map((t) => TYPE_LABELS_ES[t]),
    color: primaryTypeColor(detail.types),
    estadisticas: Object.fromEntries(
      detail.stats.map((s) => [STAT_LABELS_ES[s.name] ?? s.name, s.base]),
    ),
    total_estadisticas: detail.statTotal,
    altura_m: detail.heightMeters,
    peso_kg: detail.weightKilograms,
    habilidades: detail.abilities.map((a) =>
      a.hidden ? `${prettifyName(a.name)} (oculta)` : prettifyName(a.name),
    ),
    es_legendario: detail.isLegendary,
    es_singular: detail.isMythical,
    ratio_captura: detail.captureRate !== null ? `${detail.captureRate}/255` : null,
    grupos_huevo: detail.eggGroups.map(eggGroupLabel),
    descripcion: detail.description,
    familia_evolutiva: evoluciones,
    donde_encontrar:
      detail.encounters.length > 0
        ? detail.encounters.slice(0, 4).map((e) => ({
            juego: versionLabel(e.version),
            lugares: e.locations.slice(0, 3).map(locationLabel),
          }))
        : "La PokéAPI no registra localizaciones salvajes para este Pokémon. Puede que no aparezca " +
          "salvaje (se obtiene evolucionando, por intercambio o eventos) o que sus juegos aún no " +
          "tengan datos de encuentros (p. ej. Escarlata/Púrpura). Indica esta incertidumbre al responder.",
    curiosidades: detail.flavorEntries.slice(0, 2).map((f) => f.text),
  };

  return {
    content: JSON.stringify(compact),
    pokemon: [{ id: detail.id, name: prettifyName(detail.name) }],
  };
}

export async function runTool(name: string, input: unknown): Promise<ToolResult> {
  const args = (input ?? {}) as Record<string, unknown>;
  try {
    if (name === "buscar_pokemon") return await buscarPokemon(args);
    if (name === "detalle_pokemon") return await detallePokemon(args);
    return { content: JSON.stringify({ error: `Herramienta desconocida: ${name}` }), pokemon: [] };
  } catch (error) {
    return {
      content: JSON.stringify({ error: `Fallo al ejecutar ${name}: ${String(error)}` }),
      pokemon: [],
    };
  }
}
