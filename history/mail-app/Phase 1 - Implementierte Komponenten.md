---
title: Phase 1 - Implementierte Komponenten
type: note
permalink: phase-1-implementierte-komponenten
---

# Phase 1 - Implementierte Komponenten

## Rule Engine Implementation

### Datei: `src/core/rules/ruleEngine.ts`

Die Rule Engine ist das Herzstück des Mail-Filtering-Systems:

**Features:**
- **Event-basierte Architektur** mit EventEmitter
- **JavaScript Rule Caching** für Performance
- **Drei Condition-Typen:**
  - Simple: Standard-Vergleiche (contains, equals, regex, etc.)
  - Group: Logische Verknüpfungen (AND, OR, NOT)
  - JavaScript: Custom Code für komplexe Logik

**Actions:**
- move, label, markRead, markImportant
- delete, forward, notify
- script (JavaScript execution)

**Besonderheiten:**
- Rule Priority System
- Stop Processing Flag
- Import/Export als JSON
- Smart Mail Categorization (rule-basiert)

## IMAP Client Evolution

### Von Basic zu Advanced
**Vorher:** Nur `verifyImapConnection` für Account-Verifikation
**Nachher:** Vollständiger IMAP Client mit:
- Connection Pool Management
- Folder Tree Parsing
- Mail Fetching mit Pagination
- Attachment Handling
- Search Implementation
- Sync State Management

### Key Features:
- **Event Emitter Pattern** für Status-Updates
- **Error Recovery** mit reconnect logic
- **Performance:** Stream-basiertes Mail Parsing
- **Type Safety:** Vollständige TypeScript Integration

## SMTP Client Implementation

### Datei: `src/core/mail/smtpClient.ts`

**Basiert auf:** Nodemailer
**Features:**
- Send, Reply, Forward
- Draft Management
- Attachment Support
- Message ID Generation
- Connection Pooling

**Besonderheiten:**
- Auto-Formatting für Reply/Forward
- HTML & Plain Text Support
- Priority Headers
- Custom Headers Support

## State Management mit Zustand

### Architektur:
```typescript
useMailStore = create()(
  devtools(
    persist(
      immer((set, get) => ({
        // State & Actions
      }))
    )
  )
)
```

### Features:
- **Immer Integration:** Vereinfachte immutable Updates
- **Persist Middleware:** Lokale Speicherung wichtiger Daten
- **DevTools:** Debugging im Browser
- **Computed Getters:** Effiziente Abfragen
- **Type Safety:** Vollständige TypeScript Unterstützung

### State Struktur:
- accounts, mails, folders (Maps für Performance)
- filters, rules, smartInboxes (Arrays)
- UI State (selections, search, sync)
- Settings (notifications, etc.)

## IPC Architecture

### Main Process Handler (`mail-ipc.ts`):
- Zentrale Verwaltung aller Mail-bezogenen IPC Calls
- Client Pool Management (IMAP/SMTP)
- Event Forwarding zum Renderer
- Error Handling & Recovery

### Preload API Extension:
```typescript
window.electron.mail = {
  // Account Management
  // Mail Operations
  // Sync Operations
  // Rule Management
  // Event Listeners
}
```

### Design Decisions:
- **invoke/handle** für async Operations
- **on/send** für Events
- **Type Safety** durch shared types
- **Error Wrapping** für besseres Debugging