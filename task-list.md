## 🧱 Taskliste


### 1. Account-Verwaltung & Mehrfach-Konten

1. **IMAP/POP3 Account Setup**

    * **1.1** 🟡 **Create `AccountForm.tsx` – Eingabe für Server, Port, SSL, Auth (in Arbeit)**
    * **1.2** `imapClient.ts` implementieren – Verbindung herstellen + speichern
    * **1.3** POP3-Adapter `pop3Client.ts` – optional, gleiche Struktur

2.  **Multi‑Account UI**

    * **2.1** `Sidebar.tsx` – Liste aller Accounts + Add‑Button
    * **2.2** Store (Redux/Zustand): Accounts verwalten, Speichern in lokalem Aufbewahrungsstore


   * **1.1** Create `AccountForm.tsx` – Eingabe für Server, Port, SSL, Auth
   * **1.2** `imapClient.ts` implementieren – Verbindung herstellen + speichern
   * **1.3** POP3-Adapter `pop3Client.ts` – optional, gleiche Struktur

2. **Multi‑Account UI**

   * **2.1** `Sidebar.tsx` – Liste aller Accounts + Add‑Button
   * **2.2** Store (Redux/Zustand): Accounts verwalten, Speichern in lokalem Aufbewahrungsstore

### 2. Unified Inbox & Thread‑Grouping

3. **E‑Mails abrufen**

   * **3.1** `MailService.ts` – fetch IMAP/POP3 Mails lokal zwischenspeichern
   * **3.2** Periodischer Pull (z. B. 1 min Interval)

4. **Unified Inbox**

   * **4.1** `InboxView.tsx` – kombiniert Mails aus allen Accounts
   * **4.2** `ThreadGroup` Logic – Gruppierung nach Subject/In‑Reply‑Headern

### 3. E‑Mail Anzeige & Ansicht

5. **Anzeige-Komponenten**

   * **5.1** `MailListItem.tsx` – Vorschaueintrag inkl. Sender, Betreff, Datum, Icons
   * **5.2** `MailView.tsx` – komplette Mail-Inhalte, Anhänge, plaintext & HTML

6. **Anhang-Handling**

   * **6.1** `AttachmentList.tsx` – Liste + Download/Öffnen in Sandbox
   * **6.2** Sandbox-Mechanik via Electron-IPC/Sandboxing implementieren

### 4. Regelengine (Nested Logic)

7. **Regel-Definition UI**

   * **7.1** `RuleBuilder.tsx` – drag & drop Schichten: Bedingungen (Absender, Inhalt, Betreff)
   * **7.2** Funktions-Bausteine: “beginnt mit”, “enthält”, “mehrere Bedingungen (AND/OR)”

8. **Regel-Engine Backend**

   * **8.1** `RuleEngine.ts` – Evaluiert Regeln auf Mails, Actions ausführen
   * **8.2** Standard-Aktionen: Verschieben, Markieren, Archivieren, Löschen

### 5. Smart Inbox & KI‑Sortierung

9. **Kategorie-Modelle initial**

   * **9.1** Dummy-Klassifikator (Keywords: Werbung, Wichtig, Einkauf)
   * **9.2** UI-Labels für “Smart Inbox”, “Promo”, “Custom”

10. **Automatische Sortierung**

    * **10.1** `ClassifierService.ts` – wendet Modell auf eingehende Mails an
    * **10.2** Navigationsfilter: Tab Gruppe “Wichtig” etc. + Label-Tagging

### 6. Suche mit NLP Unterstützung

11. **Search UI**

    * **11.1** `SearchBar.tsx` – Texteingabe “natürlich sprachliche Suche”
    * **11.2** `SearchService.ts` – Parsen von Queries & Filter auf Store

12. **Filtersystem**

    * **12.1** Support für: Absender, Datum, Inhalt, Label, etc.
    * **12.2** UI-Pipline: Filter-Buttons + Clear-Option

### 7. Blocker & Gatekeeper

13. **Absender‑Blockieren**

    * **13.1** `BlockList.tsx` – UI zum Hinzufügen/Entfernen
    * **13.2** Im `MailService` vor Fetch blocken

14. **Gatekeeper**

    * **14.1** UI: Modus „Nur bekannte Absender zulassen“
    * **14.2** Logik prüfen jeden Absender gegen White-List

### 8. PGP & S/MIME Verschlüsselung

15. **Security‑Setup UI**

    * **15.1** `SecuritySettings.tsx` – Schlüssel importieren/generieren
    * **15.2** Anzeige: aktive Schlüssel, Fingerprints

16. **Mail-Verschlüsselung**

    * **16.1** `CryptoService.ts` – Integration von OpenPGP.js oder WebCrypto
    * **16.2** Encrypt/Decrypt in View + beim Senden (später)

### 9. Follow‑Up, Später‑Senden & Wiedervorlage

17. **Wiedervorlage**

    * **17.1** UI Button „Später in Inbox“ + Zeitwahl
    * **17.2** `ReminderService.ts` – Scheduler für Wiedervorlage, lokal speichern

18. **Später senden**

    * **18.1** Sende-Formular mit Zeitinstanz
    * **18.2** Speicherung in Queue + Timer zum Versand

### 10. Sonstige Features

19. **Pin / Anheften**

    * **19.1** UI: Stecker-Icon in `MailListItem`
    * **19.2** `PinnedService.ts` – Sortierung + Anzeige

20. **Mute Thread**

    * **20.1** UI: "Stummschalten" Button
    * **20.2** `ThreadSettings` – Mails automatisch archivieren

21. **Recall Mail**

    * **21.1** Button zum Zurückrufen + Status prüfen (unter Server‑Unterstützung)
    * **21.2** UI-Feedback nach Recall‑Versuch

22. **Tracking‑Pixel Blocker**

    * **22.1** `TrackingService.ts` – Pixel-URLs erkennen/blockieren
    * **22.2** Ziele setzen: Blind‑Images entfernen

23. **Speed‑Reader**

    * **23.1** `SpeedReader.tsx` – WPM einstellbar, Text‑In–↔ Word‑Highlight
    * **23.2** Integration in `MailView`

### 11. UI‑Design & Anbindung

24. **Hotkeys & Kontrollzentrale**

    * **24.1** `ShortcutsService.ts` – global + lokal einstellbar
    * **24.2** `ControlCenter.tsx` – Grafik­übersicht + Anpassung

25. **Theming & Backgrounds**

    * **25.1** `ThemeService.ts` – Dark/Light + Custom-Background
    * **25.2** Import von Bildern/URLs für Workspace

### 12. Testing & Packaging

26. **Unit-Tests entwickeln**

    * Services und Regel-Engine mit Jest + mocking

27. **Integrations‑Tests (Cypress)**

    * GUI-Flows: Account Setup → Mail Abruf → Regel Anwendung → Suche

28. **Packaging**

    * Electron-Builder konfigurieren für macOS & Windows (WSL build)
    * Signierung, DMG/MSI – Basispakete erzeugen
