import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: { default: "bwd Portal", template: "%s · bwd Portal" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de-CH">
      <body>{children}</body>
    </html>
  );
}
