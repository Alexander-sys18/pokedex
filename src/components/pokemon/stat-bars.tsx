import { MAX_BASE_STAT, STAT_LABELS_ES } from "@/lib/pokedex/constants";
import type { StatValue } from "@/lib/pokedex/types";

interface StatBarsProps {
  stats: StatValue[];
  total: number;
  accent: string;
}

/**
 * Base-stat bars animated with the shared CSS `animate-meter` keyframe (same
 * as the comparator) — no client JS or animation library needed, so this
 * renders on the server and framer-motion stays out of the bundle.
 */
export function StatBars({ stats, total, accent }: StatBarsProps) {
  return (
    <div className="flex flex-col gap-3">
      {stats.map((stat, index) => {
        const pct = Math.min(100, (stat.base / MAX_BASE_STAT) * 100);
        return (
          <div key={stat.name} className="grid grid-cols-[7rem_2.5rem_1fr] items-center gap-3">
            <span className="text-muted-foreground text-sm">
              {STAT_LABELS_ES[stat.name] ?? stat.name}
            </span>
            <span className="text-foreground text-right font-mono text-sm font-semibold tabular-nums">
              {stat.base}
            </span>
            <div className="bg-muted h-2.5 overflow-hidden rounded-full">
              <div
                className="animate-meter h-full rounded-full"
                style={{
                  ["--fill" as string]: `${pct}%`,
                  backgroundColor: accent,
                  animationDelay: `${index * 60}ms`,
                }}
              />
            </div>
          </div>
        );
      })}

      <div className="border-border mt-1 grid grid-cols-[7rem_2.5rem_1fr] items-center gap-3 border-t pt-3">
        <span className="text-foreground text-sm font-semibold">Total</span>
        <span className="text-foreground text-right font-mono text-sm font-bold tabular-nums">
          {total}
        </span>
        <span />
      </div>
    </div>
  );
}
