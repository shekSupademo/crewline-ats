import { Star } from "lucide-react";
import { useState } from "react";
import {
  type Candidate,
  DEPARTMENTS,
  STAGE_LABEL,
  STAGES,
  type Stage,
} from "../data/types";
import { cx } from "../lib/format";
import { Badge } from "./ui";

const stageTone: Record<Stage, "gray" | "blue" | "amber" | "green"> = {
  applied: "gray",
  screen: "blue",
  interview: "blue",
  offer: "amber",
  hired: "green",
};
export function StageBadge({
  c,
}: {
  c: Pick<Candidate, "stage" | "rejected">;
}) {
  return c.rejected ? (
    <Badge tone="red">Rejected</Badge>
  ) : (
    <Badge tone={stageTone[c.stage]}>{STAGE_LABEL[c.stage]}</Badge>
  );
}

export function Stars({
  value,
  onChange,
  size = "sm",
  label = "Rating",
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "md";
  label?: string;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div
      role={onChange ? "radiogroup" : "img"}
      aria-label={`${label}: ${value} of 5`}
      className="inline-flex"
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const icon = (
          <Star
            className={cx(
              size === "sm" ? "size-3.5" : "size-5",
              n <= shown
                ? "fill-amber-400 text-amber-400"
                : "text-zinc-300 dark:text-zinc-600",
            )}
          />
        );
        return onChange ? (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(value === n ? 0 : n)}
            className="p-0.5"
          >
            {icon}
          </button>
        ) : (
          <span key={n}>{icon}</span>
        );
      })}
    </div>
  );
}

export const stageOptions = STAGES.map((s) => ({
  value: s,
  label: STAGE_LABEL[s],
}));
export const departmentOptions = DEPARTMENTS.map((d) => ({
  value: d,
  label: d,
}));
