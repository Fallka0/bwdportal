"use client";

import { useSyncExternalStore } from "react";
import { config } from "@bwd/shared";
import { Icon } from "@/components/ui";

const noop = () => () => {};
/** Auf iPhone und iPad nützt eine APK nichts: dort keinen Link zeigen. */
const isApple = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

/** Link "App für Android", sobald eine APK hochgeladen ist (config.app.android.version). */
export function AndroidAppLink({ variant = "link" }: { variant?: "link" | "row" }) {
  const apple = useSyncExternalStore(noop, isApple, () => false);
  const version = config.app.android.version;
  if (!version || apple) return null;
  if (variant === "row")
    return (
      <a href="/api/v1/app/android" download>
        <span className="mi">
          <Icon name="download" />
        </span>
        <span>
          <b>App für Android</b>
          <span className="s">Version {version} · APK</span>
        </span>
        <span />
        <Icon name="chev-r" small className="chev" />
      </a>
    );
  return (
    <a className="ul" href="/api/v1/app/android" download>
      App für Android
    </a>
  );
}
