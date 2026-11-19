"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "./Icon";
import { IconButton } from "./Button";

type ToastCtx = { show: (text: string) => void };
const Ctx = createContext<ToastCtx>({ show: () => {} });

export const useToast = () => useContext(Ctx);

/** Toast unten, ein Satz, verschwindet von selbst, role="status". */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [text, setText] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((t: string) => {
    setText(t);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setText(""), 5000);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {text && (
          <div className="toast">
            <Icon name="check" small />
            <span>{text}</span>
            <IconButton icon="x" small label="Meldung schliessen" onClick={() => setText("")} />
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}
