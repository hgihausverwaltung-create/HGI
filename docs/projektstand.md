# HGI – Projektstand und Erneuerungsplan

Bestandsaufnahme vom **21.10.2026** anhand von GitHub-Dateien, Branches und Pull Requests.
Ausgangspunkt des Standardzweigs: `494e73447c5ad175d6b7fae930ef7cca51e46c3f` vom 01.09.2026.
Diese Übersicht bestätigt weder eine Installation auf dem HGI-Server noch eine Freigabe für den Echtbetrieb.
Die Dokumentation wurde geprüft; Builds und Anwendungstests wurden bei dieser Bestandsaufnahme nicht ausgeführt.

## Begriffe für den Einstieg

| Begriff | Bedeutung |
|---|---|
| Repository | Projektablage mit Dateien und Änderungshistorie |
| Branch | Separate Arbeitsversion innerhalb dieser Ablage |
| Commit | Gespeicherter Änderungsschritt |
| Pull Request (PR) | Vorschlag, Änderungen eines Zweigs in einen Zielzweig zu übernehmen |
| Draft | Als Entwurf gekennzeichneter Pull Request |
| Merge | Übernahme von Änderungen in den Zielzweig; keine automatische Serverinstallation |
| Fetch origin | Abruf des aktuellen GitHub-Stands und der Zweiginformationen |
| Pull origin | Übernahme verfügbarer Änderungen des aktuellen Zweigs in die lokale Arbeitskopie |

GitHub Desktop zeigt die Dateien genau eines ausgewählten Branches.
Der ungewöhnliche Name `claude/new-session-udlv7n` ist derzeit tatsächlich der Standardzweig;
ein Wechsel zu `main` ist nicht Voraussetzung für das Lesen oder Starten der vorhandenen App.

## 1. Protokoll-App im Standardzweig

| Funktion | Nachgewiesener Stand |
|---|---|
| Formular-Engine, Web-Admin, Objekte/Wohnungen | Integriert über [PR #7](https://github.com/hgihausverwaltung-create/HGI/pull/7) |
| Ausfüllen, Fotos, PDF und Versandablauf | Integriert über [PR #10](https://github.com/hgihausverwaltung-create/HGI/pull/10); Versand simuliert |
| Konfigurierbare E-Mail-Texte | Integriert über [PR #16](https://github.com/hgihausverwaltung-create/HGI/pull/16) |
| iPad-/VPN-Anleitung | Integriert über [PR #13](https://github.com/hgihausverwaltung-create/HGI/pull/13); Dokumentation belegt keine eingerichtete Verbindung |
| Mobile-App und Offline-Sync | [PR #12](https://github.com/hgihausverwaltung-create/HGI/pull/12), offener Entwurf auf `claude/property-management-app-gnkdn1` |
| Zusätzliche Auth-/Formular-Tests und Signaturänderung | [PR #8](https://github.com/hgihausverwaltung-create/HGI/pull/8), offener Entwurf; bei Abruf als nicht konfliktfrei zusammenführbar gemeldet |

Die Web-App ist React/Vite; der Server nutzt Fastify/tRPC und Prisma/PostgreSQL.
Der Formular-Renderer des Standardzweigs verwendet Browser-Elemente.
Die Mobile-Erweiterung in PR #12 enthält einen eigenen nativen Renderer.

### Vor einer Freigabe der Protokoll-App zu klären

1. Testinstallation mit separater Datenbank reproduzierbar starten.
2. E-Mail-Vorlagen-Migration und Versandablauf gegen diese Testdatenbank prüfen.
   Laut PR #16 waren diese Schritte noch nicht durchgeführt.
3. Einen echten E-Mail-Anbieter integrieren und tatsächliche Zustellung nachweisen.
4. Produktive Authentifizierung, Dateispeicher, Berechtigungen, Sicherung und
   Wiederherstellung passend zur gewünschten Betriebsumgebung festlegen und prüfen.
5. Mobile-Kamera und Offline-Synchronisierung auf einem echten Zielgerät prüfen.
   Der Bericht zu PR #12 beschreibt überwiegend Tests über das Web-Ziel von Expo;
   Kamera und vollständiger nativer Ablauf sind noch offen.
6. Erst danach einen konkret geprüften Stand für den Echtbetrieb benennen.

## 2. Separate Dokumenten- und Verwaltungslinie

`app-doku/` ist eine separate Next.js-Anwendung mit eigener Konfiguration und Datenbankstruktur.
Sie wird nicht durch bloßes Übernehmen einzelner Protokoll-App-Dateien zu derselben Anwendung.

| Modul | Zweig / Pull Request | Stand und Abhängigkeit |
|---|---|---|
| Dokumente und grundlegende Stammdaten | `claude/doku-management-mvp`, [#2](https://github.com/hgihausverwaltung-create/HGI/pull/2) | Offener Entwurf gegen den Standardzweig |
| Aufgaben | `claude/aufgaben-management-mvp`, [#9](https://github.com/hgihausverwaltung-create/HGI/pull/9) | Offener Entwurf gegen die Dokumentenlinie |
| Kontakte | `claude/kontakte-management-mvp`, [#11](https://github.com/hgihausverwaltung-create/HGI/pull/11) | Offener Entwurf gegen die Dokumentenlinie |
| Eigentümerversammlungen | `claude/versammlungen-management-mvp`, [#15](https://github.com/hgihausverwaltung-create/HGI/pull/15) | In die Dokumentenlinie übernommen, nicht in den Standardzweig |
| Wirtschaftspläne/Hausgeld | `claude/wirtschaftsplan-management-mvp`, [#17](https://github.com/hgihausverwaltung-create/HGI/pull/17) | Offener Entwurf gegen die Dokumentenlinie; nutzt Versammlungen |
| Tickets/Anliegen | `claude/idwell-ticket-system-7jqoyx`, [#20](https://github.com/hgihausverwaltung-create/HGI/pull/20) | Offener Entwurf gegen die Wirtschaftsplanlinie |

Daraus ergibt sich die zu prüfende Reihenfolge:
Dokumentengrundlage einschließlich Versammlungen → Wirtschaftspläne → Tickets.
Aufgaben und Kontakte sind weitere Zweige der Dokumentenlinie; ihre vollständige gegenseitige
Integration ist aus der PR-Übersicht nicht belegt.

PR #20 beschreibt eine erneute lokale Verifikation am 05.10.2026 und einen Import für
46 Objekte. Das belegt den dort beschriebenen Teststand, nicht einen bereits erfolgten Import
in die produktive HGI-Datenbank. Das Ticketmodul ist eine Eigenentwicklung,
keine funktionierende Live-Anbindung an idwell.

Die README von `app-doku` beschreibt noch einen engeren Funktionsumfang als neuere Pull Requests.
Sie muss bei einer Konsolidierung anhand des endgültigen Codes aktualisiert werden.

## 3. Weitere offene Arbeiten

| Thema | Quelle | Einordnung |
|---|---|---|
| Lesezugriff für Claude je Arbeitsplatz | [PR #22](https://github.com/hgihausverwaltung-create/HGI/pull/22) | Offener Entwurf; Skripte und Anleitung, tatsächliche Installation nicht geprüft |
| Protokollerstellung nach Eigentümerversammlung | [PR #18](https://github.com/hgihausverwaltung-create/HGI/pull/18), [PR #19](https://github.com/hgihausverwaltung-create/HGI/pull/19) | Zwei offene, ähnlich beschriebene Vorschläge; vor Übernahme auf Überschneidungen prüfen |
| Ergänzungen der HGI-Arbeitsregeln | [PR #4](https://github.com/hgihausverwaltung-create/HGI/pull/4), [PR #21](https://github.com/hgihausverwaltung-create/HGI/pull/21) | Offene Entwürfe; fachliche Aussagen gesondert prüfen |
| Duplikate-Finder | [PR #14](https://github.com/hgihausverwaltung-create/HGI/pull/14) | Offener Entwurf; unabhängig von der Protokoll-App bewerten |
| Windows-Installationshilfen | [PR #1](https://github.com/hgihausverwaltung-create/HGI/pull/1) | Offener Entwurf; laut Beschreibung Windows-Prüfung noch offen |

Die Statusangaben sind eine datierte Momentaufnahme. Vor jeder Übernahme den aktuellen
Zielzweig, Änderungen, Konflikte und Testnachweise erneut prüfen.

## 4. Nächste Schritte für die Erneuerung

1. **Orientierung aktualisieren:** README, technische Arbeitsanweisung und diese Übersicht
   aufeinander abstimmen.
2. **Ziel festlegen:** Protokoll-App und interne Dokumentenverwaltung als getrennte Anwendungen
   betreiben oder eine gemeinsame Oberfläche planen. Das ist eine noch offene Architekturentscheidung.
3. **Dokumentenlinie konsolidieren:** die oben genannten Abhängigkeiten auf einem Integrationszweig
   prüfen; Datenbankänderungen mit einer separaten Testdatenbank durchlaufen.
4. **Parallelzweige prüfen:** Aufgaben, Kontakte, Mobile/Offline sowie zusätzliche Tests gezielt
   einarbeiten und Überschneidungen der Protokoll-Skills bereinigen.
5. **Betriebsstand prüfen:** Tatsächliche Serverinstallation, Datenbankversion, Schnittstellen,
   Versand und Sicherung mit dem geprüften Code abgleichen.
6. **Erst nach Verifikation aufräumen:** doppelte/überholte PRs und Zweige nachvollziehbar abschließen.
   Ein Zweigname oder ein erfolgreicher Merge ist keine Freigabe für den Echtbetrieb.

## 5. Auf dem eigenen Rechner lesen

In GitHub Desktop `Repository → Show in Explorer` öffnen.
Zuerst `README.md`, danach diese Datei und die fachlichen Dokumente unter `docs/` lesen.
Über `Fetch origin` die aktuellen Zweige abrufen. `Pull origin` aktualisiert nur den
gerade ausgewählten Zweig; es übernimmt keine anderen Entwicklungszweige.

Programme, Paketinstallationen und Datenbankbefehle sind zum bloßen Lesen der Dateien nicht erforderlich.
