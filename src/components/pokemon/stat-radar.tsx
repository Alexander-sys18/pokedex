import { STAT_LABELS_ES } from "@/lib/pokedex/constants";
import type { StatValue } from "@/lib/pokedex/types";

/**
 * Hexagonal stat radar (pure SVG, rendered on the server). Values are scaled
 * against 160 — a high-but-common ceiling for base stats — and clamped, which
 * keeps typical polygons readable; exact numbers live in the labels and bars.
 */
const SCALE_MAX = 160;
const SIZE = 240;
const CENTER = SIZE / 2;
const RADIUS = 78;

/** Hexagon axis order (clockwise from the top), classic Pokédex layout. */
const AXIS_ORDER = ["hp", "attack", "defense", "speed", "special-defense", "special-attack"];

function point(axis: number, radius: number): [number, number] {
  const angle = (Math.PI / 180) * (-90 + axis * 60);
  return [CENTER + radius * Math.cos(angle), CENTER + radius * Math.sin(angle)];
}

function polygonPoints(radii: number[]): string {
  return radii.map((r, i) => point(i, r).join(",")).join(" ");
}

export function StatRadar({ stats, accent }: { stats: StatValue[]; accent: string }) {
  const byName = new Map(stats.map((s) => [s.name, s.base]));
  const values = AXIS_ORDER.map((name) => byName.get(name) ?? 0);
  const radii = values.map((v) => Math.min(1, v / SCALE_MAX) * RADIUS);

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label={`Radar de estadísticas: ${AXIS_ORDER.map(
        (name, i) => `${STAT_LABELS_ES[name] ?? name} ${values[i]}`,
      ).join(", ")}`}
      className="mx-auto w-full max-w-[240px]"
    >
      {/* Concentric grid + spokes */}
      {[1, 2 / 3, 1 / 3].map((f) => (
        <polygon
          key={f}
          points={polygonPoints(AXIS_ORDER.map(() => RADIUS * f))}
          fill="none"
          stroke="var(--color-border-strong)"
          strokeWidth="1"
        />
      ))}
      {AXIS_ORDER.map((name, i) => {
        const [x, y] = point(i, RADIUS);
        return (
          <line
            key={name}
            x1={CENTER}
            y1={CENTER}
            x2={x}
            y2={y}
            stroke="var(--color-border)"
            strokeWidth="1"
          />
        );
      })}

      {/* Stat polygon */}
      <polygon
        points={polygonPoints(radii)}
        fill={accent}
        fillOpacity="0.28"
        stroke={accent}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {radii.map((r, i) => {
        const [x, y] = point(i, r);
        return <circle key={i} cx={x} cy={y} r="2.5" fill={accent} />;
      })}

      {/* Axis labels + values */}
      {AXIS_ORDER.map((name, i) => {
        const [x, y] = point(i, RADIUS + 20);
        return (
          <text
            key={name}
            x={x}
            y={y}
            textAnchor="middle"
            fontSize="10"
            fontWeight="600"
            fill="var(--color-muted-foreground)"
          >
            {STAT_LABELS_ES[name] ?? name}
            <tspan x={x} dy="11" fontWeight="700" fill="var(--color-foreground)">
              {values[i]}
            </tspan>
          </text>
        );
      })}
    </svg>
  );
}
