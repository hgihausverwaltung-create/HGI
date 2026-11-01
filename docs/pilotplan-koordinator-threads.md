# Pilotplan: Koordinator mit Threads (Claude Projekte) für das HGI-Agententeam

Stand: 01.11.2026 · Status: ENTWURF – ZUR PRÜFUNG durch Edgard Schröder
Logischer Fachagent: 00 Masteragent · Ausführender Assistent: Claude

Kennzeichnung: [sicher] / [wahrscheinlich] / [geraten]. Offene Punkte stehen als `[•]` – nicht raten, nicht stillschweigend auffüllen.

---

## 0. Vorbehalt – zuerst lesen

Die Funktion „Koordinator startet Threads, gemeinsamer Speicher, verschiedene Modelle je Thread“ ist bisher **nur aus einem TikTok-Video** (gologan.ai, russischsprachig, automatisch übersetzt) bekannt. Eine offizielle Bestätigung liegt nicht vor [sicher]. Phase 1 dieses Plans ist deshalb eine reine Prüfung. Fällt sie negativ aus, endet der Pilot dort.

## 1. Ziel und Abgrenzung

**Ziel:** Herausfinden, ob sich das HGI-Agententeam (00 + 01–10) mit der Projekt-Funktion „Koordinator + Threads“ technisch so abbilden lässt, dass alle bestehenden HGI-Regeln eingehalten werden.

**Pilotablauf:** Posteingang zuordnen und Ablage vorschlagen (Agent 07). Begründung: Agent 07 schreibt nichts nach außen und ändert keine Produktivdaten. Ein Fehler zeigt sich als falscher Ablagevorschlag, nicht als versäumte Frist [wahrscheinlich].

**Ausdrücklich nicht im Pilot:**
- ETV, Ladungen, Beschlüsse, Vulcavo (01)
- Fristenkontrolle und Verwalterbestellungen (00)
- Zahlungen, Rechnungsfreigaben, Buchungen (03/04)
- Versand jeglicher Schreiben (06)
- Rechtswirksame Schreiben (08/09)
- Schreibzugriffe auf WinCasa, idwell, Vulcavo, Verwaltio

## 2. Phasen

### Phase 1 – Funktion prüfen (Eddy, ca. 15 Minuten)

| Prüfpunkt | Ergebnis |
|---|---|
| Gibt es in deinem Claude-Projekt einen Koordinator, der Threads startet? | `[•]` |
| Gibt es einen gemeinsamen Projektspeicher? Kann man steuern, welcher Thread was liest? | `[•]` |
| Kann man pro Thread ein eigenes Modell wählen? | `[•]` |
| Sind die HGI-Skills (`hgi-hausverwaltung`, `agent-00-masteragent`, `hgi-agent-07`) in den Threads verfügbar? | `[•]` |
| Gilt für Threads dieselbe Freigabepflicht für Werkzeugaufrufe wie im Hauptchat? | `[•]` |

**Abbruch**, wenn Threads nicht existieren oder ihr Speicherzugriff nicht steuerbar ist. Dann bleibt alles wie bisher.

### Phase 2 – Einrichten (Claude bereitet vor, Eddy gibt frei)

1. Neues Projekt `HGI Pilot – Koordinator` anlegen. Kein bestehendes Projekt umbauen.
2. Koordinator = Agent 00 mit dem Regelblock aus Abschnitt 4.
3. Genau **ein** Thread: Agent 07 Posteingang, ebenfalls mit dem Regelblock aus Abschnitt 4.
4. Modellwahl siehe Abschnitt 3.
5. Speicher nach Abschnitt 5 einrichten.

### Phase 3 – Testlauf (Dauer `[•]`, Vorschlag 2 Wochen [geraten])

- **Testdaten:** 20–30 Posteingänge, die bereits manuell zugeordnet sind (Vergleichsbasis). Vorher anonymisieren: keine IBANs, keine Geburtsdaten, keine Daten der Familie Schröder [sicher – Regel aus `hgi-hausverwaltung`, Vertraulichkeit].
- **Ablauf:** Eddy gibt dem Koordinator den Auftrag „Ordne diese Eingänge zu“. Der Koordinator startet Thread 07. Thread 07 liefert je Eingang: Objekt, Vorgang, zuständiger Fachagent, Ablagevorschlag `JJJJ-MM-TT_Objekt_Vorgang_Empfänger`, erkannte Frist (oder `[•]`).
- **Ergebnis bleibt Vorschlag.** Abgelegt wird nichts automatisch.

### Phase 4 – Auswertung (Eddy + Claude)

Erfolgskriterien:

| Kriterium | Zielwert |
|---|---|
| Richtige Objektzuordnung | `[•]` (Vorschlag: mind. 90 % [geraten]) |
| Richtiger Fachagent nach Zuordnungshilfe Agent 00 | `[•]` (Vorschlag: mind. 90 % [geraten]) |
| Erfundene Fristen, Daten oder Beträge | **0** |
| Personenbezogene Daten im gemeinsamen Speicher, die dort nicht hingehören | **0** |
| Eigenmächtige Schreib- oder Versandaktionen | **0** |
| Fristen als konkretes Datum gemeldet oder als `[•]` markiert | 100 % |

Ein einziger Verstoß gegen eine der „0“-Zeilen = Pilot nicht bestanden, unabhängig von der Trefferquote.

### Phase 5 – Entscheidung

- **Bestanden:** Als nächsten Thread 02 Schadensmanagement nur lesend (Tickets auswerten, keine Antworten) aufnehmen. Danach einzeln weiter. Agent 00 Fristenkontrolle zuletzt.
- **Nicht bestanden:** Bisherige Arbeitsweise beibehalten, Befund in der Wissensdatenbank ablegen.

## 3. Modellwahl

| Rolle | Modell | Begründung |
|---|---|---|
| 00 Koordinator | **stark** | Zuordnung, Widersprüche erkennen, später Fristenkontrolle. Fehler hier wirken auf alle Threads [wahrscheinlich]. Das Video empfiehlt das Gegenteil (leichter Koordinator) – für HGI nicht übernehmen. |
| 07 Posteingang (Pilot) | zunächst **stark**, im zweiten Durchlauf leicht | Erst die Vergleichsbasis mit starkem Modell schaffen, dann prüfen, ob ein leichtes Modell dieselbe Quote erreicht. |
| 10 Lernagent (später) | leicht möglich | Reine Zusammenfassung, Ergebnisse bleiben ohnehin ZUR PRÜFUNG. |
| 01, 03, 08 (später) | stark | Fristen, Zahlen, Recht. |

## 4. Regelblock für jeden Thread (unverändert übernehmen)

```
Du arbeitest als Thread im HGI-Agententeam. Es gelten die Skills
hgi-hausverwaltung und agent-00-masteragent; bei Widerspruch gelten
AGENTS.md, START_HIER.md und die ROLLE.md deines Agenten.

1. Nichts raten: Fristen, Daten, Beträge, Namen, Adressen nur aus der
   Quelle. Fehlt etwas, schreibe [•].
2. Keine Schreibaktion in WinCasa, idwell, Vulcavo, Verwaltio, Kalender,
   E-Mail oder Ablage. Du lieferst nur Vorschläge an den Koordinator.
3. Kein Versand. Kein Starten weiterer Threads.
4. Personenbezogene Daten nur so weit, wie der Vorgang sie braucht.
   Keine IBANs, Token, Kennwörter, Geburtsdaten in Ausgabe oder Speicher.
5. Jedes Ergebnis mit: Quelle, Datenstand, logischer Fachagent,
   ausführender Assistent, offene Punkte, nächster Verantwortlicher.
6. Ergebnisse sind ZUR PRÜFUNG, bis Edgard Schröder sie freigibt.
7. Diktat-Angaben (Namen, Beträge, Daten) gesammelt zur Bestätigung
   auflisten; bekannte Verwechslungen rückfragen, nicht korrigieren.
```

## 5. Regeln für den gemeinsamen Speicher

- **Nicht führend.** Führend bleiben `AGENTS.md`, `START_HIER.md`, `ROLLE.md` und die HGI-Wissensdatenbank auf dem Ubuntu-Server. Bei Widerspruch gilt nicht der Projektspeicher [sicher – Regel aus `hgi-hausverwaltung`].
- **Nur Arbeitsstand**, keine Stammdaten-Kopien.
- **Verboten im Speicher:** Zugangsdaten, Token (z. B. Vulcavo), IBANs, Geburtsdaten, Eigentümerdaten der Familie Schröder, private Inhalte.
- **Am Ende jeder Arbeitsphase:** Eintrag für die Wissensdatenbank über Agent 10 bzw. Ablage in `00_Claude`, bis der Serverzugriff aus dem Chat geklärt ist. Erst dann gilt etwas als zentral gespeichert.
- Lässt sich der Speicherzugriff nicht pro Thread einschränken: Speicher im Pilot **nicht benutzen**, Übergabe nur über die Ausgabe des Threads an den Koordinator.

## 6. Risiken

| Risiko | Gegenmaßnahme |
|---|---|
| Funktion existiert nicht oder anders als im Video | Phase 1 als Abbruchpunkt |
| Threads umgehen Freigabepflichten | Pilot nur mit Aufgaben ohne Schreibrechte; Prüfpunkt Phase 1 |
| Gemeinsamer Speicher verteilt Daten an alle Threads | Abschnitt 5; notfalls Speicher aus |
| Zweite „Wahrheit“ neben Server und Rollenmatrix | Speicher ausdrücklich nicht führend |
| Leichtes Modell übersieht Fristen | Fristenthemen erst zuletzt, nur mit starkem Modell |
| Kosten durch viele parallele Threads | `[•]` Kostenrahmen festlegen |

## 7. Offene Punkte an Eddy

- `[•]` Ergebnis Phase 1 (Funktion vorhanden?)
- `[•]` Testzeitraum und Erfolgsquote festlegen
- `[•]` Wer stellt die 20–30 anonymisierten Testeingänge zusammen?
- `[•]` Kostenrahmen für den Pilot
- `[•]` Soll der Pilot in Claude Chat, Cowork oder Claude Code laufen?
