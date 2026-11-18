import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Icon } from "./Icon";

type Base = { label: string; error?: string };

function Wrap({ id, label, error, children }: Base & { id: string; children: ReactNode }) {
  return (
    <div className="f">
      <label className="f-l" htmlFor={id}>
        {label}
      </label>
      {children}
      {error && (
        <span className="f-e" id={`${id}-e`}>
          {error}
        </span>
      )}
    </div>
  );
}

export function TextField({ label, error, id, ...rest }: Base & InputHTMLAttributes<HTMLInputElement>) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Wrap id={fid} label={label} error={error}>
      <input id={fid} className="inp" aria-invalid={error ? true : undefined} aria-describedby={error ? `${fid}-e` : undefined} {...rest} />
    </Wrap>
  );
}

export function TextArea({ label, error, id, rows = 3, ...rest }: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Wrap id={fid} label={label} error={error}>
      <textarea id={fid} className="inp" rows={rows} aria-invalid={error ? true : undefined} aria-describedby={error ? `${fid}-e` : undefined} {...rest} />
    </Wrap>
  );
}

export function SelectField({ label, error, id, children, ...rest }: Base & SelectHTMLAttributes<HTMLSelectElement>) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Wrap id={fid} label={label} error={error}>
      <span className="sel">
        <select id={fid} className="inp" aria-invalid={error ? true : undefined} {...rest}>
          {children}
        </select>
        <Icon name="chev-d" small />
      </span>
    </Wrap>
  );
}

/** Nur lesbarer Wert in Feld-Optik, z. B. das Datum im Absenz-Dialog. */
export function StaticField({ label, icon, children }: { label: string; icon?: "cal"; children: ReactNode }) {
  return (
    <div className="f">
      <span className="f-l">{label}</span>
      <div className="inp inp-static">
        {icon && <Icon name={icon} small />}
        {children}
      </div>
    </div>
  );
}
