import { dayColumns, palette, type Lesson } from "@bwd/shared";
import { fireEvent, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { TimeGrid } from "@/timegrid/TimeGrid";
import { renderThemed } from "../test/utils";

const L = (id: string, start: string, end: string, extra: Partial<Lesson> = {}): Lesson => ({
  id,
  date: "2026-10-26",
  start,
  end,
  subject: { code: "MA", name: "Mathematik", short: "Mathe" },
  teacher: { code: "KEL", name: "R. Keller" },
  room: "A 304",
  state: "normal",
  originalRoom: null,
  ...extra,
});

const lessons = [
  L("a", "08:00", "08:45"),
  L("b", "10:45", "11:30", { subject: { code: "WR", name: "Wirtschaft und Recht", short: "W&R" }, room: "B 015", originalRoom: "A 207", state: "room_changed", teacher: { code: "BRU", name: "T. Brunner" } }),
  L("c", "13:15", "14:00", { subject: { code: "DE", name: "Deutsch", short: "Deutsch" }, state: "cancelled" }),
];

async function grid(onPrev = jest.fn()) {
  await renderThemed(
    <TimeGrid
      variant="day"
      grid={{ end: "15:00", columns: dayColumns([{ date: "2026-10-26" }], lessons), lunch: { from: "12:20", to: "13:15" } }}
      now={{ date: "2026-10-26", time: "10:20" }}
      live={false}
      title="Heute"
      sub="Montag, 26. Oktober"
      prev={{ onPress: onPrev, label: "Vorheriger Tag" }}
    />,
  );
  // Das Raster misst seine Breite: in Jest von Hand auslösen
  await fireEvent.layout(screen.getByTestId("tg-body"), { width: 320, height: 600 });
}

describe("TimeGrid (App)", () => {
  it("zeigt Blöcke mit Beschriftung für Screenreader", async () => {
    await grid();
    expect(screen.getByLabelText(/Mathematik, A 304, R. Keller, 08:00 bis 08:45/)).toBeTruthy();
    expect(screen.getByLabelText(/Wirtschaft und Recht, Raumänderung: B 015 statt A 207/)).toBeTruthy();
    expect(screen.getByLabelText(/Deutsch, entfällt/)).toBeTruthy();
  });

  it("Jetzt-Linie mit Uhrzeit und Mittag", async () => {
    await grid();
    expect(screen.getByLabelText("Jetzt 10:20")).toBeTruthy();
    expect(screen.getByText("10:20")).toBeTruthy();
    // Das Band ist Dekoration und für Screenreader ausgeblendet
    expect(screen.getByText("Mittag", { includeHiddenElements: true })).toBeTruthy();
  });

  it("vergangene Lektion: blasse Fläche statt Deckkraft (Kontrast bleibt)", async () => {
    await grid();
    const past = StyleSheet.flatten(screen.getByLabelText(/Mathematik, A 304/).props.style);
    expect(past.backgroundColor).toBe(palette("light").ttPast);
    expect(past.opacity).toBeUndefined();
    const current = StyleSheet.flatten(screen.getByLabelText(/Wirtschaft und Recht/).props.style);
    expect(current.backgroundColor).toBe(palette("light").ttBg);
  });

  it("Pfeil löst Navigation aus", async () => {
    const onPrev = jest.fn();
    await grid(onPrev);
    await fireEvent.press(screen.getByRole("button", { name: "Vorheriger Tag" }));
    expect(onPrev).toHaveBeenCalled();
  });
});
