import { render } from "@testing-library/react-native";
import type { ReactElement } from "react";
import { ThemeProvider, ThemeScope } from "@/theme";

/** Rendert mit Theme (fest hell oder dunkel, unabhängig vom Gerät). */
export async function renderThemed(ui: ReactElement, scheme: "light" | "dark" = "light") {
  return await render(
    <ThemeProvider>
      <ThemeScope scheme={scheme}>{ui}</ThemeScope>
    </ThemeProvider>,
  );
}
