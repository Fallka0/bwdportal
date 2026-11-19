"use client";

type Option<T extends string> = { value: T; label: string };

/** Umschalter (Tag/Woche, Semester, Design). Aktiv = raise. */
export function Segment<T extends string>({
  label,
  options,
  value,
  onChange,
  full,
}: {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  full?: boolean;
}) {
  return (
    <div className={full ? "seg seg-full" : "seg"} role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
