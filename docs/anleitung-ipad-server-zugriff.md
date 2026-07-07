# Anleitung: Sicherer Zugriff auf die Server-Daten vom iPad aus

Stand: 07.07.2026

## 1. Ausgangslage und Ziel

Im Büro stehen:

- ein **Windows Server**, auf dem die wichtigsten Daten (Dateifreigaben mit Verwaltungsdaten,
  Dokumenten, ggf. Datenbankdateien) liegen,
- eine **Synology NAS**, im selben lokalen Netzwerk wie der Windows Server.

Ziel: Von unterwegs (iPad, mobiles Internet oder fremdes WLAN) sicher auf die Daten des Windows
Servers zugreifen können — so, als säße man im Büro.

## 2. Empfohlene Architektur (Überblick)

**Nicht empfohlen:** den Windows Server oder seine Freigaben direkt per Portfreigabe ins Internet
öffnen. Damit wäre der Server permanent für jeden im Internet erreichbar und ein beliebtes
Angriffsziel — bei personenbezogenen Mieter-/Eigentümerdaten ein erhebliches Risiko.

**Empfohlen:** Die Synology NAS dient als **VPN-Einstiegspunkt** ins Büronetzwerk:

```
iPad (unterwegs, mobiles Netz)
   │  verschlüsselter VPN-Tunnel (OpenVPN)
   ▼
Router (Büro) ── Portweiterleitung nur für den VPN-Port
   │
   ▼
Synology NAS (VPN Server) ── im selben LAN wie ──► Windows Server (Dateifreigaben)
```

Nur der VPN-Port ist von außen erreichbar. Sobald das iPad per VPN verbunden ist, verhält es sich
netzwerktechnisch so, als stünde es im Büro, und kann ganz normal auf die Windows-Freigaben
zugreifen. Der Windows Server selbst bleibt nach außen unsichtbar.

## 3. Voraussetzungen

- Administrator-Zugang zum DSM-Webinterface der Synology (`https://<Synology-IP>:5001`)
- Administrator-Zugang zum Windows Server (um Freigaben zu prüfen/anzulegen)
- Zugriff auf die Konfiguration des Büro-Routers (für eine Portweiterleitung)
- Ein iPad mit aktuellem iPadOS
- Ein Synology-Konto (kostenlos, für DDNS — falls das Büro keine feste öffentliche IP-Adresse hat,
  was bei den meisten Internetanschlüssen der Fall ist)

## 4. Schritt 1: Feste lokale IP-Adresse für die Synology vergeben

Damit die Portweiterleitung dauerhaft funktioniert, darf sich die lokale IP-Adresse der Synology
nicht ändern.

1. DSM öffnen → **Systemsteuerung → Netzwerk → Netzwerkschnittstelle**
2. Der Netzwerkkarte eine feste IP-Adresse zuweisen, **oder** im Router eine DHCP-Reservierung für
   die MAC-Adresse der Synology einrichten (im Router-Menü meist unter „DHCP" oder
   „Adressreservierung").

## 5. Schritt 2: DDNS einrichten (falls keine feste öffentliche IP vorhanden)

1. DSM → **Systemsteuerung → externer Zugriff → DDNS**
2. „Hinzufügen" → Anbieter „Synology" auswählen, mit dem Synology-Konto anmelden
3. Einen Hostnamen vergeben, z. B. `hgi-buero.synology.me`

Diesen Namen benutzt man später auf dem iPad anstelle einer IP-Adresse — er zeigt automatisch
immer auf die aktuelle Internet-Adresse des Büros.

## 6. Schritt 3: VPN Server auf der Synology einrichten

1. Im **Paketzentrum** der Synology das Paket **„VPN Server"** installieren
2. VPN Server öffnen → **OpenVPN** aktivieren (OpenVPN ist sicherer und moderner als PPTP/L2TP;
   PPTP bitte nicht verwenden)
3. Einstellungen (Vorschläge):
   - Port: Standard `1194/UDP` beibehalten oder einen anderen Port wählen
   - „Dynamische IP-Adresse für Client zulassen" aktivieren
   - Verschlüsselung: Standardwerte (AES-256) belassen
4. Speichern — die Synology erzeugt jetzt ein **Konfigurationspaket** (`.zip` mit `.ovpn`-Datei und
   Zertifikat). Dieses über **„Konfiguration exportieren"** herunterladen und sicher aufbewahren
   (nicht per unverschlüsselter Mail verschicken).

## 7. Schritt 4: Eigenes VPN-Benutzerkonto anlegen (nicht den Admin-Account nutzen)

1. DSM → **Systemsteuerung → Benutzer und Gruppe** → neuen Benutzer anlegen, z. B. `vpn-edgard`
2. Diesem Benutzer **nur** die Berechtigung für den VPN-Dienst geben (unter „Anwendungen" → VPN
   Server erlauben, alles andere sperren)
3. **Zwei-Faktor-Authentifizierung (2FA)** für diesen Benutzer aktivieren:
   DSM → Benutzer bearbeiten → „2-Faktor-Authentifizierung aktivieren" → Authenticator-App
   (z. B. Google/Microsoft Authenticator) auf dem iPhone/iPad einrichten
4. Ein starkes, einzigartiges Passwort vergeben (Passwort-Manager verwenden)

Grundsatz: Für den Fernzugriff nie den Admin-Account verwenden — nur ein separates Konto mit
minimalen Rechten.

## 8. Schritt 5: Portweiterleitung im Router einrichten

Im Router-Menü (Adresse meist `192.168.0.1` oder `192.168.1.1`, siehe Aufkleber am Gerät):

1. Menüpunkt „Portweiterleitung" / „Virtual Server" / „NAT" suchen
2. Regel anlegen: externer Port `1194/UDP` → interne IP der Synology, Port `1194/UDP`
3. Speichern und Router ggf. neu starten

Hinweis: Manche Internetanschlüsse (v. a. reine Mobilfunk-/manche Kabelanschlüsse) nutzen
**Carrier-Grade NAT** — dann bekommt der Router gar keine öffentliche IP-Adresse und eine
Portweiterleitung funktioniert nicht. Das lässt sich beim Internetanbieter erfragen
(„öffentliche/feste IPv4-Adresse" bzw. „kein DS-Lite/CGN").

## 9. Schritt 6: Synology-Firewall & Schutzmechanismen aktivieren

1. DSM → **Systemsteuerung → Sicherheit → Konto** → „Auto-Block" aktivieren (blockt IP-Adressen
   nach mehreren Fehlversuchen automatisch)
2. DSM → **Sicherheit → Firewall** aktivieren, nur die tatsächlich benötigten Ports/Dienste
   erlauben (v. a. das DSM-Verwaltungsinterface selbst **nicht** von außen erreichbar lassen)
3. Regelmäßige **DSM-Updates** einspielen (Systemsteuerung → Update & Wiederherstellung)

## 10. Schritt 7: VPN-Profil auf dem iPad einrichten

1. Im App Store **„OpenVPN Connect"** (offizielle App von OpenVPN Inc.) installieren
2. Die zuvor exportierte `.ovpn`-Datei sicher auf das iPad bringen (z. B. per AirDrop vom Rechner,
   oder über die verschlüsselte Notizen-/Dateien-App — nicht per normaler E-Mail, da sie
   Zugangsdaten zum Netzwerk enthält)
3. Datei antippen → „Öffnen mit OpenVPN Connect" → Profil importieren
4. Benutzername/Passwort des VPN-Kontos (`vpn-edgard`) eingeben, ggf. 2FA-Code
5. Verbindung testen (Schalter in der App umlegen) — Status sollte „Connected" anzeigen

## 11. Schritt 8: Auf dem Windows Server gespeicherte Daten vom iPad öffnen

Sobald die VPN-Verbindung steht, ist das iPad netzwerktechnisch im Büro:

1. Auf dem iPad die **Dateien-App** öffnen
2. Oben rechts auf „..." bzw. „Durchsuchen" → **„Mit Server verbinden"**
3. Adresse eingeben: `smb://<lokale IP des Windows Servers>` (z. B. `smb://192.168.1.50`)
4. Mit einem Windows-Benutzerkonto anmelden, das Lesezugriff (bzw. nur die nötigen Rechte) auf die
   entsprechende Freigabe hat
5. Die Freigabe erscheint danach wie ein normaler Ordner in der Dateien-App — Dokumente, PDFs,
   Excel-Tabellen etc. lassen sich direkt öffnen

**Voraussetzung auf dem Windows Server:** Die gewünschten Ordner müssen als Netzwerkfreigabe (SMB)
freigegeben sein (Rechtsklick auf Ordner → Eigenschaften → Freigabe), und die Windows-Firewall muss
eingehende SMB-Verbindungen (Port 445) aus dem lokalen Netz zulassen (ist im internen Netz meist
bereits der Fall).

**Komfort-Tipp:** Für eine bessere Vorschau/Bearbeitung von Office-/PDF-Dateien eignen sich auch
Drittanbieter-Apps wie „Documents by Readdle" oder „FileBrowser", die ebenfalls SMB-Server
unterstützen und teils mehr Funktionen bieten als die Standard-Dateien-App.

## 12. Falls es sich doch um eine echte Datenbank (SQL) handelt

Sollten künftig direkte SQL-Abfragen nötig sein (z. B. auf eine SQL-Server- oder MySQL-Datenbank
der Verwaltungssoftware), gilt derselbe Grundsatz: **niemals den Datenbank-Port direkt ins
Internet öffnen.** Stattdessen im selben VPN-Tunnel (siehe oben) zusätzlich eine iPad-App wie
„Navicat" oder „DBHawk" für den jeweiligen Datenbanktyp nutzen — der Datenbankserver bleibt dabei
weiterhin nur im internen Netz erreichbar. Das kann bei Bedarf in einem separaten Schritt ergänzt
werden, sobald klar ist, welche Datenbank-Software konkret verwendet wird.

## 13. Sicherheits- und Datenschutz-Hinweise (wichtig bei Mieter-/Eigentümerdaten)

- **Getrenntes VPN-Konto mit 2FA**, kein Admin-Zugang für den mobilen Zugriff (siehe Schritt 4)
- **iPad-Bildschirmsperre** mit Code/Face ID zwingend aktivieren, da darüber Zugang zu
  personenbezogenen Daten möglich ist
- **Automatische Sperre** nach kurzer Inaktivität einstellen
- Bei Verlust/Diebstahl des iPads: VPN-Zugang sofort in DSM deaktivieren (Benutzer sperren) und
  Passwort ändern
- Nur die tatsächlich benötigten Freigaben/Ordner für den mobilen Zugriff freigeben, nicht den
  gesamten Server
- Regelmäßig prüfen, wer Zugriff hat (Benutzerliste in DSM und auf dem Windows Server)
- DSM und Windows Server regelmäßig mit Sicherheitsupdates versorgen

## 14. Kurz-Checkliste

- [ ] Feste lokale IP für Synology vergeben
- [ ] DDNS-Hostname eingerichtet
- [ ] VPN Server (OpenVPN) auf Synology aktiviert, Konfiguration exportiert
- [ ] Eigenes VPN-Benutzerkonto mit 2FA angelegt (kein Admin-Konto)
- [ ] Portweiterleitung im Router für den VPN-Port eingerichtet
- [ ] Synology-Firewall/Auto-Block aktiviert
- [ ] OpenVPN Connect auf dem iPad installiert und Profil importiert
- [ ] Verbindung erfolgreich getestet
- [ ] Zugriff auf Windows-Server-Freigabe über die Dateien-App getestet
- [ ] iPad-Bildschirmsperre aktiviert

## 15. Troubleshooting

| Problem | Mögliche Ursache | Lösung |
|---|---|---|
| VPN verbindet nicht | Portweiterleitung fehlt/falsch | Regel im Router prüfen, ggf. Router neu starten |
| VPN verbindet nicht | Carrier-Grade NAT beim Internetanbieter | Beim Anbieter feste/öffentliche IPv4 erfragen |
| VPN verbunden, aber Server nicht erreichbar | Windows-Firewall blockt SMB | Eingehende Regel für Port 445 aus dem VPN-Subnetz erlauben |
| Freigabe erscheint nicht in der Dateien-App | Freigabe existiert nicht oder Benutzer hat keine Rechte | Freigabe und NTFS-Berechtigungen auf dem Windows Server prüfen |
| Verbindung bricht ständig ab | Mobilfunknetz wechselt zwischen WLAN/LTE | Bei OpenVPN „Persist" aktivieren, ggf. Verbindung manuell neu aufbauen |
