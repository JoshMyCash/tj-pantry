"use client";

type Props = {
  value: number | null;
  onChange?: (n: number | null) => void;
  size?: "sm" | "md";
};

export function StarRating({ value, onChange, size = "md" }: Props) {
  const cls = size === "sm" ? "text-base" : "text-xl";
  return (
    <div className={`inline-flex items-center gap-0.5 ${cls}`} role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => {
        const on = (value ?? 0) >= n;
        return (
          <button
            key={n}
            type="button"
            disabled={!onChange}
            className={`leading-none ${on ? "text-tj-sun" : "text-black/20"} ${
              onChange ? "cursor-pointer hover:scale-110" : "cursor-default"
            }`}
            onClick={() => onChange?.(value === n ? null : n)}
            aria-label={`${n} stars`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
