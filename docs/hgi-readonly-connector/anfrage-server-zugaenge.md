# Anfrage an Codex / Herrn Kreker – persönliche Lesezugänge für die Agenten-API

**Betreff:** HGI-Plattform – Agenten-API – drei persönliche Claude-Lesezugänge

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
   `ticket_attachment_status`, `ticket_history`). Keine Schreibwerkzeuge.
   Die Werkzeugliste muss exakt übereinstimmen, da die Bridge jede Abweichung ablehnt.
3. **Protokollierung** der Abrufe je Identität.
4. **Tokens** bitte nicht per E-Mail versenden, sondern persönlich bzw. telefonisch übergeben.
   Bitte mitteilen, wie ein Token im Bedarfsfall gesperrt wird (z. B. bei Austritt).
5. **Rückfrage:** Herr Schröder nutzt `claude-readonly` auf zwei Rechnern (Eddy_NUC und AGENT007).
   Ist je Rechner ein eigenes Token derselben Identität möglich, damit ein Gerät einzeln gesperrt werden kann?
6. **Hinweis:** Die Bridge auf Herrn Schröders Rechner erwartete bis zum 09.10.2026 zusätzlich
   Schreibwerkzeuge (`save_knowledge`, `create_ticket`, `send_mail` u. a.). Bitte kurz bestätigen,
   ob die Rücknahme dieser Rechte für `claude-readonly` serverseitig beabsichtigt war.

Mit freundlichen Grüßen

Edgard Schröder
HGI Immobilien GmbH
Hausverwaltung
Osnabrücker Straße 49
33649 Bielefeld
Tel.: +49521 69342
