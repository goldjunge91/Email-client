### 1. Projektübersicht

Dieses Projekt zielt auf die Entwicklung eines modernen, plattformübergreifenden E-Mail-Clients mit Fokus auf Datenschutz („Privacy-First“) und hoher Benutzerfreundlichkeit. Als Basis dient die Electron-Bones Boilerplate, um eine native Desktop-App mit React zu realisieren. Der MVP umfasst alle Kernfunktionen eines E-Mail-Clients mit fortschrittlichen Features wie einer mächtigen Regel-Engine, Smart Inbox, Mehrkontenverwaltung, Ende-zu-Ende-Verschlüsselung und automatischer Kategorisierung. Die App soll auf macOS starten und später Windows mit WSL-Unterstützung in der Entwicklung abdecken.

---

### 2. Zielplattformen und Entwicklungsumgebung

* **Primärplattform:** macOS
* **Sekundärplattform:** Windows (Entwicklung über WSL)
* **Technologie-Stack:**

  * Framework: Electron (Electron-Bones Boilerplate)
  * UI: React (TypeScript)
  * Paketmanager: pnpm
  * Codebasis: bereits geklontes Repo, alle Abhängigkeiten installiert
* **Entwicklung:** Lokaler MVP mit Fokus auf Privacy-First, lokale Mailkontenverwaltung ohne Cloud-Zwang

---

### 3. Feature-Übersicht (Tabellarisch)

| Feature                      | Beschreibung                                                | Priorität (1=hoch) | Abhängigkeiten           |
| ---------------------------- | ----------------------------------------------------------- | ------------------ | ------------------------ |
| IMAP & POP3 Support          | Anbindung an gängige Mailserver                             | 1                  | Netzwerk, Auth           |
| Mehrere Konten               | Verwaltung mehrerer Mailaccounts                            | 1                  | IMAP/POP3                |
| Regel-Engine                 | Verschachtelte Regeln zum Filtern und Verarbeiten von Mails | 1                  | Core-Mail-Handling       |
| Smart Inbox                  | Automatische Trennung wichtiger vs. unwichtiger Mails       | 1                  | ML, Regel-Engine         |
| Thread-Gruppierung           | Zusammenfassung von E-Mail-Konversationen                   | 1                  | UI, Datenmodell          |
| Mail-Verschlüsselung         | PGP & S/MIME Ende-zu-Ende-Verschlüsselung                   | 2                  | Kryptografie             |
| E-Mail Suche                 | Natürliche Spracheingabe & Filtermöglichkeiten              | 1                  | Indizierung, UI          |
| Ordner & Labels              | Kategorisierung und Ordnerstruktur                          | 1                  | UI, Storage              |
| E-Mail Regeln UI             | Benutzerfreundliche Oberfläche zur Regeldefinition          | 1                  | Regel-Engine, UI         |
| Spam- & Absenderblocker      | Blockierung unerwünschter Absender                          | 1                  | Regel-Engine             |
| E-Mail Tracking              | Anzeigen, ob Empfänger Mail geöffnet haben                  | 3                  | Netzwerk, UI             |
| Anhang-Management            | Vorschau und Suche nach Anhängen                            | 2                  | UI, Storage              |
| Wiedervorlage & Erinnerungen | Nachrichten „für später“ markieren und Follow-ups planen    | 2                  | UI, Zeitplanung          |
| E-Mail zurückrufen           | Mail innerhalb kurzer Zeit zurückziehen                     | 3                  | Netzwerk, Server-Support |
| Multi-App Integration        | Integration mit externen Tools (z.B. Google Calendar)       | 3                  | API-Integration          |
| Geschwindigkeit & UX         | Schnelles Laden & Lesen (Speed-Reader-Tool)                 | 2                  | UI                       |
| Sandbox für Anhänge          | Sichere Sandbox zum Öffnen von Anhängen                     | 2                  | Sicherheit               |

---

### 4. Modulare Architektur und Komponentenübersicht

| Modul                     | Funktion                                                   | Dateien / Ordner                           |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------ |
| Core Mail Handling        | IMAP/POP3 Anbindung, Mailabruf, Parsing                    | `src/core/mail/`                           |
| Rule Engine               | Regeldefinition, Parsing und Ausführung                    | `src/core/rules/`                          |
| UI – Inbox & Threads      | Darstellung der Inbox, Threads, UI-Komponenten             | `src/ui/inbox/`, `src/ui/threads/`         |
| UI – Regel-Editor         | Interface zum Erstellen/Verwalten von Regeln               | `src/ui/rules-editor/`                     |
| Verschlüsselung           | PGP & S/MIME Handling                                      | `src/core/crypto/`                         |
| Suche                     | Suchlogik, Filter & natürliche Sprache                     | `src/core/search/`                         |
| Attachment Manager        | Anhänge anzeigen, verwalten                                | `src/core/attachments/`                    |
| Notifications & Reminders | Erinnerungen, Wiedervorlage                                | `src/core/notifications/`                  |
| Settings & Accounts       | Verwaltung von Benutzerkonten, App-Einstellungen           | `src/core/accounts/`, `src/core/settings/` |
| App Integration           | Schnittstellen zu externen Diensten (Google Calendar etc.) | `src/core/integrations/`                   |

---

### 5. Detaillierte Taskliste (Auszug mit Prioritäten & Beschreibung)
volle taskkliste [taskliste.md](./task-list.md)

| Task-Name                       | Beschreibung                                                          | Priorität | Dateien / Komponenten                |
| ------------------------------- | --------------------------------------------------------------------- | --------- | ------------------------------------ |
| IMAP/POP3-Protokoll integrieren | Implementiere grundlegenden Mailabruf und Senden mit IMAP und POP3    | Hoch      | `src/core/mail/imap.ts`              |
| Mehrere Mailkonten verwalten    | UI & Logik zum Hinzufügen, Wechseln und Löschen von Mailkonten        | Hoch      | `src/core/accounts/`                 |
| Grundlegende Inbox UI           | Anzeige von Mails in Inbox, inklusive Thread-Gruppe                   | Hoch      | `src/ui/inbox/Inbox.tsx`             |
| Regel-Engine Kernlogik          | Parsing von Regeln, Ausführen bei Mailempfang                         | Hoch      | `src/core/rules/engine.ts`           |
| UI Regel-Editor                 | Frontend für Regelanlage & Regelverwaltung mit Drag\&Drop             | Hoch      | `src/ui/rules-editor/RuleEditor.tsx` |
| E-Mail Verschlüsselung          | PGP/S-MIME Schlüsselmanagement & Verschlüsselung/Entschlüsselung      | Mittel    | `src/core/crypto/`                   |
| Smart Inbox Algorithmen         | ML-Modul oder heuristische Einteilung wichtiger Mails                 | Mittel    | `src/core/rules/smartInbox.ts`       |
| Suche mit natürlicher Sprache   | Implementierung der Suchfilter mit NLP-Unterstützung                  | Mittel    | `src/core/search/`                   |
| Threading UI                    | Konversationsansicht in der Mailübersicht                             | Hoch      | `src/ui/threads/`                    |
| Sandbox für Anhänge             | Sicheres Öffnen und Anzeigen von Dateianhängen in isolierter Umgebung | Mittel    | `src/core/attachments/sandbox.ts`    |
| Einstellungen & Datenschutz     | Benutzerprofile, Account-Konfiguration und Datenschutzoptionen        | Hoch      | `src/core/settings/`                 |

---

### 6. Hinweise zur Entwicklungsumgebung

* Verwenden von **Electron-Bones Boilerplate** als Starterprojekt für Desktop-App mit React/TypeScript
* Paketverwaltung über **pnpm**, bereits installierte Dependencies
* Entwicklungsumgebung: macOS bevorzugt, Windows Entwicklung mit **WSL** zur Linux-ähnlichen Umgebung
* Lokaler Entwicklungsserver mit Hot-Reload
* Testumgebung für Unit- und Integrationstests einrichten (Jest, Testing Library)

---

### 7. Privacy- und Sicherheitsaspekte

* Strikte Trennung lokaler Daten; keine Cloud-Zwischenspeicherung im MVP
* Verwendung von Ende-zu-Ende Verschlüsselung (PGP/S-MIME) für Mailinhalte
* Blockierung von Tracking-Pixeln und unerwünschten Absendern als Standard
* Sandbox-Technologie für sichere Anhang-Anzeige ohne Risiko für Nutzer
* Transparente Datenschutzrichtlinie und Benutzerkontrolle über Daten


## Electron Bones Boilerplate Instructions

### 🚀 Getting Started

1. Clone this repository:

   ```bash
   git clone https://github.com/lacymorrow/electron-hotplate.git
   ```

2. Navigate into the repository:

   ```bash
   cd electron-hotplate
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the development server:

   ```bash
   npm run start
   ```

### 📜 Available Scripts

- `npm run start`: Start the app in development mode.
- `npm run package`: Build the app for production.
- `npm run lint`: Run the linter.
- `npm run test`: Run tests.

### Build for Production

To package the app for production, run:

```bash
npm run package
```

#### Important Notes

- Auto-update can be enabled by uncommenting the `update` function in `src/main/auto-update.ts`.
- The app icon will default to the Electron icon during development. Build the app with `npm run package` to apply a custom icon.

### 🤝 Contributing

Contributions are welcome! Feel free to submit a Pull Request.

### 📄 License

This project is licensed under the CC-BY-NC-SA-4.0 License.
