---
title: Email Client Status und Planung
type: note
permalink: project-overview-email-client-status-und-planung
---

# Email Client - Aktueller Status und Planung

## 📊 Projekt-Übersicht

### Tech-Stack
- **Framework**: Electron mit React und TypeScript
- **Boilerplate**: electron-bones
- **UI**: shadcn/ui Komponenten
- **Build**: Webpack + pnpm
- **Architecture**: Main/Renderer/Preload Trennung

### ✅ Bereits vorhanden

1. **Grundstruktur**
   - Electron-Architektur mit Main/Renderer/Preload
   - Einstellungsverwaltung mit electron-store
   - IPC-Kommunikation eingerichtet
   - UI mit shadcn/ui Komponenten
   - Theme-System (Light/Dark/System)
   - Tray-Icon Unterstützung
   - Keyboard Shortcuts System

2. **Account-Verwaltung (teilweise)**
   - `AccountForm.tsx` - UI für IMAP-Konfiguration ✅
   - `imapClient.ts` - Basic IMAP-Verbindungstest ✅
   - IPC Handler für Account-Verifizierung ✅

### 🚧 In Arbeit

1. **Account-Verwaltung erweitern**
   - Account-Daten speichern (verschlüsselt)
   - Multi-Account UI (Sidebar)
   - Account-Wechsel

2. **Email-Funktionalität**
   - Email-Abruf implementieren
   - Lokale Datenbank (SQLite?)
   - Email-Anzeige

## 📋 Implementierungsplan

### Phase 1: Account-Management vervollständigen
1. **Account Storage**
   - Verschlüsselte Speicherung mit electron-store
   - Account-Modell erweitern
   - Account-Liste verwalten

2. **UI-Komponenten**
   - AccountList für Sidebar
   - Account-Switch Funktionalität
   - Account-Settings

### Phase 2: Email Core
1. **IMAP Integration**
   - Email-Sync Service
   - Folder-Struktur abrufen
   - Message-Fetching

2. **Lokale Datenbank**
   - SQLite einrichten
   - Email-Schema definieren
   - Sync-Logik

### Phase 3: UI für Emails
1. **Inbox View**
   - Email-Liste
   - Thread-Gruppierung
   - Search/Filter

2. **Email Viewer**
   - HTML/Text Anzeige
   - Attachment-Handling
   - Reply/Forward

### Phase 4: Erweiterte Features
1. **Regel-Engine**
2. **Smart Inbox**
3. **Verschlüsselung**

## 🔧 Nächste Schritte

1. **Account-Speicherung implementieren**
   - Store-Schema erweitern
   - Encryption für Passwörter
   - Account-Manager Service

2. **Email-Service aufbauen**
   - IMAP-Client erweitern
   - Sync-Mechanismus
   - Event-System für Updates

3. **Datenbank-Layer**
   - SQLite oder alternative lokale DB
   - Migrations-System
   - Query-Builder

## 📝 Notizen

- ElectronMail als Referenz nutzen (ProtonMail Client)
- Privacy-First Ansatz beibehalten
- Offline-Funktionalität wichtig
- Performance bei großen Mailboxen beachten