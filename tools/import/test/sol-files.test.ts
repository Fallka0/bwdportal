import { describe, expect, it } from "vitest";
import { blockOf, codeInName, displayName, isSolution, normCode, solFilesSql, subjectOf, suggestMapping } from "../src/sol-files";

const TASKS = [
  { block: 3, subject: "D", code: "3.01", title: "Analyse und Transfer Teil 1" },
  { block: 3, subject: "D", code: "3.02", title: "Analyse und Transfer Teil 1 (Fortsetzung)" },
  { block: 8, subject: "D", code: "8", title: "Literaturanalyse" },
  { block: 3, subject: "F", code: "3.1", title: "Compréhension écrite (CE)" },
  { block: 2, subject: "F", code: "2.1-2.3", title: "Ecocom chap. 6 p. 88-89 et réclamation" },
  { block: 4, subject: "M", code: "4.01", title: "Quadratische Funktionen" },
];

describe("SOL-Dateien zuordnen", () => {
  it("Fach aus dem Ordner, Block, Nummer im Namen", () => {
    expect(subjectOf("06_Finanz- und Rechnungswesen/Block1/x.docx")).toBe("FRW");
    expect(subjectOf("03_Französisch/Block3 Französisch CE CO Voc/x.docx")).toBe("F");
    expect(blockOf("03_Französisch/Block3 Französisch CE CO Voc/x.docx")).toBe(3);
    expect(codeInName("D_SOL_3.01_Lernbaustein.docx")).toBe("3.1");
    expect(codeInName("F-SOL_2.1-2.3_Ecocom.docx")).toBe("2.1-2.3");
    expect(codeInName("SOL_Lernbaustein 6.1_Français.docx")).toBe("6.1");
    expect(codeInName("F_SOL 5_Négociation.docx")).toBe("5");
    expect(normCode("3.01")).toBe(normCode("3.1"));
  });

  it("erkennt Lösungen, aber nicht das Präfix SOL", () => {
    expect(isSolution("D_SOL_1.01_Lösungsvorschlag_Lernbaustein 1.docx")).toBe(true);
    expect(isSolution("SOL_LK5_JT3_sol.docx")).toBe(true);
    expect(isSolution("2024Fraude_Sol.docx")).toBe(true);
    expect(isSolution("Forêt des Sens_solutions.docx")).toBe(true);
    expect(isSolution("F_SOL_3.1_CE.docx")).toBe(false);
  });

  it("Vorschlag: Lernbaustein ist der Auftrag, Rest Unterlagen und Lösungen, einziger Auftrag im Block", () => {
    const m = suggestMapping(
      [
        "05_Deutsch/Block3/D_SOL_3.01_Arbeitsblatt_Mindful_Drinking.docx",
        "05_Deutsch/Block3/D_SOL_3.01_Arbeitsblatt_Mindful_Drinking_Lösungsvorschlag.docx",
        "05_Deutsch/Block3/D_SOL_3.01_Lernbaustein_Analyse_und_Transfer_Teil1.docx",
        "05_Deutsch/Block8/SOL_Lernbaustein_Block 8 Literaturanalyse.docx",
        "05_Deutsch/Block8/Erzähltheorie Tabelle.docx",
        "03_Französisch/Block3 Französisch CE CO Voc/F_SOL_3.1_CE.docx",
        "02_Math/Block4/~$M-SOL_4.01.docx",
      ],
      TASKS,
    );
    expect(m.map((e) => [e.task, e.kind, e.name])).toEqual([
      ["F 3.1", "task", "Compréhension écrite (CE)"],
      ["D 3.01", "solution", "Arbeitsblatt Mindful Drinking Lösungsvorschlag"],
      ["D 3.01", "material", "Arbeitsblatt Mindful Drinking"],
      ["D 3.01", "task", "Analyse und Transfer Teil 1"],
      ["D 8", "material", "Erzähltheorie Tabelle"],
      ["D 8", "task", "Literaturanalyse"],
    ]);
  });

  it("Name ohne Präfix und SQL ersetzt die Dateien des Auftrags", () => {
    expect(displayName("D_SOL_4.01_Bewertungsraster.docx")).toBe("Bewertungsraster");
    const sql = solFilesSql("c-im24a", [{ file: "x.docx", task: "M 4.01", kind: "task", name: "Quadratische Funktionen", n: 1, ext: "docx", bytes: 1200, pdf: true }]);
    expect(sql[0]).toBe("DELETE FROM sol_task_files WHERE task_id = 't-im24a-m-4.01';");
    expect(sql[1]).toContain("'sol/im24a/m-4.01/1.docx', 'sol/im24a/m-4.01/1.as.pdf', 1200");
  });

  it("Umlaute aus ZIP-Dateien (zerlegt) und andere Dateitypen", () => {
    const nfd = "D_SOL_3.01_Arbeitsblatt_Lösungsvorschlag.docx".normalize("NFD");
    expect(isSolution(nfd)).toBe(true);
    const m = suggestMapping(["03_Französisch/Block3 x/F_SOL_3.1_CE.mp3", "03_Französisch/Block3 x/.DS_Store", "03_Französisch/Block3 x/F_SOL_3.1_CE.docx"], TASKS);
    expect(m.map((e) => [e.task, e.kind])).toEqual([
      ["F 3.1", "task"],
      ["F 3.1", "material"],
    ]);
  });
});
