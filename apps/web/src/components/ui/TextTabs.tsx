"use client";

type Item<T extends string> = { value: T; label: string; count?: number };

/** Filter als Text-Tabs mit Unterstrich, keine Chips. */
export function TextTabs<T extends string>({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: Item<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="tabs" role="group" aria-label={label}>
      {items.map((it) => (
        <button key={it.value} type="button" className="tab" aria-pressed={it.value === value} onClick={() => onChange(it.value)}>
          {it.label}
          {it.count !== undefined && <span className="c">{it.count}</span>}
        </button>
      ))}
    </div>
  );
}
