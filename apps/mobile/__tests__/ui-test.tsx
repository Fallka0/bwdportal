import { fireEvent, screen } from "@testing-library/react-native";
import { useState } from "react";
import { Banner, Button, Segment, Status, Switch, T } from "@/ui";
import { renderThemed } from "../test/utils";

describe("Grundkomponenten (App)", () => {
  it("Knopf: Rolle, Beschriftung, gesperrt und lädt", async () => {
    const onPress = jest.fn();
    await renderThemed(
      <>
        <Button label="Absenden" onPress={onPress} />
        <Button label="Gesperrt" disabled onPress={onPress} />
        <Button label="Speichern" busy onPress={onPress} />
      </>,
    );
    await fireEvent.press(screen.getByRole("button", { name: "Absenden" }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Gesperrt" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Speichern" })).toBeBusy();
  });

  it("Segment: aktive Option ist ausgewählt", async () => {
    function Demo() {
      const [v, setV] = useState<"tag" | "woche">("tag");
      return <Segment label="Ansicht" value={v} onChange={setV} options={[{ value: "tag", label: "Tag" }, { value: "woche", label: "Woche" }]} />;
    }
    await renderThemed(<Demo />);
    expect(screen.getByRole("tab", { name: "Tag" })).toBeSelected();
    await fireEvent.press(screen.getByRole("tab", { name: "Woche" }));
    expect(screen.getByRole("tab", { name: "Woche" })).toBeSelected();
    expect(screen.getByRole("tab", { name: "Tag" })).not.toBeSelected();
  });

  it("Schalter: Rolle switch mit Zustand", async () => {
    function Demo() {
      const [on, setOn] = useState(false);
      return <Switch label="Zusätzlich per E-Mail" value={on} onChange={setOn} />;
    }
    await renderThemed(<Demo />);
    const sw = screen.getByRole("switch", { name: "Zusätzlich per E-Mail" });
    expect(sw).not.toBeChecked();
    await fireEvent.press(sw);
    expect(sw).toBeChecked();
  });

  it("Status ist ein Wort, Banner ist eine Meldung", async () => {
    await renderThemed(
      <>
        <Status tone="warn" label="Offen" />
        <Banner>
          <T>WebUntis antwortet gerade nicht.</T>
        </Banner>
      </>,
    );
    expect(screen.getByText("Offen")).toBeTruthy();
    expect(screen.getByRole("alert")).toHaveTextContent(/WebUntis antwortet gerade nicht/);
  });
});
