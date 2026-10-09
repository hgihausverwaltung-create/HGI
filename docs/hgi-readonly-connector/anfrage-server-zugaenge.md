# Anfrage an Codex / Herrn Kreker – persönliche Lesezugänge für die Agenten-API

**Betreff:** HGI-Plattform – Agenten-API – drei persönliche Claude-Zugänge (Lesen + Wissenseintrag)

Guten Tag Herr Kreker,

für den lokalen Claude-Connector `hgi-datenbank-readonly` sollen künftig vier Mitarbeiter
der HGI Immobilien GmbH mit jeweils eigener Identität auf die Agenten-API
(`https://192.168.50.17/agent-api/mcp`) zugreifen. Bitte richten Sie Folgendes ein:

1. **Drei neue Agenten-Identitäten**, jeweils mit eigenem Token:
   - `claude-leon-schroeder` (Leon Schröder)
   - `claude-inna-goerz` (Inna Görz)
   - `claude-marina-korotaev` (Marina Korotaev)
2. **Rechte:** ausschließlich die 16 Lesewerkzeuge, die `claude-readonly` heute erhält
   (`attachment_status`, `get_document`, `get_hgi_record`, `get_mail`, `get_ticket`,
   `hgi_table_schema`, `knowledge_history`, `mail_catalog`, `read_calendar`, `read_wincasa`,
   `search_hgi_data`, `search_knowledge`, `search_mail`, `search_tickets`,
   `ticket_attachment_status`, `ticket_history`)
   **plus** die beiden Wissens-Werkzeuge `save_knowledge` und `update_own_knowledge`.
   Jeder Mitarbeiter soll Einträge in der Wissensdatenbank anlegen und seine eigenen Einträge
   ändern können (Entscheidung Herr Schröder, 09.10.2026). Darüber hinaus keine Schreibwerkzeuge
   (kein `create_ticket`, `update_ticket`, `send_mail`, `create_calendar_event`).
   Die Werkzeugliste muss für alle Identitäten exakt gleich sein, da die Bridge jede Abweichung ablehnt.
2a. **Auch für die bestehende Identität `claude-readonly`** bitte `save_knowledge` und
   `update_own_knowledge` freischalten, sodass alle vier Identitäten dieselben 18 Werkzeuge erhalten.
   Bitte kurz Bescheid geben, sobald das umgestellt ist – erst danach passen wir die Bridge an,
   sonst fällt der Connector aus.
3. **Protokollierung** der Abrufe je Identität.
4. **Tokens** bitte nicht per E-Mail versenden, sondern persönlich bzw. telefonisch übergeben.
   Bitte mitteilen, wie ein Token im Bedarfsfall gesperrt wird (z. B. bei Austritt).
5. **Rückfrage:** Herr Schröder nutzt `claude-readonly` auf zwei Rechnern (Eddy_NUC und AGENT007).
   Ist je Rechner ein eigenes Token derselben Identität möglich, damit ein Gerät einzeln gesperrt werden kann?
6. **Hinweis:** Die Bridge auf Herrn Schröders Rechner erwartete bis zum 09.10.2026 zusätzlich
   Schreibwerkzeuge (`save_knowledge`, `create_ticket`, `send_mail` u. a.), die der Server nicht
   mehr anbot; der Connector war dadurch ausgefallen. Bitte kurz bestätigen, ob die Rücknahme
   serverseitig beabsichtigt war. Ticket-, Mail- und Kalender-Schreibrechte sollen weiterhin
   **nicht** freigeschaltet werden.

Mit freundlichen Grüßen

Edgard Schröder
HGI Immobilien GmbH
Hausverwaltung
Osnabrücker Straße 49
33649 Bielefeld
Tel.: +49521 69342
