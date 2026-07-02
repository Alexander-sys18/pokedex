import "server-only";
import { cache } from "react";
import {
  generationNumberFromName,
  idFromUrl,
  NonRetryableHttpError,
  pokeFetch,
} from "@/lib/pokeapi/client";
import {
  encountersSchema,
  evolutionChainSchema,
  localizedNamesSchema,
  pokemonSchema,
  pokemonSpeciesSchema,
  type ChainLink,
  type EvolutionDetail,
} from "@/lib/pokeapi/schemas";
import { normalizeSearch, prettifyName } from "@/lib/utils";
import { POKEMON_TYPES, STAT_ORDER, TYPE_LABELS_ES } from "./constants";
import { evolutionItemLabel, locationLabel, VERSION_ORDER } from "./labels";
import type {
  EvolutionNode,
  FlavorEntry,
  PokemonDetail,
  PokemonTypeName,
  StatValue,
  VersionEncounters,
} from "./types";

const REVALIDATE = Number(process.env.POKEAPI_REVALIDATE_SECONDS ?? 86_400);
const KNOWN_TYPES = new Set<string>(POKEMON_TYPES);

/** Compose a compact Spanish label for how a link evolves from its parent.
 *  Exported for unit tests — this is the gnarliest formatting logic here. */
export function evolutionMethodLabel(details: EvolutionDetail[] | undefined): string | null {
  const d = details?.[0];
  if (!d) return null;
  const trigger = d.trigger?.name ?? "level-up";

  if (trigger === "use-item" && d.item) return evolutionItemLabel(d.item.name);
  if (trigger === "trade") {
    if (d.held_item) return `Intercambio con ${evolutionItemLabel(d.held_item.name)}`;
    if (d.trade_species) return `Intercambio por ${prettifyName(d.trade_species.name)}`;
    return "Intercambio";
  }
  if (trigger === "shed") return "Nivel 20 (hueco en el equipo)";
  if (trigger === "three-critical-hits") return "3 críticos en un combate";

  if (trigger === "level-up") {
    const parts: string[] = [];
    if (d.min_level != null) parts.push(`Nivel ${d.min_level}`);
    if (d.min_happiness != null) parts.push("Amistad alta");
    if (d.min_affection != null) parts.push("Cariño alto");
    if (d.min_beauty != null) parts.push("Belleza alta");
    if (d.known_move_type)
      parts.push(
        `mov. de tipo ${TYPE_LABELS_ES[d.known_move_type.name as PokemonTypeName] ?? prettifyName(d.known_move_type.name)}`,
      );
    else if (d.known_move) parts.push(`sabiendo ${prettifyName(d.known_move.name)}`);
    if (d.held_item) parts.push(`equipando ${evolutionItemLabel(d.held_item.name)}`);
    if (d.location) parts.push(`en ${locationLabel(d.location.name)}`);
    if (d.time_of_day === "day") parts.push("de día");
    if (d.time_of_day === "night") parts.push("de noche");
    if (d.needs_overworld_rain) parts.push("con lluvia");
    return parts.length > 0 ? parts.join(", ") : "Subir de nivel";
  }

  // Hisui styles, Gimmighoul coins, etc. — keep it honest and generic.
  return "Método especial";
}

function toEvolutionNode(link: ChainLink): EvolutionNode {
  return {
    id: idFromUrl(link.species.url),
    name: link.species.name,
    method: evolutionMethodLabel(link.evolution_details),
    children: link.evolves_to.map(toEvolutionNode),
  };
}

function collectFamilyIds(node: EvolutionNode, out: number[]): void {
  out.push(node.id);
  node.children.forEach((child) => collectFamilyIds(child, out));
}

/** Flavor text is littered with control chars (\n, \f, soft hyphens). */
function cleanFlavor(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

type RawFlavorEntry = {
  flavor_text: string;
  language: { name: string };
  version?: { name: string } | null;
};

/** Pick the main localized description (Spanish preferred, English fallback). */
function pickDescription(entries: RawFlavorEntry[]): string | null {
  const preferred =
    entries.find((e) => e.language.name === "es") ?? entries.find((e) => e.language.name === "en");
  return preferred ? cleanFlavor(preferred.flavor_text) : null;
}

/**
 * Collect distinct Pokédex entries across games ("curiosidades"): Spanish when
 * available, English otherwise; deduplicated by normalized text.
 */
function collectFlavorEntries(
  entries: RawFlavorEntry[],
  excludeText: string | null,
): FlavorEntry[] {
  const collect = (lang: string): FlavorEntry[] => {
    const seen = new Set<string>();
    if (excludeText) seen.add(normalizeSearch(excludeText));
    const out: FlavorEntry[] = [];
    for (const entry of entries) {
      if (entry.language.name !== lang) continue;
      const text = cleanFlavor(entry.flavor_text);
      const key = normalizeSearch(text);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push({ text, version: entry.version?.name ?? null });
      if (out.length >= 6) break;
    }
    return out;
  };

  const spanish = collect("es");
  return spanish.length > 0 ? spanish : collect("en");
}

/** Pivot the encounters payload into per-version location lists, newest first. */
function groupEncounters(
  raw: { location_area: { name: string }; version_details: { version: { name: string } }[] }[],
): VersionEncounters[] {
  const byVersion = new Map<string, Set<string>>();
  for (const area of raw) {
    for (const detail of area.version_details) {
      const set = byVersion.get(detail.version.name) ?? new Set<string>();
      set.add(area.location_area.name);
      byVersion.set(detail.version.name, set);
    }
  }
  return [...byVersion.entries()]
    .sort((a, b) => VERSION_ORDER.indexOf(b[0]) - VERSION_ORDER.indexOf(a[0]))
    .map(([version, locations]) => ({ version, locations: [...locations] }));
}

function orderStats(stats: { base_stat: number; stat: { name: string } }[]): StatValue[] {
  const byName = new Map(stats.map((s) => [s.stat.name, s.base_stat]));
  return STAT_ORDER.map((name) => ({ name, base: byName.get(name) ?? 0 }));
}

/**
 * Localized display name for an ability/item ("static" → "Elec. Estática").
 * Pure enrichment: any failure falls back to the prettified English slug.
 */
async function localizedResourceName(path: string, fallbackSlug: string): Promise<string> {
  try {
    const data = await pokeFetch(path, localizedNamesSchema, { revalidate: REVALIDATE });
    return (
      data.names.find((n) => n.language.name === "es")?.name ??
      data.names.find((n) => n.language.name === "en")?.name ??
      prettifyName(fallbackSlug)
    );
  } catch {
    return prettifyName(fallbackSlug);
  }
}

/** Variety slugs need a couple of Spanish/typographic fixes on top of the
 *  generic prettifier ("eevee-gmax" → "Eevee Gigamax", not "Eevee Gmax"). */
export function prettifyVariety(slug: string): string {
  return prettifyName(slug)
    .replace(/\bGmax\b/, "Gigamax")
    .replace(/\bPhd\b/, "PhD");
}

/**
 * Fetch everything the detail page needs, live from PokéAPI (ISR-cached).
 * Returns `null` for an unknown id so the page can render a 404.
 *
 * Wrapped in React `cache()` so `generateMetadata` and the page component share
 * a single fetch per request instead of hitting PokéAPI twice.
 */
export const getPokemonDetail = cache(async (id: number): Promise<PokemonDetail | null> => {
  try {
    const [pokemon, species, rawEncounters] = await Promise.all([
      pokeFetch(`/pokemon/${id}`, pokemonSchema, { revalidate: REVALIDATE }),
      pokeFetch(`/pokemon-species/${id}`, pokemonSpeciesSchema, { revalidate: REVALIDATE }),
      // Encounters are enrichment — never fail the page because of them.
      pokeFetch(`/pokemon/${id}/encounters`, encountersSchema, {
        revalidate: REVALIDATE,
      }).catch(() => []),
    ]);

    let evolutionRoot: EvolutionNode | null = null;
    if (species.evolution_chain) {
      const chain = await pokeFetch(species.evolution_chain.url, evolutionChainSchema, {
        revalidate: REVALIDATE,
      });
      evolutionRoot = toEvolutionNode(chain.chain);
    }

    const familyIds: number[] = [];
    if (evolutionRoot) collectFamilyIds(evolutionRoot, familyIds);

    const types = pokemon.types
      .sort((a, b) => a.slot - b.slot)
      .map((t) => t.type.name)
      .filter((name): name is PokemonTypeName => KNOWN_TYPES.has(name));

    const stats = orderStats(pokemon.stats);
    const description = pickDescription(species.flavor_text_entries);

    // Spanish names for abilities and wild held items — the rest of the sheet
    // is fully localized, so these shouldn't be the exception.
    const [abilityNames, heldItemNames] = await Promise.all([
      Promise.all(
        pokemon.abilities.map((a) =>
          localizedResourceName(`/ability/${a.ability.name}`, a.ability.name),
        ),
      ),
      Promise.all(
        (pokemon.held_items ?? []).map((h) =>
          localizedResourceName(`/item/${h.item.name}`, h.item.name),
        ),
      ),
    ]);

    const genera = species.genera ?? [];
    const names = species.names ?? [];

    return {
      id: pokemon.id,
      // Species slug is cleaner than the default-form slug (e.g. "deoxys" not
      // "deoxys-normal"); it still resolves for the title and search.
      name: species.name,
      generation: generationNumberFromName(species.generation.name),
      types,
      stats,
      statTotal: stats.reduce((sum, s) => sum + s.base, 0),
      heightMeters: pokemon.height / 10,
      weightKilograms: pokemon.weight / 10,
      abilities: pokemon.abilities.map((a, index) => ({
        name: abilityNames[index] ?? prettifyName(a.ability.name),
        hidden: a.is_hidden,
      })),
      description,
      evolutionRoot,
      familyIds,

      genus:
        genera.find((g) => g.language.name === "es")?.genus ??
        genera.find((g) => g.language.name === "en")?.genus ??
        null,
      japaneseName:
        names.find((n) => n.language.name === "ja-Hrkt")?.name ??
        names.find((n) => n.language.name === "ja")?.name ??
        null,
      isLegendary: species.is_legendary ?? false,
      isMythical: species.is_mythical ?? false,
      isBaby: species.is_baby ?? false,
      flavorEntries: collectFlavorEntries(species.flavor_text_entries, description),

      baseExperience: pokemon.base_experience,
      captureRate: species.capture_rate ?? null,
      baseHappiness: species.base_happiness ?? null,
      growthRate: species.growth_rate?.name ?? null,
      evYield: pokemon.stats
        .filter((s) => s.effort > 0)
        .map((s) => ({ name: s.stat.name, value: s.effort })),
      heldItems: heldItemNames,

      eggGroups: (species.egg_groups ?? []).map((g) => g.name),
      genderRate: species.gender_rate ?? null,
      hatchCounter: species.hatch_counter ?? null,

      habitat: species.habitat?.name ?? null,
      color: species.color?.name ?? null,
      shape: species.shape?.name ?? null,

      cries: {
        latest: pokemon.cries?.latest ?? null,
        legacy: pokemon.cries?.legacy ?? null,
      },
      encounters: groupEncounters(rawEncounters),
      varieties: (species.varieties ?? [])
        .filter((v) => !v.is_default)
        .map((v) => ({ id: idFromUrl(v.pokemon.url), name: prettifyVariety(v.pokemon.name) })),
    };
  } catch (error) {
    if (error instanceof NonRetryableHttpError && error.status === 404) {
      return null;
    }
    throw error;
  }
});
