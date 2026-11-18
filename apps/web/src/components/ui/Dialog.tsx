"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { IconButton } from "./Button";

/**
 * Dialog auf Basis von <dialog> mit showModal(): Fokus bleibt im Dialog, Esc schliesst.
 * Im Web zentriert, unter 600 px als Sheet von unten (CSS).
 */
export function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      // Fokus auf den Dialog selbst (kein Ring auf dem Schliessen-Knopf); Tab führt zum ersten Element.
      d.focus();
    }
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="dlg"
      tabIndex={-1}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {open && (
        <>
          <div className="dlg-h">
            <h2 id={titleId}>{title}</h2>
            <IconButton icon="x" label="Schliessen" onClick={onClose} />
          </div>
          {children}
        </>
      )}
    </dialog>
  );
}

export function DialogActions({ children }: { children: ReactNode }) {
  return <div className="dlg-a">{children}</div>;
}
