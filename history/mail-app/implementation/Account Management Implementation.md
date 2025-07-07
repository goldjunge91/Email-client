---
title: Account Management Implementation
type: note
permalink: implementation-account-management-implementation
---

# Implementierungsplan - Phase 1: Account Management

## 1. Account-Datenmodell erweitern

### Account Interface (erweitert)
```typescript
// src/types/account.ts
export interface Account {
  id: string;
  name: string; // Display name
  email: string;
  
  // Connection settings
  imapConfig: {
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password: string; // encrypted
  };
  
  smtpConfig?: {
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password: string; // encrypted
  };
  
  // Status
  isActive: boolean;
  lastSync?: Date;
  
  // Settings
  checkInterval?: number; // in minutes
  signature?: string;
  
  createdAt: Date;
  updatedAt: Date;
}
```

## 2. Account Store erweitern

### Store-Schema
```typescript
// src/main/store.ts - erweitern
interface StoreSchema {
  settings: SettingsType;
  keybinds: CustomAcceleratorsType;
  accounts: Account[]; // NEU
  activeAccountId?: string; // NEU
}
```

## 3. Account Service implementieren

```typescript
// src/main/services/accountService.ts
import { ipcMain } from 'electron';
import crypto from 'crypto';
import { store } from '../store';
import { verifyImapConnection } from '../../core/mail/imapClient';

class AccountService {
  private algorithm = 'aes-256-gcm';
  private secretKey: Buffer;

  constructor() {
    // Generiere oder lade Master-Key
    this.secretKey = this.getOrCreateMasterKey();
  }

  private encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  private decrypt(encryptedData: { encrypted: string; iv: string; tag: string }): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.secretKey,
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  async addAccount(accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<Account> {
    // Verify connection first
    await verifyImapConnection({
      username: accountData.imapConfig.username,
      password: accountData.imapConfig.password,
      server: accountData.imapConfig.host,
      port: accountData.imapConfig.port,
      ssl: accountData.imapConfig.secure
    });

    // Encrypt passwords
    const encryptedImapPassword = this.encrypt(accountData.imapConfig.password);
    const encryptedSmtpPassword = accountData.smtpConfig 
      ? this.encrypt(accountData.smtpConfig.password)
      : undefined;

    const account: Account = {
      ...accountData,
      id: crypto.randomUUID(),
      imapConfig: {
        ...accountData.imapConfig,
        password: JSON.stringify(encryptedImapPassword)
      },
      smtpConfig: accountData.smtpConfig ? {
        ...accountData.smtpConfig,
        password: JSON.stringify(encryptedSmtpPassword)
      } : undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to store
    const accounts = store.get('accounts') || [];
    accounts.push(account);
    store.set('accounts', accounts);

    // Set as active if first account
    if (accounts.length === 1) {
      store.set('activeAccountId', account.id);
    }

    return account;
  }

  getAccounts(): Account[] {
    return store.get('accounts') || [];
  }

  getActiveAccount(): Account | null {
    const activeId = store.get('activeAccountId');
    if (!activeId) return null;
    
    const accounts = this.getAccounts();
    return accounts.find(acc => acc.id === activeId) || null;
  }

  setActiveAccount(accountId: string): void {
    store.set('activeAccountId', accountId);
  }

  deleteAccount(accountId: string): void {
    const accounts = this.getAccounts();
    const filtered = accounts.filter(acc => acc.id !== accountId);
    store.set('accounts', filtered);
    
    // Update active account if needed
    if (store.get('activeAccountId') === accountId) {
      store.set('activeAccountId', filtered[0]?.id || null);
    }
  }
}

export const accountService = new AccountService();
```

## 4. IPC Handler erweitern

```typescript
// src/main/ipc.ts - erweitern

import { accountService } from './services/accountService';

// Account Management
ipcMain.handle('account:add', async (event, accountData) => {
  try {
    const account = await accountService.addAccount(accountData);
    return { success: true, account };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('account:list', () => {
  return accountService.getAccounts();
});

ipcMain.handle('account:getActive', () => {
  return accountService.getActiveAccount();
});

ipcMain.handle('account:setActive', (event, accountId) => {
  accountService.setActiveAccount(accountId);
  return { success: true };
});

ipcMain.handle('account:delete', (event, accountId) => {
  accountService.deleteAccount(accountId);
  return { success: true };
});
```

## 5. UI Komponenten

### AccountList Component
```typescript
// src/renderer/components/accounts/AccountList.tsx
import React from 'react';
import { useAccounts } from '../../hooks/useAccounts';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mail, Settings, Trash2 } from 'lucide-react';

export function AccountList() {
  const { accounts, activeAccount, setActiveAccount, deleteAccount } = useAccounts();

  return (
    <div className="space-y-2">
      {accounts.map((account) => (
        <Card
          key={account.id}
          className={`p-3 cursor-pointer transition-colors ${
            activeAccount?.id === account.id ? 'bg-accent' : ''
          }`}
          onClick={() => setActiveAccount(account.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5" />
              <div>
                <p className="font-medium">{account.name}</p>
                <p className="text-sm text-muted-foreground">{account.email}</p>
              </div>
            </div>
            <div className="flex space-x-1">
              <Button size="icon" variant="ghost">
                <Settings className="h-4 w-4" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteAccount(account.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
```

### useAccounts Hook
```typescript
// src/renderer/hooks/useAccounts.ts
import { useState, useEffect } from 'react';
import { Account } from '../../types/account';

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccount, setActiveAccountState] = useState<Account | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    const accountList = await window.electron.invoke('account:list');
    const active = await window.electron.invoke('account:getActive');
    setAccounts(accountList);
    setActiveAccountState(active);
  };

  const addAccount = async (accountData: any) => {
    const result = await window.electron.invoke('account:add', accountData);
    if (result.success) {
      await loadAccounts();
    }
    return result;
  };

  const setActiveAccount = async (accountId: string) => {
    await window.electron.invoke('account:setActive', accountId);
    await loadAccounts();
  };

  const deleteAccount = async (accountId: string) => {
    await window.electron.invoke('account:delete', accountId);
    await loadAccounts();
  };

  return {
    accounts,
    activeAccount,
    addAccount,
    setActiveAccount,
    deleteAccount
  };
}
```

## 6. AccountForm erweitern

```typescript
// src/ui/accounts/AccountForm.tsx - erweitert
import { useAccounts } from '../../hooks/useAccounts';

function AccountForm({ onSuccess }: { onSuccess?: () => void }) {
  // ... existing state ...
  const { addAccount } = useAccounts();
  
  const [accountName, setAccountName] = useState('');
  const [email, setEmail] = useState('');
  const [smtpServer, setSmtpServer] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: false });

    const accountData = {
      name: accountName || email,
      email,
      imapConfig: {
        host: server,
        port,
        secure: ssl,
        username,
        password
      },
      smtpConfig: smtpServer ? {
        host: smtpServer,
        port: smtpPort,
        secure: smtpPort === 465,
        username,
        password
      } : undefined,
      isActive: true
    };

    const result = await addAccount(accountData);

    if (result.success) {
      setStatus({ loading: false, error: null, success: true });
      onSuccess?.();
      // Reset form
      setAccountName('');
      setEmail('');
      // ... reset other fields
    } else {
      setStatus({
        loading: false,
        error: result.error || 'Ein unbekannter Fehler ist aufgetreten.',
        success: false,
      });
    }
  };

  // ... rest of the form with additional fields
}
```

## Nächste Schritte:

1. **Account Service testen**
2. **UI für Account-Übersicht in Sidebar**
3. **Email Sync Service beginnen**
4. **Datenbank-Layer planen**