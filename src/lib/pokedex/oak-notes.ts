import { prettifyName } from "@/lib/utils";
import { GENERATION_REGIONS, STAT_LABELS_ES, TYPE_LABELS_ES, generationLabel } from "./constants";
import { habitatLabel } from "./labels";
import { defensiveGroups } from "./type-chart";
import type { PokemonDetail } from "./types";

/**
 * "Notas del Profesor Oak": lively Spanish prose composed deterministically
 * from the Pokémon's REAL data (stats, matchups, capture rate, physique).
 * Pure and testable — no AI call, no key required, zero latency.
 */
export function professorNotes(detail: PokemonDetail): string {
  const name = prettifyName(detail.name);
  const types = detail.types.map((t) => TYPE_LABELS_ES[t]).join("/");
  const sentences: string[] = [];

  // Identity + origin.
  const genus = detail.genus ? `, ${detail.genus.toLowerCase()},` : "";
  sentences.push(
    `¡Ah, ${name}! Este Pokémon de tipo ${types}${genus} quedó registrado por primera vez en la región de ${GENERATION_REGIONS[detail.generation]} (${generationLabel(detail.generation)}).`,
  );

  // Combat profile: best stat + base total tier.
  const best = [...detail.stats].sort((a, b) => b.base - a.base)[0];
  if (best) {
    const tier =
      detail.statTotal >= 600
        ? "lo sitúa entre la élite de la Pokédex"
        : detail.statTotal >= 500
          ? "lo hace un ejemplar muy competitivo"
          : detail.statTotal >= 400
            ? "le da un perfil equilibrado"
            : "deja claro que aún tiene margen para crecer — entrénalo con cariño";
    sentences.push(
      `En combate su punto fuerte es ${(STAT_LABELS_ES[best.name] ?? best.name).toLowerCase()} (${best.base}), y un total base de ${detail.statTotal} puntos ${tier}.`,
    );
  }

  // Tactical note: quadruple weaknesses first; otherwise immunities.
  const groups = defensiveGroups(detail.types);
  if (groups.x4.length > 0) {
    sentences.push(
      `Un consejo de viejo investigador: los ataques de tipo ${groups.x4.map((t) => TYPE_LABELS_ES[t]).join(" y ")} le hacen daño ×4, así que cúbrele bien esa espalda.`,
    );
  } else if (groups.zero.length > 0) {
    sentences.push(
      `Dato táctico: es inmune al tipo ${groups.zero.map((t) => TYPE_LABELS_ES[t]).join(" y al ")}, algo que un buen entrenador sabe aprovechar.`,
    );
  }

  // How hard it is to catch.
  if (detail.captureRate !== null) {
    if (detail.captureRate <= 10) {
      sentences.push(
        `Capturarlo es una gesta (ratio ${detail.captureRate}/255): lleva tus mejores Poké Balls y mucha paciencia.`,
      );
    } else if (detail.captureRate <= 45) {
      sentences.push(`No se dejará atrapar a la primera: su ratio de captura es ${detail.captureRate}/255.`);
    } else if (detail.captureRate >= 200) {
      sentences.push(
        `Con un ratio de captura de ${detail.captureRate}/255, se unirá a tu equipo casi sin resistirse.`,
      );
    }
  }

  // Physique / rarity / habitat flavor (at most one, in priority order).
  if (detail.isLegendary || detail.isMythical) {
    sentences.push(
      `Y recuerda: estás ante un Pokémon ${detail.isLegendary ? "legendario" : "singular"} — verlo siquiera una vez ya es un privilegio de entrenador.`,
    );
  } else if (detail.weightKilograms >= 200) {
    sentences.push(
      `Con sus ${detail.weightKilograms.toLocaleString("es-ES")} kg es de los auténticos pesos pesados de la Pokédex.`,
    );
  } else if (detail.heightMeters <= 0.3) {
    sentences.push(`Y con apenas ${detail.heightMeters.toLocaleString("es-ES")} m, ¡cabría en la palma de tu mano!`);
  } else if (detail.isBaby) {
    sentences.push(`Es un Pokémon bebé: críalo con mimo y te acompañará toda la aventura.`);
  } else if (detail.habitat) {
    sentences.push(`Si quieres verlo en libertad, busca en su hábitat natural: ${habitatLabel(detail.habitat).toLowerCase()}.`);
  }

  return sentences.join(" ");
}
