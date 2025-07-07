---
title: Architektur-Entscheidungen und Patterns
type: note
permalink: architektur-entscheidungen-und-patterns
---

# Architektur-Entscheidungen und Patterns

## Event-Driven Architecture

### Warum Event-basiert?
- **Lose Kopplung** zwischen Komponenten
- **Einfache Erweiterbarkeit** für neue Features
- **Async by Default** für bessere Performance
- **Real-time Updates** vom Main zum Renderer Process

### Event Flow:
```
IMAP Client → Mail Service → IPC Handler → Renderer → Store → UI
     ↓             ↓              ↓            ↓         ↓
  (events)     (events)      (events)     (events)  (re-render)
```

## State Management Patterns

### Single Source of Truth
- Alle Mail-Daten im zentralen Store
- Keine lokalen Component States für Daten
- UI State getrennt von Domain State

### Optimistic Updates
```typescript
// 1. Update UI sofort
updateMail(mailId, { isRead: true });
// 2. Server Call
await mailAPI.markAsRead(mailId);
// 3. Rollback bei Fehler
if (error) revertMail(mailId);
```

## Security Considerations

### Credential Management
- **Niemals im Klartext** speichern
- Verschlüsselung mit Master Password (Phase 3)
- Optional: OS Keychain Integration

### Process Isolation
- Main Process: Credential Handling
- Renderer Process: Nur UI Logic
- Context Isolation aktiviert
- Node Integration deaktiviert

## Performance Optimizations

### Virtual Scrolling
- React Window für Mail-Listen
- Dynamische Item Heights
- Lazy Loading von Mail Content

### Caching Strategy
- In-Memory Cache für aktive Folder
- LRU Cache für Mail Bodies
- Attachment Lazy Loading

### Search Performance
- SQLite FTS5 für Full-Text Search (Phase 3)
- Client-side Filtering für schnelle Results
- Server-side Search als Fallback

## Code Organization

### Feature-based Structure
```
feature/
├── components/     # UI Components
├── hooks/         # Custom React Hooks
├── services/      # Business Logic
├── types/         # TypeScript Definitions
└── utils/         # Helper Functions
```

### Naming Conventions
- **Components:** PascalCase
- **Hooks:** camelCase mit 'use' prefix
- **Services:** camelCase mit descriptive names
- **Types:** PascalCase mit 'I' prefix für Interfaces

## Testing Strategy (Phase 4)

### Unit Tests
- Jest für Business Logic
- React Testing Library für Components
- Mock IPC Calls

### Integration Tests
- Playwright für E2E Tests
- Test Account für IMAP/SMTP
- Snapshot Tests für UI

## Future Considerations

### Scalability
- Pagination für große Mail-Mengen
- Virtualization für Folder Trees
- Background Sync Workers

### Extensibility
- Plugin System für Custom Rules
- Theme Engine für UI Customization
- Custom Mail Providers

### Migration Path
- Import von anderen Mail Clients
- Export in Standard Formate (EML, MBOX)
- Backup & Restore Funktionalität