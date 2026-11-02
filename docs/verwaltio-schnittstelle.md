# Verwaltio – Funktionsumfang der Claude-Schnittstelle (MCP)

Stand: 02.11.2026 · geprüft am Live-Konto `hgiimmobilien@verwaltio.de` · erstellt von Claude (Agent 00, Koordination)

Die Schnittstelle bietet **220 Werkzeuge** (Liste aus Verwaltio, `get_arbeitshinweise`). Was hier nicht steht, ist über die Schnittstelle nicht möglich.

## 0. Das Wichtigste vorab

1. **Keine Anrufe.** Die Schnittstelle hat kein Telefon-Werkzeug: keine Anruflisten, kein Wählen, keine Gesprächsnotizen aus einer Telefonanlage. Ein Telefonat lässt sich nur als Ticketnotiz (`add_ticket_note`), Aufgabe (`create_todo`) oder Termin (`create_event`) festhalten. [sicher]
2. **Kein eigenes E-Mail-Postfach verbunden.** E-Mails gehen derzeit über den Standard-Absender von Verwaltio. Im Konto ist **keine Signatur** hinterlegt, deshalb fehlt die HGI-Signatur. Eingehende Mails kommen nur über `hgiimmobilien@verwaltio.de` an, der Posteingang ist leer. Einrichten: Verwaltio → Einstellungen → E-Mail-Konten. [sicher]
3. **ETV vom 28.09.2026 (Queller Str. 72) steht noch auf „geplant“.** Es sind 0 Beschlüsse und kein Protokoll erfasst, auch nicht zu TOP 2 „Bestellung der HGI zur Verwalterin“. Die Bestellung der HGI ist in Verwaltio damit nicht belegt. **Über die Schnittstelle lassen sich die Beschlüsse einer Präsenzversammlung nicht eintragen**: Es gibt dafür kein Feld und kein Werkzeug. Das geht nur in der Verwaltio-Oberfläche. [sicher]
4. **Viele Aktionen wirken sofort und ohne Rückfrage in Verwaltio**: E-Mail, Brief, Mahnung, Portalnachricht, Buchung, Rechnung. Claude zeigt vorher Empfänger, Text und Betrag und führt erst nach deiner ausdrücklichen Freigabe aus.
5. **Ganz gesperrt:** Löschen, Mieterauszug und Wohnungsübergabe. Ebenfalls gesperrt sind das Beschließen bzw. Festschreiben von Wirtschaftsplan und Jahresabrechnung, die Freigabe eines Eigentümerwechsels und die Zuordnung von Bankkonten zu Objekten. Das alles geht nur in der Oberfläche.
6. **Sensible Felder sieht Claude nicht:** IBAN, Geburtsdatum, Steuernummer und Einkommen. Ein fehlendes Feld heißt also nicht, dass es in Verwaltio leer ist. Eine IBAN *eintragen* geht dagegen.

### Legende

| Kürzel | Bedeutung |
|---|---|
| **L** | nur lesen |
| **E** | legt einen Entwurf an bzw. ändert intern nichts Endgültiges (Freigabe in einem zweiten Schritt) |
| **S** | schreibt sofort in Verwaltio (Stammdaten, Buchungen, Tickets), ohne Außenwirkung |
| **X** | **Außenwirkung**: verschickt E-Mail, Brief, Portal- oder Push-Nachricht, Mahnung oder Rechnung, oder kostet Porto |
| \* | Funktion aus Werkzeugname und Bereich abgeleitet, die Detailbeschreibung wurde nicht einzeln geprüft |

Die Spalte **Agent** gibt den zuständigen HGI-Fachagenten an, nach der Rollenmatrix vom 24.09.2026.

---

## 1. Suchen, Nachschlagen, Navigation (Agent 00)

| Werkzeug | Art | Was es tut |
|---|---|---|
| `find_entity` | L\* | Einen benannten Datensatz finden (Objekt, Einheit, Kontakt, Ticket …) und dessen ID ermitteln. Pflicht vor jeder Aktion, IDs werden nie geraten |
| `find_recent_entity` | L\* | Zuletzt bearbeitete Datensätze |
| `list_entities` | L | Vollständige Listen: tenant, property, unit, owner, vendor, contact, document, ticket, expense, todo, event, insurance, meter, anlage |
| `find_team_member` / `list_team_members` | L\* | Teammitglieder und ihre User-ID (für Zuweisungen) |
| `get_portfolio_summary` | L | Dashboard-Kennzahlen des gesamten Kontos |
| `navigate` | L\* | Link auf die passende Seite in der Verwaltio-Oberfläche |
| `academy_lookup` | L | Bedienungsanleitungen der Verwaltio Academy |
| `get_arbeitshinweise` | L | Regeln, Glossar und Werkzeugliste dieser Schnittstelle |
| `get_job_status` | L | Ergebnis länger laufender Aufträge abholen |
| `report_problem` | X\* | Fehler eines Werkzeugs an Verwaltio melden |

## 2. Leitfaden (kontoweite Arbeitsregeln) (Agent 00 / 10)

| Werkzeug | Art | Was es tut |
|---|---|---|
| `get_leitfaden` | L\* | Gespeicherte Arbeitsregeln des Kontos lesen |
| `leitfaden_vorschlagen` | E\* | Regel vorschlagen |
| `leitfaden_eintragen` / `leitfaden_aendern` | S\* | Regel eintragen bzw. ändern |

## 3. Objekte und Einheiten (Agent 00 / 03)

| Werkzeug | Art | Was es tut |
|---|---|---|
| `create_property` | S | Neues Objekt mit Einheiten, Kontenrahmen und Verteilerschlüsseln. Die Verwaltungsart (MIET/WEG/SEV) wird immer bei dir erfragt, PLZ und Ort nie erfunden |
| `create_unit` / `edit_unit` | S | Einheit anlegen bzw. ändern (Fläche, MEA, Hausgeld, Ausstattung, Mietspiegelmerkmale, Stellplatz, Förderung …) |
| `edit_property` | S\* | Objekt-Stammdaten ändern |
| `analyze_teilungserklaerung` | L | Teilungserklärung (PDF) auslesen: Einheiten, MEA, Sondernutzungsrechte, Gemeinschaftsordnung. Legt nichts an |
| `check_teilungserklaerung` | L\* | Ausgelesene Teilungserklärung gegen den Bestand prüfen |
| `create_weg_from_teilungserklaerung` | S\* | WEG samt Einheiten und MEA aus der Teilungserklärung anlegen |
| `analyze_import_file` | L | Mieter-, Objekt-, Eigentümer- oder Kontaktlisten aus anderer Software (z. B. WinCasa-Export, Excel, PDF) auslesen und mit dem Bestand abgleichen. Legt nichts an |
| `import_stammdaten` | S\* | Ausgelesene Listen übernehmen. **Massenänderung: vorher Trockenlauf und Datensicherung** |
| `get_property_360` / `get_unit_360` | L | Gesamtbild eines Objekts bzw. einer Einheit |

## 4. Mieter, Eigentümer, Dienstleister, Kontakte

| Werkzeug | Art | Was es tut | Agent |
|---|---|---|---|
| `create_contact` / `edit_contact` | S\* | Kontakt anlegen bzw. ändern | 07 |
| `get_contact_360` | L\* | Alles zu einer Person (Rollen, Verhältnisse, Konten) | 00 |
| `get_relationships` | L\* | Miet- und Eigentumsverhältnisse mit Konditionen | 09 |
| `create_owner` / `edit_owner` | S | Eigentümer anlegen (auch Miteigentum, Bruchteile, Grundbuch) bzw. ändern | 01/03 |
| `eigentuemerwechsel_vormerken` | S | Verkauf einer WEG-Einheit vormerken, auf Wunsch mit Ticket. **Freigabe nur in der Oberfläche** | 01/03 |
| `create_tenant` / `edit_tenant` | S | Mieter bzw. Mietverhältnis: Miete, Kaution, Staffel- oder Indexmiete, Kündigungsverzicht … | 09 |
| `create_keller_mitvermietung` | S\* | Keller mitvermieten | 09 |
| `create_untermieterlaubnis` / `edit_untermieterlaubnis` | S | Untermieterlaubnis inkl. Zuschlag und Widerruf | 09 |
| `create_vendor` / `edit_vendor` | S\* | Kreditor bzw. Handwerker anlegen oder ändern | 05 |
| `create_service_contract` / `edit_service_contract` / `get_service_contracts` | S/L\* | Dienstleistungs- und Wartungsverträge | 05 |
| `settle_service_contract` | S\* | Servicevertrag abrechnen | 03 |
| `invite_to_portal` | **X** | Einladung ins Kundenportal per E-Mail | 06 |

## 5. Mietverhältnis, Vermietung, Miete (Agent 09)

| Werkzeug | Art | Was es tut |
|---|---|---|
| `get_vacancy_pipeline` | L\* | Leerstand und Bewerber je Einheit |
| `create_applicant` / `edit_applicant` | S | Bewerberakte. Es geht keine E-Mail an Bewerber |
| `read_applicant_form` | L\* | Interessentenbogen auslesen |
| `plan_viewings` | E\* | Besichtigungen planen |
| `get_rent_increase_potential` / `assess_rent_increase` | L\* | Mieterhöhungspotenzial bzw. Prüfung einer Erhöhung |
| `prepare_rent_increases` | E\* | Mieterhöhungen vorbereiten |
| `set_comparative_rent` | S\* | Vergleichsmiete hinterlegen |
| `get_deposit_status` | L\* | Stand der Kautionen |
| `kaution_eingang_buchen` | S\* | Kautionseingang buchen (Agent 05) |
| `kaution_abrechnen` | S\* | Kaution abrechnen (Agent 05). **Prüfen, ob dabei etwas versendet wird** |

## 6. Zahlungen und Mahnwesen (Agent 03)

| Werkzeug | Art | Was es tut |
|---|---|---|
| `get_open_payments` | L\* | Offene Forderungen |
| `get_tenant_account` / `get_account_statement` | L\* | Mieter- bzw. Personenkonto, Kontoauszug |
| `get_financial_summary` | L\* | Finanzkennzahlen |
| `generate_payments` | S | Sollstellungen eines Monats für alle Mieter erzeugen |
| `record_payment` | S | Zahlung auf eine Forderung buchen (sofort) |
| `reopen_payment` | S\* | Fehlgebuchte Zahlung wieder öffnen |
| `ratenplan_anlegen` / `ratenplan_beenden` | S\* | Ratenzahlung |
| `mahnsperre_setzen` / `mahnsperre_aufheben` | S\* | Mahnsperre |
| `mahnlauf_vorschau` | L\* | Wer würde gemahnt (immer vor dem Mahnlauf) |
| `send_payment_reminder` | **X** | Mahnung an einen Mieter über alle offenen Posten, mit Gebühr |
| `payment_reminder_escalate` | **X**\* | Mahnung mit Wiedervorlage bzw. nächste Stufe |
| `bulk_payment_reminders` | **X** | Mahnlauf an alle säumigen Mieter **oder Eigentümer (Hausgeld)**, gedeckelt auf die bestätigte Empfängerzahl |
| `create_sepa_mandate` / `edit_sepa_mandate` | S | SEPA-Mandat für Miete oder Hausgeld |

## 7. WEG: Eigentümerversammlung, Beschlüsse, Wirtschaftsplan, Abrechnung (Agent 01 / 03)

| Werkzeug | Art | Was es tut |
|---|---|---|
| `get_weg_overview` | L | Hausgeld, Rückstände, Rücklagen, offene Beschlüsse, nächste ETV mit Rückmeldungen, USt-Option |
| `get_weg_meetings` | L | Versammlungen mit TOPs, Beschlüssen, Stimmverhältnis, Anfechtungsfrist (§ 45 WEG) und Umsetzungsstand |
| `create_weg_meeting` | S | ETV anlegen: Datum, Art, Ort, Präsenz/online/hybrid, Leitung, Ladungsfrist, Einladungstext, TOPs mit Beschlussantrag, Vollmacht und Stimmzettel als Beilage, Kalendereintrag. **Verschickt keine Einladung** |
| `edit_weg_meeting` | S | Geplante ETV ändern, TOPs anhängen oder ersetzen (TOPs mit Beschluss bleiben). **Verschickt keine Einladung. Beschlüsse und Protokoll lassen sich hier nicht eintragen** |
| `umlaufbeschluss_anlegen` | E | Umlaufbeschluss (§ 23 Abs. 3 WEG) als Entwurf |
| `umlaufbeschluss_starten` | **X** | Startet die Abstimmung: Eigentümer bekommen Push und Mail |
| `umlaufbeschluss_verkuenden` | **X** | Stellt das Ergebnis fest und verkündet es; erst danach gibt es den Beschluss. Ab hier läuft die Anfechtungsfrist |
| `get_wirtschaftsplan` | L\* | Wirtschaftsplan mit Vorschüssen je Einheit |
| `create_wirtschaftsplan` / `edit_wirtschaftsplan` | E | Wirtschaftsplan-Entwurf (aus Vorjahr + %, aus Kontenrahmen oder aus Positionen). **Beschließen nur in der Oberfläche** |
| `get_jahresabrechnung` | L\* | Jahresabrechnung je Einheit |
| `jahresabrechnung_berechnen` | E | Abrechnung als Entwurf berechnen |
| `jahresabrechnung_status_setzen` | S | Status „erstellt“ oder „geprüft“. **Beschließen, Festschreiben und Versand nur in der Oberfläche** |
| `abrechnungsspitzen_buchen` | S\* | Abrechnungsspitzen buchen |

**Für die ETV-Einladung** gibt es keinen eigenen Versandknopf. Möglich sind zwei Wege: über `send_message` je Eigentümer als E-Mail mit Anhang oder als Brief über LetterXpress (kostenpflichtig), oder Versand aus der Oberfläche. Es gilt die HGI-Ladungsfrist von 23 Tagen (21 + 2). Vulcavo bleibt nach heutigem Stand das führende ETV-System. Verwaltio-ETV und Vulcavo laufen nicht synchron, wenn beide genutzt werden.

## 8. Betriebskostenabrechnung Mietverwaltung (Agent 03)

| Werkzeug | Art | Was es tut |
|---|---|---|
| `prepare_utility_billing` | E\* | BKA vorbereiten |
| `compute_utility_billing` | E\* | BKA berechnen |
| `generate_utility_billing` | S/X\* | BKA erzeugen. **Prüfen, ob dabei versendet wird** |
| `get_bk_einwendungen` / `einwendung_erfassen` | L/S\* | Einwendungen von Mietern |
| `einwendung_beantworten` | X\* | Einwendung beantworten |
| `list_annual_cost_items` / `create_annual_cost_item` / `edit_annual_cost_item` / `get_annual_cost_item_bookings` | L/S\* | Kostenpositionen der Abrechnung |

## 9. Belege, Bank, Buchhaltung (Agent 03, bei internen Gesellschaften 04)

| Werkzeug | Art | Was es tut |
|---|---|---|
| `create_expense` | E | Beleg als Entwurf in der Belegfreigabe, mit Kreditor, Konto, Verteilung auf die Einheiten und PDF |
| `confirm_expense` | S\* | Entwurf buchen (nach Freigabe) |
| `edit_expense` / `get_expenses` | S/L | Beleg ändern bzw. lesen |
| `get_bank_accounts` / `get_bank_transactions` / `get_unmatched_transactions` | L\* | Konten, Umsätze, nicht zugeordnete Umsätze |
| `match_bank_transaction` | S\* | Zahlungseingang einer Forderung zuordnen |
| `book_transaction_as_expense` | S | Abbuchung als Beleg buchen und zuordnen (bis 50 auf einmal) |
| `split_bank_transaction` | S\* | Umsatz aufteilen |
| `edit_bank_account` | S | Bezeichnung, Gruppe, Kontostand bei manuellen Konten |
| `vorkontierungsregel_anlegen` / `_aendern` | S\* | Automatische Vorkontierung |
| `get_journal` / `get_kontoblatt` / `get_summen_salden` / `get_datev_status` | L\* | Journal, Kontenblatt, Summen- und Saldenliste, DATEV-Stand |
| `edit_booking` | S | Buchung ändern (offene Periode, vor DATEV) |
| `cancel_booking` | S | Buchung aufheben (offene Periode, vor DATEV), sonst nur Storno in der Oberfläche |
| `get_kontenrahmen` / `get_kontenrahmen_vorlage` | L\* | Kontenrahmen des Objekts bzw. die Vorlage |
| `create_account` / `edit_account` | S\* | Konto im Objekt |
| `create_verteilerschluessel` / `edit_verteilerschluessel` | S\* | Umlageschlüssel |
| `edit_kontenrahmen_vorlage` | S | Kontoweite Vorlage, gilt für künftige Objekte |
| `switch_kontenrahmen` | S\* | Kontenrahmen wechseln. **Folgenreich** |

## 10. Ausgangsrechnungen und Verwalterhonorar (Agent 03 / 04)

| Werkzeug | Art | Was es tut |
|---|---|---|
| `honorarlauf_vorschau` | L\* | Welche Honorare fällig sind |
| `honorarrechnungen_erstellen` | **X/S** | Echte Honorarrechnungen mit fortlaufender Nummer, je Objekt |
| `dauermietrechnung_erstellen` | S\* | Dauerrechnung (Gewerbe/USt) |
| `abrechnungsrechnung_nummer` | S\* | Rechnungsnummer für eine Abrechnung |
| `get_ausgangsrechnungen` | L\* | Ausgangsrechnungen |

## 11. Tickets und Wartung (Agent 02, Wartungsverträge 05)

| Werkzeug | Art | Was es tut |
|---|---|---|
| `get_tickets` | L | Alle offenen Tickets inkl. Mieterportal-Meldungen; Filter nach Status, Priorität, Objekt, Art; Sortierung nach Alter |
| `get_ticket` | L\* | Ein Ticket mit Verlauf |
| `analyze_tickets` | L\* | Auswertung der Tickets |
| `create_maintenance` | S | Ticket anlegen: Art, Priorität, Fälligkeit, Erinnerungen, Checkliste, Handwerker (vendorId), Bearbeiter, Wiederholung, Epic/Unterticket |
| `edit_maintenance` | S (X bei Portal) | Alles am Ticket ändern; Statusmail an den Mieter nur mit ausdrücklicher Freigabe |
| `assign_maintenance` | S | Teammitglied zuweisen |
| `add_ticket_note` | S | Interne Notiz, der Mieter sieht sie nicht. **Hier lassen sich auch Telefonate festhalten** |
| `get_ticket_portal` | L\* | Für wen ein Ticket im Portal freigegeben ist |
| `share_ticket_portal` | S/X | Ticket für Mieter oder Eigentümer im Portal freigeben, auf Wunsch mit Mail |
| `send_ticket_portal_message` | **X** | Mitteilung an die Freigegebenen (Portal, Push, E-Mail) |

## 12. Aufgaben, Termine, Fristen (Agent 00)

| Werkzeug | Art | Was es tut |
|---|---|---|
| `get_briefing` | L\* | Tagesbriefing |
| `get_upcoming_deadlines` | L\* | Anstehende Fristen in Verwaltio |
| `create_todo` / `edit_todo` / `assign_todo` | S\* | Aufgaben |
| `create_event` / `edit_event` / `get_events` | S/L\* | Termine im Verwaltio-Kalender |

Hinweis: Die zentrale HGI-Fristenliste bleibt der Google-Kalender „HGI Fristen“. Verwaltio-Fristen müssen dorthin übertragen werden. Ein automatischer Abgleich existiert nicht.

## 13. Zähler, Schlüssel, Anlagen, Prüfungen, Versicherungen

| Werkzeug | Art | Was es tut | Agent |
|---|---|---|---|
| `get_meters` / `create_meter` / `edit_meter` | L/S\* | Zähler | 03 |
| `get_meter_readings` / `get_meter_consumption` | L\* | Stände, Verbrauch | 03 |
| `record_meter_reading(s)` | S | Ablesungen buchen; auffällige Stände werden gemeldet und erst nach Rückfrage gebucht | 03 |
| `plan_meter_reading` | E\* | Ablesung planen | 03 |
| `get_key_inventory` / `get_key_handovers` / `create_key` / `edit_key` / `hand_over_keys` | L/S\* | Schlüsselbestand und -übergaben | 05/09 |
| `get_building_systems` / `create_building_system` / `edit_building_system` | L/S\* | Anlagen (Heizung, Wärmepumpe, Lüftung, Aufzug …) | 05 |
| `get_inspections` / `create_inspection` / `edit_inspection` / `record_inspection_result` | L/S\* | Wiederkehrende Prüfungen mit Intervall und Fälligkeit. Intervalle sind Richtwerte, keine gesetzten Fristen | 05 |
| `get_insurance_overview` / `create_insurance` / `edit_insurance` | L/S\* | Policen | 05 |
| `report_insurance_claim` | S | Schaden an der Police anlegen; die Meldung an den Versicherer geht danach separat per `send_message` (X) | 02 |

## 14. Post, E-Mail, Briefe (Agent 06, Posteingang 07)

| Werkzeug | Art | Was es tut |
|---|---|---|
| `get_inbox` | L | Posteingang mit Filter nach ungelesen, nicht zugeordnet, Objekt |
| `get_conversation` | L | Mailverlauf mit Anhängen |
| `assign_conversation` | S | Mail einem Kontakt zuordnen |
| `update_conversations` | S | Gelesen/ungelesen, archivieren, Spam (bis 100 auf einmal) |
| `list_mailboxes` | L | Absender-Postfächer und Signaturen (derzeit keine) |
| `create_email_draft` / `update_email_draft` / `list_email_drafts` | E | **E-Mail-Entwurf ohne Versand.** Du prüfst und sendest selbst in Verwaltio. Bevorzugter Weg |
| `send_message` | **X** | Sendet sofort eine E-Mail (mit bis zu 5 Anhängen, Cc/Bcc) oder einen Brief per LetterXpress (kostenpflichtig; Farbe, einseitig, Einschreiben Einwurf/Übergabe, Versanddatum wählbar). Mit „nur_erstellen“ entsteht nur ein PDF |
| `send_letter` | **X** | Bereits angelegten Brief per Post versenden (Porto) |
| `search_templates` / `get_template` | L\* | Eigene Vorlagen |

**Nicht vorhanden:** WhatsApp, SMS, Telefon, Fax. [sicher, nach der Werkzeugliste]

## 15. Team-Chat (Agent 00)

| Werkzeug | Art | Was es tut |
|---|---|---|
| `list_chat_channels` / `get_chat_catchup` / `search_chat` | L\* | Kanäle, Neuigkeiten, Suche |
| `post_chat_message` | **X** (intern) | Nachricht im Namen der verbundenen Person |

## 16. Dokumente und Verträge (Agent 07, Verträge 05/09)

| Werkzeug | Art | Was es tut |
|---|---|---|
| `request_document_upload` / `get_document_upload` | S | Datei nach Verwaltio hochladen |
| `import_document_from_cloud` / `import_document_from_url` | S\* | Aus Google Drive, OneDrive, Dropbox oder einer URL holen |
| `search_documents` / `get_document` / `list_document_folders` | L\* | Ablage durchsuchen und lesen |
| `file_document` / `edit_document` | S\* | Ablegen, umbenennen, zuordnen |
| `generate_document` | E/S\* | Dokument aus Standardvorlage |
| `create_template_draft` / `update_template_draft` / `confirm_template_draft` | E → S | Eigene Vorlage ausfüllen; erst `confirm` erzeugt das PDF |
| `generate_contract` / `confirm_contract` | E → S\* | Mietvertrag erzeugen |
| `get_signature_requests` | L\* | Stand der digitalen Unterschriften |

## 17. Automationen (Agent 00, nur mit Freigabe)

| Werkzeug | Art | Was es tut |
|---|---|---|
| `list_automations` / `get_automation` / `get_automation_runs` / `get_automation_catalog` / `list_automation_templates` | L\* | Bestand, Läufe, Katalog |
| `create_automation` / `update_automation` / `duplicate_automation` / `use_automation_template` | S\* | Automation anlegen oder ändern |
| `toggle_automation` | S/X\* | Ein- und ausschalten. **Eingeschaltet kann sie selbständig versenden** |
| `test_automation` | L\* | Probelauf ohne Versand, immer vorher |
| `run_automation` | **X** | Führt echt aus: E-Mails, Briefe, Mahnungen, Aufgaben |
| `list_automation_approvals` / `decide_automation_approval` | L/S(X)\* | Freigaben ausstehender Automationsschritte |

---

## 18. Was über die Schnittstelle NICHT geht

| Vorgang | Weg |
|---|---|
| Telefonie (Anrufe, Anruflisten, Rückrufe) | Nicht in Verwaltio-MCP. Nur als Notiz, Aufgabe oder Termin dokumentieren |
| WhatsApp, SMS | Nicht vorhanden |
| Löschen jeglicher Datensätze | Verwaltio-Oberfläche |
| Mieterauszug, Wohnungsübergabe | Verwaltio-Oberfläche |
| Beschlüsse und Protokoll einer Präsenz-ETV eintragen | Verwaltio-Oberfläche (bzw. Vulcavo) |
| ETV-Einladung „auf Knopfdruck“ an alle | Oberfläche oder `send_message` je Eigentümer |
| Wirtschaftsplan / Jahresabrechnung beschließen, festschreiben, versenden | Verwaltio-Oberfläche |
| Eigentümerwechsel freigeben (Forderungen umstellen) | Verwaltio-Oberfläche |
| Storno nach DATEV-Übergabe oder in festgeschriebener Periode | Verwaltio-Oberfläche |
| Bankkonto einem Objekt zuordnen, Zahlungsfreigaben, Limits | Verwaltio-Oberfläche |
| IBAN, Geburtsdatum, Steuernummer lesen | Nicht lesbar (Datenschutz) |
| E-Mail-Postfach verbinden, Signatur anlegen | Einstellungen → E-Mail-Konten |

## 19. Live-Stand des Kontos am 02.11.2026

- 1 Objekt: **WEG Queller Str. 72, 33649 Bielefeld** (Objekt 72), 4 Einheiten, 346,23 m², 5 Eigentümer, 7 Kreditoren
- 6 offene Tickets (T-1 bis T-7, ohne T-6), alle seit 06.10.2026. **T-1 „Handlauf locker“ hat Priorität hoch, keine Fälligkeit und keinen Handwerker**
- Hausgeld-Rückstand 846,32 € aus 24 Sollstellungen, aufgeschlüsselt in Abschnitt 21.7. Eine frühere Annahme, es sei „keine Zahlung verbucht“, war falsch: Bezahlt sind 8.411,50 € Hausgeld
- Keine Anlagen, keine Zähler erfasst, obwohl Wärmepumpe und Lüftungsanlage existieren (T-4, T-5)
- 1 ETV: außerordentlich, 28.09.2026, Verwalterbestellung. Status „geplant“, 0 Beschlüsse, kein Protokoll
- Posteingang leer, kein Postfach, keine Signatur

## 20. Arbeitsregeln für Claude mit Verwaltio (HGI)

1. IDs immer per `find_entity` / `list_entities` ermitteln, nie raten.
2. Vor jeder S-Aktion in einem Satz sagen, was passiert und an welchem Objekt bzw. welcher Einheit.
3. Vor jeder X-Aktion Empfänger, Betreff, vollständigen Text, Betrag und Druckoptionen zeigen. Erst nach ausdrücklicher Freigabe durch Edgard Schröder ausführen. Bei Diktat-Eingaben vorher die Bestätigungsliste (Namen, Adressen, Beträge, Daten) vorlegen.
4. E-Mails bevorzugt als Entwurf (`create_email_draft`) anlegen. Direktversand nur auf ausdrücklichen Wunsch.
5. Massenaktionen (Mahnlauf, Import, Honorarlauf, Automation): erst Vorschau bzw. Test, dann mit gedeckelter Anzahl. Bei Importen vorher Datensicherung.
6. Kündigungen, Abmahnungen, Vollmachten und Verwalterzustimmungen nur nach Rücksprache mit Herrn Schröder.
7. Fristen aus Verwaltio in den Kalender „HGI Fristen“ übernehmen (Agent 00).

---

## 21. Finanzen im Detail: Sollstellung, Buchhaltung, Kontoabruf, Lastschrift, Bankabgleich

Stand: 02.11.2026. Alle Werkzeuge dieses Abschnitts wurden mit ihrer vollständigen Beschreibung geprüft, außer denen mit \*.

### 21.1 Sollstellungen anlegen

| Vorgang | Über die Schnittstelle | Werkzeug / Weg |
|---|---|---|
| Miet-Sollstellungen eines Monats für alle Mieter | **ja** | `generate_payments` (Monat, Jahr). Bereits vorhandene werden nicht überschrieben |
| Mietänderung ab Stichtag (auch rückwirkend) | **ja** | `edit_tenant` mit `wirksamAb`: Offene Sollstellungen werden angepasst, bereits gebuchte storniert und neu gebucht, bezahlte bleiben |
| Staffel- und Indexmiete | **ja** (Stammdaten) | `edit_tenant` (`rentSteps`, Index-Felder) |
| Hausgeld-Sollstellungen WEG | **ja, indirekt** | Aus dem Wirtschaftsplan (`create_wirtschaftsplan` / `edit_wirtschaftsplan`, inkl. `gueltigAb`, Turnus, Rundung). Ohne Wirtschaftsplan aus dem Hausgeld der Einheit (`edit_unit`: `hausgeld` + `hausgeldReserve`) |
| Nachzahlungen aus der Jahresabrechnung | **ja**, nur nach Beschluss | `abrechnungsspitzen_buchen` (Zahlungsziel Standard 30 Tage) |
| Kautionsforderung | **ja** | `edit_tenant` (`deposit`, `depositStatus` „offen“) |
| Einzelne freie Sollstellung (Sonderumlage, Nebenforderung, Schadensersatz) | **nein** | Kein Werkzeug. Nur in der Verwaltio-Oberfläche |
| Ratenplan zu einer Forderung | ja\* | `ratenplan_anlegen` / `ratenplan_beenden` |

### 21.2 Zahlungen buchen

| Vorgang | Über die Schnittstelle | Werkzeug |
|---|---|---|
| Mietzahlung auf Forderung (auch Teilzahlung, auch nur ein Bestandteil) | **ja**, bucht sofort | `record_payment` |
| Fehlbuchung rückgängig | **ja** | `reopen_payment` (öffnet die ganze Forderung, Bankumsatz wird wieder frei) |
| **Hausgeld-Zahlung ohne Bankumsatz** (bar, Verrechnung) | **nein** | `record_payment` gilt nur für Miete. Nur in der Oberfläche |
| Hausgeld-Zahlung mit Bankumsatz | ja | über den Bankabgleich (`match_bank_transaction` / `split_bank_transaction`) |
| Kautionseingang | ja\* | `kaution_eingang_buchen` |

### 21.3 Kontoabruf (Bankumsätze holen)

| Vorgang | Über die Schnittstelle |
|---|---|
| Kontoabruf / Bank-Synchronisation **auslösen** | **nein**, kein Werkzeug |
| Kontoauszug-Datei (CAMT/MT940/CSV) importieren | **nein**, nur in der Oberfläche |
| Konten, Saldo, letzten Abruf lesen | ja: `get_bank_accounts` (einzige Stelle mit IBAN) |
| Umsätze lesen und durchsuchen | ja: `get_bank_transactions` (Suche, Betrag, Richtung, Zeitraum, Zuordnungsstand) |
| Kontostand bei Konten ohne Bankabruf eintragen | ja: `edit_bank_account` (`kontostand`, `kontostandAm`) |
| Bankkonto einem Objekt zuordnen, Zahlungsfreigaben, Limits | **nein**, nur in der Oberfläche |

### 21.4 Lastschriften und Einzüge (SEPA)

| Vorgang | Über die Schnittstelle | Werkzeug |
|---|---|---|
| Mandat anlegen (Miete oder Hausgeld, CORE/B2B, Betrag, Einzugstag) | **ja** | `create_sepa_mandate`. IBAN nur wie genannt. Ohne Unterschriftsdatum entsteht ein Entwurf |
| Mandat ändern: Status Entwurf / versandt / aktiv / pausiert, neue Bankverbindung, Betrag, Einzugstag, Laufzeit | **ja** | `edit_sepa_mandate`. Aktivieren braucht ein Unterschriftsdatum |
| Übernommenes Mandat (Vorverwaltung) | ja | `letzterEinzugExtern` setzen |
| Mandat **widerrufen** | **nein** | eigener Schritt in der Oberfläche |
| **Lastschrift-Einzug / Sammeleinzug erzeugen oder ausführen** (SEPA-XML, Bankeinreichung) | **nein** | kein Werkzeug, nur in der Oberfläche |
| Gutschrift eines eigenen Sammeleinzugs auf die Einzelforderungen verteilen | **ja** | `split_bank_transaction` mit `sammeleinzugId`. Bei Abweichungen wird nichts gebucht |
| Rücklastschrift erfassen | **nein**, kein eigenes Werkzeug | in der Oberfläche. `reopen_payment` öffnet nur die Forderung wieder |

### 21.5 Bankabgleich

| Vorgang | Über die Schnittstelle | Werkzeug |
|---|---|---|
| Offene, nicht zugeordnete Umsätze mit Vorschlag | ja | `get_unmatched_transactions` |
| Eingang einer Forderung zuordnen | **ja**, bucht sofort | `match_bank_transaction`. **Nur wenn Name oder IBAN der Person im Umsatz stehen. Ein gleicher Betrag allein reicht nicht und wird abgelehnt** |
| Eine Gutschrift auf mehrere Forderungen aufteilen (mehrere Monate, Miete + Hausgeld + Sonderumlage) | **ja**, bucht sofort | `split_bank_transaction` (Summe = Umsatz, je Teil ein Nachweis) |
| Ausgang als Beleg buchen und zuordnen | **ja**, bucht sofort | `book_transaction_as_expense` (bis 50 auf einmal) |
| Regeln für die automatische Vorkontierung | ja | `vorkontierungsregel_anlegen` / `_aendern`. Nach Verwendungszweck, Gegenseite, IBAN, Mandatsreferenz, Betrag; nur Vorschlag oder automatisch buchen. **Wirkt auch rückwirkend auf offene Umsätze** |
| Umsatz ignorieren, Zuordnung von Hand ohne Nachweis | **nein** | Bankabgleich in der Oberfläche |

### 21.6 Buchhaltung

| Vorgang | Über die Schnittstelle | Werkzeug |
|---|---|---|
| Journal, Kontoblatt, Summen- und Saldenliste, Personenkonto | ja | `get_journal`, `get_kontoblatt`, `get_summen_salden`\*, `get_account_statement`\*, `get_tenant_account`\* |
| Eingangsrechnung erfassen | ja, zweistufig | `create_expense` (Entwurf in der Belegfreigabe, zeigt die Verteilung auf Einheiten) → `confirm_expense` (bis 50 Belege nach einer Freigabe). Dublettenprüfung |
| Beleg ändern | ja | `edit_expense`. Nach Festschreibung / DATEV nur mit Grund (Gegenbuchung und Neubuchung) |
| Buchung ändern / aufheben | ja, offene Periode vor DATEV | `edit_booking` / `cancel_booking` (immer mit Grund in deinen Worten) |
| **Freie Buchung anlegen** (Umbuchung Soll an Haben, Abgrenzung, Rücklagenumbuchung) | **nein** | kein Werkzeug, nur in der Oberfläche |
| Storno nach DATEV-Übergabe / in festgeschriebener Periode | **nein** | Oberfläche |
| Konten, Umlageschlüssel, Kontenrahmen | ja | `create_account`\*, `edit_account`\*, `create_verteilerschluessel`\*, `switch_kontenrahmen`\* |
| DATEV-Status | ja (lesen) | `get_datev_status` |
| DATEV-Übertragung / -Export auslösen | **nein** | Oberfläche |

### 21.7 Live-Befund Finanzen, WEG Queller Str. 72 (02.11.2026)

- **Bankkonto:** 1 Girokonto „WEG Queller Str.72“ mit **ausländischer (französischer) IBAN**. Das passt zu TOP 3 der ETV vom 28.09.2026, „Eröffnung eines neuen deutschen Kontos“, über den kein Beschluss erfasst ist. Saldo laut Verwaltio 17.469,00 €.
- **Letzter Kontoabruf: 06.10.2026.** Das Konto ist als „Kontostand eintragbar“ geführt, also ohne automatischen Bankabruf (manuell oder per Import). Seit knapp 4 Wochen sind keine neuen Umsätze eingegangen.
- **Bankabgleich:** 65 Umsätze, alle 65 zugeordnet. Nichts offen.
- **Sollstellungen:** Hausgeld ist bis einschließlich 12/2026 gebucht (Bewirtschaftung + Erhaltungsrücklage je Einheit). Soll 10.099,44 €, Ist 8.411,50 €, offen 1.687,94 € (davon 841,62 € Dezember, noch nicht fällig).
- **Überfälliger Hausgeld-Rückstand 846,32 €**, nachgerechnet:
  - Hausgeld November 2026, fällig 01.11.2026, für alle 4 Einheiten: 207,89 + 169,19 + 201,26 + 263,28 = **841,62 €**. Ob gezahlt wurde, ist unbekannt, weil der Kontoabruf seit 06.10. fehlt.
  - Cent-Differenzen Januar bis Oktober 2026: WE 04 (Melchers) 10 × 0,28 € = **2,80 €**, WE 02 (Goertzen) 10 × 0,19 € = **1,90 €**. Wahrscheinlich zahlen diese Eigentümer per Dauerauftrag einen gerundeten Betrag [wahrscheinlich].
  - Summe: 841,62 + 2,80 + 1,90 = **846,32 €** ✓
- **Kein echter Zahlungsverzug erkennbar.** Ein Mahnlauf würde jetzt die November-Raten und Cent-Beträge anmahnen. **Vor jedem Mahnlauf zuerst den Kontoabruf nachholen.**
- **DATEV:** eingerichtet, aber **nicht verbunden**. Kein Mandant, keine Übertragung.
