---
name: hgi-protokoll-erstellung
description: Prozess zur Fertigstellung, Versand und Beschlussumsetzung des Versammlungsprotokolls nach einer HGI-Eigentümerversammlung (Präsenz oder Hybrid via Vulcavo). Verwenden, wenn Edgard Schröder ein Protokoll aus Tagesordnung/Einladung ausformulieren, prüfen, versenden oder die anschließende Beschlussumsetzung (WinCasa-Import, Fälligstellung, Ticket-Erstellung) organisieren möchte. Baut auf dem Skill "hgi-versammlung-top" (Einladung/Tagesordnung) auf.
---

# HGI Protokollerstellung nach der Eigentümerversammlung

## Ausgangslage
- Versammlung ist gelaufen (Präsenz oder Hybrid, Durchführung/Abstimmung über Vulcavo).
- Anwesenheitsliste liegt vor (in Vulcavo dokumentiert, ggf. Beirats-Flag dort schon gepflegt).
- Grundlage ist die bereits vorausgefüllte Einladung/Tagesordnung (Skill "hgi-versammlung-top").
- Protokoll wird i. d. R. **am Folgetag** fertiggestellt, spätestens 1–2 Tage nach der Versammlung.
- Protokoll wird direkt **in Vulcavo** erstellt/geschrieben.

## Schritt 1 – Tagesordnung zu Protokoll vervollständigen
Für jeden TOP:
1. **Kurze Erläuterung** – was wurde besprochen (Zusammenfassung).
2. **Beschlussvorschlag/Beschlussantrag** – Pflicht für jeden TOP, **außer**:
   - "Sonstiges"
   - "Bericht der Verwaltung"
   - Regularien (Versammlungsleitung, Protokollführer, Stimmrechtsprüfung etc.) – hier nur **namentliche Feststellung**, kein Beschluss nötig.
3. **Abstimmungsergebnis**: einstimmig oder mehrheitlich beschlossen (Ja/Nein/Enthaltung, Ergebnis).
4. **Verkündung** des Beschlusses gemäß WEG-Reform 2020 – bei jedem Beschluss den einschlägigen Paragrafen nennen (z. B. § 28 WEG bei Wirtschaftsplan/Jahresabrechnung inkl. Rücklage und Abrechnungsspitze; § 20/21 WEG bei baulichen Veränderungen; § 26 WEG bei Verwalterbestellung; § 19 WEG bei allgemeiner Verwaltungskompetenz – konkreter Paragraf richtet sich nach TOP-Inhalt, siehe Referenzdokument „Neue Beschlüsse nach der WEG-Reform 2020").

**Wichtige Korrektur zur Rechtsgrundlage der Protokoll-Unterschrift:**
Die vom Nutzer genannte Zuordnung zu § 26 WEG betrifft die *Verwalterbestellung*, nicht die Unterzeichnung des Protokolls. Die Unterschriftspflicht für das Protokoll ergibt sich aus **§ 24 Abs. 6 WEG**: zu unterschreiben sind der Versammlungsleiter und ein Wohnungseigentümer; **besteht ein Verwaltungsbeirat**, unterschreibt zusätzlich/statt des Eigentümers dessen Vorsitzender.

## Schritt 2 – Beiratsprüfung vor Protokollerstellung
- **Vor** Erstellung klären: Besteht ein Beirat? (Meist bereits in Vulcavo hinterlegt – dort zuerst prüfen.)
- Falls unklar: **aktiv nachfragen**, nicht annehmen.
- Unterschriftsberechtigte je nach Ergebnis: Versammlungsleiter + Beiratsvorsitzender (falls Beirat) bzw. Versammlungsleiter + ein Eigentümer (falls kein Beirat).

## Schritt 3 – Fertigstellung & interne Freigabe
- Protokoll im Vulcavo fertigstellen.
- Unterschrift einholen (Versammlungsleiter + Beiratsvorsitzender/Eigentümer gem. Schritt 2).

## Schritt 4 – Versand an Beirat zur Durchsicht
- Anschreiben an Beiratsmitglieder (per "zu Händen") mit Bitte um:
  - sorgfältige Durchsicht
  - Rückmeldung bei Ergänzungs-/Korrekturwünschen
- Nach Freigabe/Rückmeldung: finale Fassung.

## Schritt 5 – Versand an alle Eigentümer
- Ziel: **spätestens 2 Wochen (14 Tage) nach der Versammlung** an alle Eigentümer versendet.
- Versand inkl. kurzem Anschreiben, Protokoll als Anlage.
- Kanäle wie in Standard-Eigentümerkommunikation üblich (Post/E-POST via idwell + E-Mail + Portal, siehe Master Prompt Abschn. 23).

## Schritt 6 – Bestandskraft abwarten
- **Anfechtungsfrist: 1 Monat ab Beschlussfassung** (§ 45 WEG – Anfechtungsklage muss innerhalb eines Monats erhoben, innerhalb zwei Monaten begründet werden).
- **Erst nach Ablauf dieser Frist** beginnt die Beschlussumsetzung.
- Hinweis: Anfechtungsfrist läuft ab Beschlussfassung, nicht erst ab Protokollversand – Fristbeginn im Kalender/Ticket entsprechend hinterlegen.

## Schritt 7 – Export Beschlusssammlung nach WinCasa
- Aus Vulcavo: Export der fertigen Beschlusssammlung als **CSV**.
- Import dieser CSV in **WinCasa** (aktuell einzige produktive Anbindung Vulcavo↔WinCasa, keine direkte API-Nutzung – siehe Vulcavo-API-Hinweis in Erinnerungen).

## Schritt 8 – Fälligstellung wirtschaftlich relevanter Beschlüsse
Für Beschlüsse mit unmittelbarer Zahlungswirkung (v. a. **Jahresabrechnung** und **neuer Wirtschaftsplan**):
1. Sofort nach Bestandskraft: Fälligstellung zum beschlossenen Datum in WinCasa.
2. Übergabe an Buchhaltung (Ina Görtz):
   - Einzug der Nachzahlungen aus der Abrechnung,
   - Auszahlung von Guthaben,
   - Einstellung des neuen Wirtschaftsplans zum beschlossenen Datum.

## Schritt 9 – Ticket je umzusetzendem Beschluss
- Für **jeden** TOP mit Beschluss, der eine Umsetzung erfordert (z. B. Gartenpflege, Fensterreparatur, Dacherneuerung), wird ein **idwell-Ticket "Beschlussumsetzung"** angelegt.
- Zweck: Nachverfolgbarkeit/Abarbeitungsliste, damit nichts vergessen wird.
- Ticket sollte enthalten: Objekt, TOP-Nr./Beschlussinhalt, Beschlussdatum, Bestandskraft-Datum, Verantwortlicher, ggf. Frist.

## Checkliste (vor Versand/Abschluss)
- [ ] Jeder TOP: Erläuterung + (falls zutreffend) Beschlussvorschlag + Abstimmungsergebnis + Verkündung mit korrektem Paragrafen
- [ ] Beiratsstatus geklärt (Vulcavo geprüft bzw. nachgefragt)
- [ ] Korrekte Unterzeichner gem. § 24 Abs. 6 WEG
- [ ] Versand an Beirat zur Durchsicht erfolgt
- [ ] Versand an alle Eigentümer ≤ 14 Tage nach Versammlung
- [ ] Anfechtungsfrist (1 Monat, § 45 WEG) im Kalender/Ticket hinterlegt, Umsetzung erst danach
- [ ] CSV-Export Vulcavo → Import WinCasa durchgeführt
- [ ] Fälligstellung Abrechnung/Wirtschaftsplan an Buchhaltung übergeben
- [ ] Je umsetzungspflichtigem Beschluss ein idwell-Ticket angelegt

## Offene Punkte
- [•] Ob/wie die künftige Vulcavo-API eine automatisierte Übergabe (statt CSV) ermöglicht, ist bei Vulcavo noch zu erfragen (siehe bestehende Erinnerung).
- [•] Genaue Formulierungsvorlage für das Anschreiben an Beirat/Eigentümer liegt noch nicht als eigener Textbaustein vor – bei Bedarf gesondert erstellen.
