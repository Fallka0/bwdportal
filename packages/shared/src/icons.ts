import { iconData } from "./icons.gen";

export { iconData };
export type IconName = keyof typeof iconData;
export type IconShape = (typeof iconData)[IconName][number];

/** Farben des Microsoft-Logos (Markenzeichen, nicht Teil der Design-Tokens). */
export const microsoftLogo = ["#f25022", "#7fba00", "#00a4ef", "#ffb900"] as const;
