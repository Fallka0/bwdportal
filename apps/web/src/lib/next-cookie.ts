/** Ziel nach dem Login (nur für den QR-Check-in): Cookie, das die Übersicht nach dem Login einlöst. */
export const NEXT_COOKIE = "bwd_next";
export const allowedNext = (v: string | undefined | null) => !!v && /^\/sol\/checkin\?c=[0-9a-f]{1,64}$/.test(v);
