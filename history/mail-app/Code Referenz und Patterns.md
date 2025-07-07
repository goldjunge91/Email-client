---
title: Code Referenz und Patterns
type: note
permalink: code-referenz-und-patterns
---

# Modern Mail App - Code Referenz

## Wichtige Code-Snippets und Patterns

### 1. IMAP Client Setup Pattern
```typescript
// Beispiel IMAP-Verbindung
import Imap from 'imap';

const imap = new Imap({
  user: account.settings.incomingServer.auth.user,
  password: account.settings.incomingServer.auth.pass,
  host: account.settings.incomingServer.host,
  port: account.settings.incomingServer.port,
  tls: account.settings.incomingServer.secure,
  tlsOptions: {
    rejectUnauthorized: false
  }
});
```

### 2. Event-basierte Architektur
```typescript
// Mail Service Events
mailService.on('account:added', (account) => {
  console.log('New account added:', account.email);
});

mailService.on('sync:completed', (accountId) => {
  console.log('Sync completed for:', accountId);
});

mailService.on('mails:updated', (mailIds) => {
  // Update UI
});
```

### 3. Zustand Store Pattern
```typescript
// Store für globalen App-State
import { create } from 'zustand';

interface MailStore {
  accounts: MailAccount[];
  selectedAccountId: string | null;
  selectedFolderId: string | null;
  selectedMailId: string | null;
  
  // Actions
  setSelectedAccount: (accountId: string) => void;
  setSelectedFolder: (folderId: string) => void;
  setSelectedMail: (mailId: string) => void;
}

const useMailStore = create<MailStore>((set) => ({
  accounts: [],
  selectedAccountId: null,
  selectedFolderId: null,
  selectedMailId: null,
  
  setSelectedAccount: (accountId) => set({ selectedAccountId: accountId }),
  setSelectedFolder: (folderId) => set({ selectedFolderId: folderId }),
  setSelectedMail: (mailId) => set({ selectedMailId: mailId }),
}));
```

### 4. IPC Communication Pattern
```typescript
// Main Process (main.ts)
ipcMain.handle('mail:verify-account', async (event, accountData) => {
  try {
    const result = await verifyIMAPConnection(accountData);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Renderer Process (preload.ts)
contextBridge.exposeInMainWorld('mailAPI', {
  verifyAccount: (accountData) => ipcRenderer.invoke('mail:verify-account', accountData),
  syncAccount: (accountId) => ipcRenderer.invoke('mail:sync-account', accountId),
});
```

### 5. Verschlüsselung Pattern
```typescript
// Passwort-Verschlüsselung für Speicherung
import crypto from 'crypto';

function encryptPassword(password: string, masterKey: string): string {
  const algorithm = 'aes-256-gcm';
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(masterKey, salt, 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return JSON.stringify({
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    encrypted
  });
}
```

### 6. Full-Text Search Implementation
```typescript
// Elasticsearch-ähnliche Suche mit SQLite FTS5
const setupSearch = async (db: Database) => {
  await db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS mail_search USING fts5(
      id,
      subject,
      sender,
      recipients,
      content,
      tokenize = 'porter unicode61'
    );
  `);
};

// Suche durchführen
const searchMails = async (query: string) => {
  return db.all(`
    SELECT id, subject, snippet(mail_search, 4, '<mark>', '</mark>', '...', 64) as snippet
    FROM mail_search
    WHERE mail_search MATCH ?
    ORDER BY rank
    LIMIT 50
  `, [query]);
};
```

### 7. Smart Inbox Kategorisierung
```typescript
// ML-basierte Kategorisierung (Beispiel mit TensorFlow.js)
import * as tf from '@tensorflow/tfjs';

class SmartInboxClassifier {
  private model: tf.LayersModel | null = null;
  
  async loadModel() {
    this.model = await tf.loadLayersModel('/models/mail-classifier/model.json');
  }
  
  async categorizeMail(mail: Mail): Promise<Mail['category']> {
    if (!this.model) throw new Error('Model not loaded');
    
    // Feature extraction
    const features = this.extractFeatures(mail);
    const input = tf.tensor2d([features]);
    
    // Prediction
    const prediction = this.model.predict(input) as tf.Tensor;
    const categories = ['primary', 'social', 'promotions', 'updates', 'forums'];
    const probabilities = await prediction.data();
    
    const maxIndex = probabilities.indexOf(Math.max(...probabilities));
    return categories[maxIndex] as Mail['category'];
  }
  
  private extractFeatures(mail: Mail): number[] {
    // Beispiel Feature-Extraktion
    return [
      mail.from[0]?.address.includes('noreply') ? 1 : 0,
      mail.subject.toLowerCase().includes('sale') ? 1 : 0,
      mail.hasAttachments ? 1 : 0,
      // ... weitere Features
    ];
  }
}
```

### 8. Electron Window Management
```typescript
// Fenster-Konfiguration für Mail App
const createMainWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: '#0a0a0b',
    titleBarStyle: 'hiddenInset',
    frame: process.platform === 'darwin',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  
  // Fenster-State speichern
  windowStateKeeper(mainWindow);
  
  return mainWindow;
};
```

### 9. Datenbank Schema
```sql
-- SQLite Schema für lokale Mail-Speicherung
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  settings TEXT NOT NULL, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE mails (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  folder_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  thread_id TEXT,
  headers TEXT NOT NULL, -- JSON
  content TEXT,
  attachments TEXT, -- JSON
  metadata TEXT NOT NULL, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);

CREATE INDEX idx_mails_account_folder ON mails(account_id, folder_id);
CREATE INDEX idx_mails_thread ON mails(thread_id);
CREATE INDEX idx_mails_date ON mails(created_at);
```

### 10. Performance Optimierungen
```typescript
// Virtual Scrolling für große Mail-Listen
import { VariableSizeList } from 'react-window';

const MailList = ({ mails }) => {
  const getItemSize = (index) => {
    // Dynamische Höhe basierend auf Mail-Content
    return mails[index].hasAttachments ? 120 : 80;
  };
  
  return (
    <VariableSizeList
      height={window.innerHeight}
      itemCount={mails.length}
      itemSize={getItemSize}
      width="100%"
    >
      {({ index, style }) => (
        <MailListItem
          mail={mails[index]}
          style={style}
        />
      )}
    </VariableSizeList>
  );
};
```

## Integration mit ElectronMail Features

### Zu übernehmen von ElectronMail:
1. **Persistent Sessions** - Session-Token verschlüsselt speichern
2. **Proxy Support** - Per-Account Proxy-Konfiguration
3. **Local Store** - Offline-Zugriff auf Mails
4. **Full-Text Search** - Indizierung mit SQLite FTS5
5. **Auto-Login** - Keytar Integration für Master-Passwort

### Verbesserungen gegenüber ElectronMail:
1. **Moderneres UI** - Spark Mail inspiriert
2. **Bessere Performance** - React 18 mit Concurrent Features
3. **Smart Inbox** - ML-basierte Kategorisierung
4. **Erweiterte Regeln** - JavaScript-basierte Filter
5. **Touch Bar Support** - macOS Integration