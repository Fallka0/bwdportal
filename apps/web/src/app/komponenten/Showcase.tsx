"use client";

import { useState } from "react";
import {
  Banner,
  Button,
  Card,
  CardHead,
  Dialog,
  DialogActions,
  Empty,
  Icon,
  IconButton,
  Kpis,
  ListRow,
  SelectField,
  Segment,
  SkeletonArea,
  SkLine,
  StaticField,
  Status,
  Switch,
  TextArea,
  TextField,
  TextTabs,
  useToast,
} from "@/components/ui";

export function Showcase({ theme }: { theme: "light" | "dark" }) {
  const [seg, setSeg] = useState<"tag" | "woche">("woche");
  const [tab, setTab] = useState("alle");
  const [sw, setSw] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const h = theme === "light" ? "Hell" : "Dunkel";

  return (
    <section data-theme={theme} className="kt-pane" aria-label={h}>
      <h2 className="d kt-h">{h}</h2>

      <div className="kt-row">
        <Button icon="plus">Absenz melden</Button>
        <Button variant="line">Stundenplan</Button>
        <Button variant="ghost" icon="check">
          Alle als gelesen markieren
        </Button>
        <Button small>Entschuldigen</Button>
        <Button variant="line" small>
          Erneut laden
        </Button>
        <Button disabled>Gesperrt</Button>
        <Button
          busy={busy}
          onClick={() => {
            setBusy(true);
            setTimeout(() => setBusy(false), 1500);
          }}
        >
          Absenden
        </Button>
        <Button variant="out" icon="logout">
          Abmelden
        </Button>
        <IconButton icon="bell" label="Benachrichtigungen" />
        <IconButton icon="moon" label="Dunkles Design" />
      </div>

      <Kpis
        items={[
          { label: "Offen", value: 2, tone: "warn" },
          { label: "Unentschuldigt", value: 1 },
          { label: "Entschuldigt", value: 2 },
        ]}
      />

      <Card aria-labelledby={`kt-c-${theme}`}>
        <CardHead id={`kt-c-${theme}`} title="Neue Noten" href="#" linkLabel="Alle Noten" />
        <ListRow title="Englisch" sub="Unit 4 Test · 22.10." end={<span className="d kt-g">5.5</span>} />
        <ListRow title="Prüfungsplan 1. Semester ist online" sub="Schulleitung · 20.10.2026" href="#" />
        <ListRow title="Do 22.10. · 2 Lektionen" sub="Französisch, Mathematik" end={<Status tone="warn">Offen</Status>} />
        <ListRow title="Di 29.09. · 1 Lektion" sub="Sport" end={<Status tone="err">Unentschuldigt</Status>} />
        <ListRow title="Fr 09.10. · 4 Lektionen" sub="Vormittag" end={<Status tone="ok">Entschuldigt</Status>} />
      </Card>

      <div className="kt-row">
        <Segment label="Ansicht" value={seg} onChange={setSeg} options={[{ value: "tag", label: "Tag" }, { value: "woche", label: "Woche" }]} />
        <Switch label="Neue Noten" checked={sw} onChange={setSw} />
      </div>

      <TextTabs
        label="Kategorie"
        value={tab}
        onChange={setTab}
        items={[
          { value: "alle", label: "Alle", count: 10 },
          { value: "pp", label: "Prüfungspläne", count: 2 },
          { value: "fo", label: "Formulare", count: 3 },
        ]}
      />

      <Card>
        <div className="stack">
          <SelectField label="Auftrag" defaultValue="fr">
            <option value="fr">Französisch 3.01 · Compréhension orale · 45 Min.</option>
            <option value="ma">Mathematik 3.04 · Lineare Optimierung III · 45 Min.</option>
          </SelectField>
          <StaticField label="SOL-Tag" icon="cal">
            Freitag, 30. Oktober
          </StaticField>
          <div className="g2">
            <TextField label="Von" defaultValue="16:30" inputMode="numeric" />
            <TextField label="Bis" defaultValue="15:00" inputMode="numeric" error="Bis muss nach Von liegen." />
          </div>
          <TextArea label="Notiz" />
        </div>
      </Card>

      <Empty icon="search" title="Kein Dokument für «Zeugnis».">
        <Button variant="line" small>
          Suche zurücksetzen
        </Button>
      </Empty>

      <Banner action={<Button variant="line" small>Erneut laden</Button>}>
        <b>WebUntis antwortet gerade nicht.</b> Du siehst den Stundenplan von heute 07:58. Änderungen seither fehlen.
      </Banner>
      <Banner tone="err">
        <b>Dieses Konto gehört nicht zur bwd.</b> Melde dich mit deiner Adresse vorname.nachname@bwdbern.ch an.
      </Banner>

      <SkeletonArea label="Wird geladen">
        <div className="sk-card">
          <SkLine w="30%" />
          <SkLine w="70%" size="xl" />
          <SkLine w="50%" />
          <SkLine w="40%" size="s" />
        </div>
      </SkeletonArea>

      <div className="kt-row">
        <Button variant="line" onClick={() => setOpen(true)}>
          Dialog öffnen
        </Button>
        <Button variant="line" onClick={() => toast.show("Absenz gesendet. Deine Klassenlehrperson prüft sie.")}>
          Toast zeigen
        </Button>
        <span className="kt-ic">
          <Icon name="swap" />
          <Icon name="cancel" />
          <Icon name="chart" />
          <Icon name="megaphone" />
          <Icon name="book" />
        </span>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title="Absenz entschuldigen">
        <StaticField label="Datum" icon="cal">
          Do, 22. Oktober 2026
        </StaticField>
        <TextArea label="Notiz" />
        <DialogActions>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Abbrechen
          </Button>
          <Button icon="send" onClick={() => setOpen(false)}>
            2 Lektionen entschuldigen
          </Button>
        </DialogActions>
      </Dialog>
    </section>
  );
}
