"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  /** Optional color dot (used by the type filter). */
  swatch?: string;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  ariaLabel: string;
  icon?: ReactNode;
  className?: string;
}

/** A styled, accessible single-select built on Radix. */
export function Select({ value, onValueChange, options, ariaLabel, icon, className }: SelectProps) {
  const selected = options.find((option) => option.value === value);

  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger
        aria-label={ariaLabel}
        className={cn(
          "border-border bg-surface inline-flex h-10 items-center gap-2 rounded-xl border px-3.5 text-sm font-medium",
          "text-foreground hover:bg-surface-hover transition-colors",
          "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
          "data-[state=open]:border-border-strong",
          className,
        )}
      >
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
        {selected?.swatch ? (
          <span
            className="size-3 rounded-full ring-1 ring-black/10"
            style={{ backgroundColor: selected.swatch }}
            aria-hidden
          />
        ) : null}
        <SelectPrimitive.Value />
        <SelectPrimitive.Icon className="text-muted-foreground ml-auto">
          <ChevronDown className="size-4" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className={cn(
            "z-50 max-h-[min(24rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)]",
            "border-border bg-surface overflow-hidden rounded-xl border shadow-[var(--shadow-card-hover)]",
          )}
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className={cn(
                  "relative flex cursor-pointer items-center gap-2 rounded-lg py-2 pr-8 pl-2.5 text-sm outline-none select-none",
                  "text-foreground data-[highlighted]:bg-muted data-[state=checked]:font-semibold",
                )}
              >
                {option.swatch ? (
                  <span
                    className="size-3 shrink-0 rounded-full ring-1 ring-black/10"
                    style={{ backgroundColor: option.swatch }}
                    aria-hidden
                  />
                ) : null}
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute right-2.5">
                  <Check className="size-4" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
