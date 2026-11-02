# Auftrag an Codex: MCP-Fachschnittstelle der HGI-Plattform nach Verwaltio-Vorbild

| Feld | Wert |
|---|---|
| Aufgaben-ID (Vorschlag) | `CX-20261102-PLATTFORM-MCP-FACHWERKZEUGE` (Umsetzung/Datenmodell), Gegenprüfung `CL-20261102-PLATTFORM-MCP-REVIEW` |
| Auftraggeber | Edgard Schröder (Eddy), 02.11.2026 |
| Übergeben von | Claude (Agent 00, Koordination) |
| Status | **ZUR PRÜFUNG**. Vor der Reservierung in `TASKS.md` prüfen, ob es den Eintrag schon gibt |
| Referenz | `verwaltio-schnittstelle.md` (gleicher Ordner): vollständige Analyse der Verwaltio-MCP-Schnittstelle (220 Werkzeuge), geprüft am Live-Konto am 02.11.2026 |
| Zielsystem | HGI-Plattform auf ubuntu17 (192.168.50.17, PostgreSQL/NocoDB, bestehende `/agent-api/mcp`). **Nicht** die HGI Protokoll-App im GitHub-Repo `hgihausverwaltung-create/HGI` |

## 1. Ziel (Edgard, 02.11.2026, sinngemäß)

> „Ich möchte genauso eine Schnittstelle zu unseren HGI-Plattformen bauen, damit es auch wirklich genauso funktioniert. Ich möchte das Ganze in der HGI-Plattform abrufen oder beschreiben.“

Claude und andere Assistenten sollen über die MCP-Schnittstelle der HGI-Plattform in den HGI-Fachdaten **lesen und schreiben** können: Objekte, Einheiten, Kontakte, Tickets, Versammlungen, Fristen, Belege, Sollstellungen, Bank, Kommunikation. Bedienung, Sicherheitsmuster und Antwortformat sollen dem Vorbild Verwaltio folgen.

## 2. Konflikt mit dem bestehenden Plan (zuerst klären)

Die Connector-Spezifikation von Baustein A (Kommandozentrale, Stand 01.10.2026) **schließt Schreibzugriffe auf Fachdaten ausdrücklich aus**. Ihre Positivliste umfasst nur `wissen_suchen`, `wissen_lesen`, `wissen_eintragen`, `fristen_abrufen`, `aufgaben_abrufen` und `vorgang_lesen`. Ausgeschlossen sind Zahlungen, Mailversand, das Schreiben von Tickets oder Kalender und Änderungen an Fachdaten.

Der neue Auftrag erweitert dieses Zielbild. Claudes Vorschlag (**ZUR PRÜFUNG, keine Entscheidung von Edgard**):

- Die Phasen 0–5 von Baustein A bleiben unverändert. Das gilt auch für die Voraussetzungen: Backup-Nachweis (B0-1), OAuth je Person, DSGVO-Prüfung und Codex-Abnahme je Phase.
- Die Fachwerkzeuge kommen als **neue Phasen 6 ff.** dazu, erst lesend, dann schreibend, ganz zuletzt mit Außenwirkung.
- Die Positivliste wird **je Phase** und nur nach ausdrücklicher Freigabe von Edgard erweitert.
- Die Arbeitsteilung offen ausweisen: Laut Entscheidung E1 baut Claude Baustein A und Codex prüft. Laut Baustein B macht Codex Datenmodell, API und Integration. Diesen Auftrag hat Edgard ausdrücklich an Codex zur Umsetzung gegeben. `[•]` Edgard soll bestätigen, dass dann Claude die Gegenprüfung übernimmt.

## 3. Muster aus Verwaltio, die übernommen werden sollen

### 3.1 Werkzeugschnitt und Auffindbarkeit
- Werkzeuge **fachlich nach Bereich** schneiden (Verwaltio: 26 Bereiche, siehe Referenz Abschnitt 1–17), jeweils in Paaren `get_*`/`list_*`, `create_*`, `edit_*`.
- Ein Werkzeug **`get_arbeitshinweise`**, das Vorgehen, Glossar, Darstellungsregeln und die vollständige Werkzeugliste nach Bereich liefert. Dort steht: „Was hier nicht steht, gibt es nicht.“
- **`find_entity` / `list_entities`** als einziger Weg zu IDs. Jede Werkzeugbeschreibung sagt: „IDs nie raten“. Bei mehreren Treffern fragt das Werkzeug zurück und nimmt nicht den ersten.
- **`get_*_360`** je Kernobjekt (Objekt, Einheit, Kontakt): Gesamtbild in einem Aufruf, mit den IDs zum Weiterarbeiten.

### 3.2 Klassen der Wirkung (in jeder Werkzeugbeschreibung und als MCP-Annotation)
| Klasse | Bedeutung | MCP-Annotation |
|---|---|---|
| L | nur lesen | `readOnlyHint: true` |
| E | Entwurf, nichts Endgültiges | `readOnlyHint: false`, `destructiveHint: false` |
| S | schreibt sofort, intern | `destructiveHint: false`, `idempotentHint` wo zutreffend |
| X | Außenwirkung (Mail, Brief, Portal, Mahnung, Rechnung, Kosten) | `openWorldHint: true`; Beschreibung beginnt mit „Verschickt echt …“ |

Löschen wird über die Schnittstelle grundsätzlich nicht angeboten.

### 3.3 Zweistufigkeit und Freigabe
- **Entwurf → Bestätigung** für Belege, Verträge und Vorlagen-Dokumente: `create_expense` erzeugt einen Entwurf mit `entwurfId`, erst `confirm_expense` bucht. Der Entwurf ist in der Oberfläche sichtbar und kann auch dort freigegeben werden.
- **Massenaktionen** (Mahnlauf, Honorarlauf, Import, Automation): zuerst ein Vorschau-Werkzeug, dann das ausführende Werkzeug mit Pflichtparameter **`maxEmpfaenger` / `maxObjekte`**. Kommen mehr Fälle in Frage als bestätigt, bricht der Lauf ab und **nichts** geht raus.
- **Pflicht zum Grund**: `edit_booking`, `cancel_booking` und `edit_expense` nach Festschreibung verlangen `grund` in den Worten des Nutzers. Der vorige Stand bleibt als Fassung im Verlauf, nichts wird gelöscht.
- **Vorprüfung gegen Race Conditions**: Parameter `fassung` bzw. `genannt`/`empfaengerIds` setzt die Vorprüfung, nicht das Modell. Damit lässt sich prüfen, dass genau das ausgeführt wird, was dem Nutzer gezeigt wurde.
- E-Mail: Der Entwurfsweg ist der Standard (`create_email_draft`). Der Direktversand (`send_message`) hat `nurVorschau: true` für den ausgefüllten Text.

### 3.4 Fachliche Schutzregeln im Server (nicht nur im Prompt)
- **Nachweispflicht im Bankabgleich**: Einen Umsatz einer Forderung zuordnen darf das Werkzeug nur, wenn im Umsatz Name oder IBAN der Person stehen. Ein gleicher Betrag allein wird mit `no_identity_proof` abgelehnt. Was der Nutzer im Chat behauptet, zählt nicht als Nachweis.
- **Periodensperre**: Buchungen nach DATEV-Übergabe oder Festschreibung werden abgelehnt (`festgeschrieben`, `datev_exportiert`, `rebook_required`). Die Antwort nennt den richtigen Weg.
- **Beschlossene Pläne und festgestellte Abrechnungen sind gesperrt.**
- **Plausibilität**: Ein auffälliger Zählerstand wird **nicht** gebucht. Erst nach Rückfrage mit `acceptImplausible`.
- **Dubletten**: `duplicate_suspected` bzw. `confirmDuplicate` nur nach ausdrücklicher Bestätigung.
- **Kontenrahmen je Objekt**: Ein Konto aus einem anderen Objekt wird abgewiesen.
- **Pflichtfragen**: Werte wie Verwaltungsart, PLZ und Ort darf das Werkzeug nicht vorbelegen. Sie werden immer erfragt.

### 3.5 Datenschutz
- Sensible Felder (IBAN, Geburtsdatum, Steuernummer, Einkommen) werden **nie ausgeliefert**. Die Beschreibung sagt: „Fehlend heißt nicht leer.“ Die einzige Ausnahme ist die IBAN eigener Bankkonten, weil die Konten sonst nicht unterscheidbar sind.
- Diese Regel deckt sich mit der Mindestfelder-Regel aus Baustein A und dem serverseitigen Ausgabefilter.

### 3.6 Einheitliches Antwortformat
```json
{ "ok": true,
  "summary": "Ein Satz mit dem Ergebnis.",
  "note": "Hinweis an das Modell zur Darstellung (optional)",
  "data": { "...": "...", "_route": "/objekte/2008" } }
```
- Fehler mit **sprechendem Code** und dem richtigen weiteren Weg, etwa `objekt_ev_vorhanden` mit der Liste der Eigentümer und dem Hinweis „für Miteigentum erneut mit alsMiteigentuemer“.
- Lange Läufe liefern eine `jobId`, abgeholt mit `get_job_status`. Nie doppelt starten.
- Gekürzte Listen setzen `_truncated` und `totalCount` sowie einen `naechsterOffset`.
- `_route` erzeugt einen Deep-Link in die Plattform-Oberfläche.
- Datumsangaben im Format TT.MM.JJJJ, Beträge mit Komma.
- `report_problem`: Das Modell kann Werkzeugfehler an die Betreiber melden.

## 4. Lücken in Verwaltio, die die HGI-Plattform schließen sollte (Wunschliste, je Phase freizugeben)

| Lücke in Verwaltio-MCP | Vorschlag HGI-Plattform |
|---|---|
| Keine Telefonie | Anrufnotiz als eigener Vorgangstyp (Kontakt, Objekt, Inhalt, Rückruf-Frist) |
| Keine freie Sollstellung (Sonderumlage, Nebenforderung) | `create_sollstellung` (E → S), Pflichtgrund |
| Hausgeld-Barzahlung nicht buchbar | `record_payment` auch für Hausgeld |
| Kontoabruf nicht auslösbar | `bank_abruf_starten` (S), Status über `get_job_status` |
| Lastschrift-Einzug nicht erzeugbar | `sepa_einzug_vorschau` (L) → `sepa_einzug_erzeugen` (E, SEPA-XML) → Einreichung nur durch einen Menschen |
| Keine freie Buchung | `create_booking` (E → S) mit Grund, nur in offener Periode |
| Beschlüsse einer Präsenz-ETV nicht erfassbar | `beschluss_erfassen` (S) mit Stimmverhältnis; Anfechtungsfrist nach § 45 WEG automatisch |
| Kein WhatsApp | über die bestehende HGI-Kommunikation (Agent 06), Klasse X |

## 5. Pflichten aus den HGI-Regeln (unverändert gültig)

- Kein Schreibzugriff auf Produktivdaten (auch WinCasa, idwell, Vulcavo) ohne **Trockenlauf und Datensicherung**, nie ohne Freigabe von Eddy.
- Jeder Wissens- oder Arbeitseintrag hat `review_status = ZUR PRÜFUNG` und eine getrennte Angabe von Ausführendem (aus dem Token) und Fachagent. Keine Selbstfreigabe.
- Audit je Aufruf: Zeit, Identität, Werkzeug, Parameter-Hash, Ergebnis. Keine Klartextinhalte.
- Keine Schlüssel oder Token in Dokumente kopieren (`Zugang_*.json` nicht lesen).
- Fristen fließen in den Kalender „HGI Fristen“ (Agent 00).

## 6. Erwartete Ergebnisse von Codex

1. Bestandsaufnahme: Welche Fachtabellen und Module der Plattform entsprechen den Verwaltio-Bereichen? Welche fehlen? (nur lesend)
2. Werkzeugkatalog HGI (Name, Bereich, Klasse L/E/S/X, Parameter, Ablehnungscodes) als Entwurf.
3. Vorschlag für die Phasen 6 ff. mit Abnahmetests in der Art von Baustein A, z. B. „X-Werkzeug ohne vorherige Vorschau wird abgewiesen“ und „Zuordnung nur nach Betrag wird abgewiesen“.
4. Ergebnisdatei im Ordner `HGI-Digitale Hausverwaltung`, Übergabe in `HANDOFFS.md`, Gegenprüfung durch Claude.

## 7. Offene Punkte für Edgard

- `[•]` Phasen 6 ff. hinter Baustein A einreihen oder vorziehen?
- `[•]` Rollenverteilung: Codex baut, Claude prüft. Bestätigen?
- `[•]` Welche Bereiche zuerst? Vorschlag: lesend Tickets, Fristen, Versammlungen; danach Belege und Bank.
- `[•]` Soll Verwaltio parallel weiterlaufen, und welches System ist führend?
