import * as React from "react";
import { Gauge, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Explain } from "@/components/ui/tooltip";
import type { CompareView } from "@/features/homeowner/HomeownerProvider";

const OPTIONS: { value: CompareView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "internal", label: "Internal Technical View", icon: Gauge },
  { value: "homeowner", label: "Homeowner View", icon: Users },
];

export function ViewToggle({
  view,
  onChange,
  homeownerDisabled,
}: {
  view: CompareView;
  onChange: (v: CompareView) => void;
  homeownerDisabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Comparison perspective"
      className="no-print inline-flex rounded-xl border border-edge bg-navy-100/70 p-1"
    >
      {OPTIONS.map((opt) => {
        const active = view === opt.value;
        const disabled = opt.value === "homeowner" && homeownerDisabled;
        const Icon = opt.icon;

        const button = (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex min-h-[44px] items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-daikin-600 focus-visible:ring-offset-2",
              active ? "bg-white text-navy-900 shadow-sm" : "text-navy-600 hover:text-navy-900",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            <Icon className={cn("size-[18px]", active ? "text-daikin-600" : "text-navy-400")} aria-hidden />
            {opt.label}
          </button>
        );

        return disabled ? (
          <Explain
            key={opt.value}
            content="Homeowner View builds a recommendation around a Daikin system. Add one to the comparison to enable it."
          >
            <span tabIndex={0} className="inline-flex">
              {button}
            </span>
          </Explain>
        ) : (
          button
        );
      })}
    </div>
  );
}
