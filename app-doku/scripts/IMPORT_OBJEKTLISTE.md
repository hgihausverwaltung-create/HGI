# Objektimport: Probelauf, Feldfreigabe und Abschlussnachweis

Der Importer führt die 59 aktiven bzw. ausdrücklich vorgesehenen Objekte der hinterlegten Liste. Bestehende Daten werden vor jedem Schreiblauf verglichen. Standardmäßig liest er nur und zeigt den Änderungsplan. Dies ist keine Freigabe für einen Produktivlauf.

Objekt 255 (Detmolder Straße 55) ist nach ausdrücklicher Nutzerbestätigung vom 24.10.2026 archiviert und wird nicht mehr aktiv importiert. Ein schon vorhandener Datensatz wird weder gelöscht noch automatisch umklassifiziert; Originalbelege, Verknüpfungen und die vergebene Nummer bleiben erhalten. Die Exportordnerzahl ist keine Anzahl aktiver Importziele.

```sh
npx tsx scripts/import-objektliste.ts
```

Ein ungelöster Konflikt sperrt den **gesamten** Schreiblauf, einschließlich neuer Objekte, Schlüsselwechsel und noch leerer Klassifikationsfelder. Auch der Probelauf liefert dann Exitcode 1. `KONFLIKT` bedeutet, dass keine der angezeigten Änderungen ausgeführt wird; weitere erforderliche Freigaben sind zuerst zu prüfen.

Für die Übernahme vorhandener abweichender Werte müssen Objekt **und** Felder ausdrücklich benannt sein. Beispiel für die bestätigte PLZ von Loheide 16:

```sh
npx tsx scripts/import-objektliste.ts --uebernehmen=16 --felder=plz
# Erst nach Prüfung des vollständigen Plans und mit Freigabe für die Zieldatenbank:
npx tsx scripts/import-objektliste.ts --ausfuehren --uebernehmen=16 --felder=plz
```

`--uebernehmen=16` ohne `--felder` wird abgewiesen. Der PLZ-Schalter berechtigt nicht zum Zurücksetzen einer manuell geänderten Straße. Gibt es einen weiteren ungelösten Konflikt, bleibt auch die PLZ-Übernahme gesperrt. Mehrere Felder sind mit Komma möglich. Zulässig sind `name,strasse,plz,ort,verwaltungsart,kontoart,gesellschaft,status`. `--uebernehmen=alle` erweitert die Objektmenge, die Feldbegrenzung bleibt bestehen. Unbekannte Argumente, Nummern außerhalb der Importliste und leere Freigaben werden abgewiesen.

Fehlende Klassifikationen können nach vorhandener Listenregel ergänzt werden; unterschiedliche bestehende Werte bleiben Konflikte. Unbekannte Gesellschaften bleiben leer. Der ausdrücklich vorgesehene Wechsel von `AKTIV` auf `IN_PLANUNG` für das Planungsobjekt 227 bleibt erhalten. Das stellt weder Einheiten her noch reaktiviert es archivierte Bestände. Andere Klassifikationen benötigen weiterhin fachliche Prüfung.

## Atomarer Abschluss und Fehler

Objektwrites und `ImportJob=DONE` erfolgen in derselben Datenbanktransaktion. Ein Fehler am DONE-Update liegt damit innerhalb der Transaktion. Ein Ausgabefehler nach dem Commit ändert den gespeicherten Erfolg nicht.

Bei einem Transaktions-/Kommunikationsfehler wird der gespeicherte Job nachgelesen. Bereits vorhandenes `DONE` bleibt erhalten. Kann der Status nicht gelesen werden, lautet das Ergebnis ausdrücklich **unklar**. `FAILED` ist keine pauschale Zusicherung, dass nichts geändert wurde. Vor einer Wiederholung immer Job und Objektzustand nachlesen; es gibt keinen automatischen Neuimport.

Updates vorhandener Objekte sind an deren gelesenen `updatedAt`-Wert gebunden. Eine zwischenzeitliche Änderung bricht die Transaktion ab. Vorwerte geänderter bestehender Objekte werden unter `storage/import-backups/objektliste-<Job-ID>.json` abgelegt. Das JSON wird exklusiv erstellt und ist eine Ergänzung zur Datenbanksicherung, kein vollständiges Restore- oder Löschskript für neue Objekte.

## Fachliche Korrekturen vom 24.10.2026

Objekt **286** umfasst **Apfelstraße 84 und Apfelstraße 86**, gemeinsam unter derselben Objektnummer (Nutzerbestätigung vom 24.10.2026). Name und Importadresse führen deshalb `Apfelstr. 84+86`. Es bleibt ein Objekt; der stabile Schlüssel `wincasa-286` und die Anzahl von 59 Importzielen bleiben erhalten. Damit ist die zuvor offene Adressabweichung fachlich geklärt. Eine bestehende abweichende Adresse oder Bezeichnung bleibt durch die Feldfreigabe geschützt; nach Prüfung des vollständigen Probelaufs kann sie gezielt mit `--uebernehmen=286 --felder=name,strasse` übernommen werden. Diese Klarstellung führt keinen Produktivimport aus und erzeugt keine zusätzlichen Einheiten oder Objekte.

Die PLZ 015=32139, 016=33609, 038=33649 und 200=33649 wurden von Codex unabhängig anhand von Originalbelegen geprüft. Für die drei Bielefelder Adressen bestätigt auch die amtlich veröffentlichte Straßenliste der Finanzverwaltung NRW die entsprechenden Hausnummernbereiche. Siehe [amtliche Straßenliste](https://www.finanzverwaltung.nrw.de/sites/default/files/asset/document/zustaendigkeiten_bielefeld_fa305.pdf), Seiten 32, 51 und 60. Quellsysteme und Ordnernamen wurden dabei nicht verändert.

Gesellschaft 500 ist **Immoquelle GmbH**. Quelle: WinCasa `Stammdaten_Export/export-objekte_b.csv`, Zeile `O_NR=500`, am 24.10.2026 nachgelesen: Bezeichnung `MV Immoquelle GmbH/Kafkastr. 74`; Kontoinhaber `Immoquelle GmbH c/o HGI Immobilien GmbH`. Der Verwalter hinter `c/o` ist nicht die Objektgesellschaft. Eine bestehende abweichende DB-Zuordnung wird weiterhin als Konflikt behandelt und nicht automatisch ersetzt.

## Prüfung und verbleibende Grenzen

```sh
node --test scripts/import-objektliste.test.mjs
```

Die Regressionstests verwenden Node 24, die echte Importerlogik und einen synthetischen Speicheradapter. Sie decken Probelauf, Feldfreigabe, Konfliktsperre, Sicherungsfehler, DONE-Fehler, verlorene Commitbestätigung, parallele Änderungen und Schlüsselwechsel ab. Es sind keine PostgreSQL-/Prisma-Integrationstests und keine Produktivabnahme. TypeScript-Typen werden für diese isolierten Tests entfernt; ein vollständiger Projekt-Typecheck/Build wird dadurch nicht ersetzt.

Die Änderungen stehen **ZUR PRÜFUNG** durch Claude. Ein Merge, DB-Import, eine Migration oder ein Produktivrollout wird dadurch nicht freigegeben. Unicode-/Kurznamenregeln, übrige Gesellschaftszuordnungen, vollständige Datensatzprovenienz und End-to-End-Abnahme bleiben gesonderte Aufgaben.

