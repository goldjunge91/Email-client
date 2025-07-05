---
applyTo: '**'
---
# Electron Bones - Cursor Rules

You are an expert Electron + React + TypeScript developer working with the Electron Bones boilerplate. This is a comprehensive, production-ready Electron application template.

## Project Overview

This is the **Electron Bones** boilerplate - a batteries-included Electron application with React, TypeScript, Tailwind CSS, and Shadcn/ui components. The project focuses on:

- **Cross-platform desktop applications** (Windows, macOS, Linux)
- **Modern React patterns** with hooks and TypeScript
- **Production-ready features** (auto-updater, analytics, error handling)
- **Beautiful UI** with Tailwind CSS and Shadcn/ui
- **Developer experience** with hot reload, testing, and linting

## Architecture & Structure

### Core Architecture
```
src/
├── main/           # Main process (Node.js/Electron)
├── renderer/       # Renderer process (React)
├── types/          # Shared TypeScript definitions
└── utils/          # Shared utilities
```

### Main Process (`src/main/`)
- **`main.ts`** - Application entry point
- **`create-window.ts`** - Window management and creation
- **`menu.ts`** - Application menu bar (native menus)
- **`ipc.ts`** - Inter-process communication handlers
- **`store.ts`** - Persistent storage with electron-store
- **`auto-update.ts`** - Auto-updater functionality
- **`tray.ts`** - System tray integration
- **`notifications.ts`** - System notifications
- **`keyboard.ts`** - Global keyboard shortcuts

### Renderer Process (`src/renderer/`)
- **`components/`** - Reusable UI components
- **`views/`** - Application screens/pages
- **`context/`** - React context providers
- **`lib/`** - Client-side utilities
- **`styles/`** - Global styles and Tailwind config

## Coding Conventions

### TypeScript
- Use **strict mode** - all TypeScript strict flags enabled
- Prefer **interface** over **type** for object definitions
- Use **explicit return types** for functions
- Implement **proper error handling** with typed errors

### React Patterns
- Use **functional components** with hooks
- Prefer **custom hooks** for complex logic
- Use **React.memo()** for performance optimization
- Implement **proper cleanup** in useEffect

### File Naming
- **PascalCase** for React components: `UserProfile.tsx`
- **camelCase** for utilities and hooks: `useAppState.ts`
- **kebab-case** for non-component files: `auto-update.ts`
- **UPPERCASE** for constants: `APP_CONFIG.ts`

### Import Organization
```typescript
// 1. Node.js/Electron imports
import { app, BrowserWindow } from 'electron'
import path from 'path'

// 2. External libraries
import React from 'react'
import { Button } from '@/components/ui/button'

// 3. Internal imports (absolute paths)
import { AppContext } from '@/context/AppContext'
import { createWindow } from '@/main/create-window'

// 4. Relative imports
import './styles.css'
```

## IPC Communication Patterns

### Type-Safe IPC
Always use typed IPC handlers and invocations:

```typescript
// Main process (ipc.ts)
ipcMain.handle('app:get-version', (): string => {
  return app.getVersion()
})

// Renderer process
const version = await window.electronAPI.invoke('app:get-version')
```

### IPC Channel Naming
Use namespace prefixes:
- **`app:`** - Application-level operations
- **`store:`** - Data storage operations
- **`window:`** - Window management
- **`system:`** - System integration

## State Management

### React Context Pattern
Use context providers for global state:

```typescript
// AppContext.tsx
interface AppState {
  user: User | null
  settings: AppSettings
  isOnline: boolean
}

const AppContext = createContext<AppState | null>(null)

// Custom hook
export const useAppState = () => {
  const context = useContext(AppContext)
  if (!context) throw new Error('useAppState must be used within AppProvider')
  return context
}
```

### Electron Store
Use electron-store for persistent data:

```typescript
import { store } from '@/main/store'

// Save data
store.set('user.preferences', preferences)

// Load with defaults
const theme = store.get('ui.theme', 'system')
```

## UI Development Guidelines

### Tailwind CSS
- Use **Tailwind classes** for styling
- Create **custom components** for repeated patterns
- Use **responsive prefixes**: `sm:`, `md:`, `lg:`, `xl:`
- Leverage **group** and **peer** modifiers

### Shadcn/ui Components
- Use Shadcn components as building blocks
- **Customize** components in `src/components/ui/`
- Follow the **composition pattern** over inheritance
- Use **variants** for component customization

### Dark Mode
- Use the **next-themes** provider
- Test components in **both light and dark modes**
- Use **semantic color names** from the theme

## Error Handling

### Main Process Errors
```typescript
import { handleError } from '@/main/error-handling'

try {
  // Risky operation
} catch (error) {
  handleError(error, 'operation-context')
}
```

### Renderer Process Errors
```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Wrap components that might throw
<ErrorBoundary fallback={<ErrorFallback />}>
  <RiskyComponent />
</ErrorBoundary>
```

## Testing Guidelines

### Unit Tests
- Test **business logic** and utilities
- Mock **Electron APIs** in tests
- Use **React Testing Library** for component tests

### File Naming
- **`.test.ts`** for unit tests
- **`.test.tsx`** for component tests
- **`.spec.ts`** for integration tests

## Performance Optimization

### Main Process
- Use **worker threads** for CPU-intensive tasks
- Implement **proper memory management**
- Cache **frequently accessed data**

### Renderer Process
- Use **React.memo()** for expensive components
- Implement **virtualization** for large lists
- **Lazy load** routes and components

## Security Best Practices

### Context Isolation
- Always use **context isolation** enabled
- Expose **minimal APIs** through preload scripts
- **Validate** all IPC inputs

### Content Security Policy
- Implement **strict CSP** headers
- Avoid **inline scripts** and styles
- **Sanitize** user inputs

## Build & Deployment

### Development
```bash
npm start           # Start with hot reload
npm run lint        # Run ESLint
npm test           # Run test suite
```

### Production
```bash
npm run build      # Build for production
npm run package    # Package for all platforms
```

### Auto-Updates
- Configure **code signing** for production
- Test **update flows** thoroughly
- Handle **update errors** gracefully

## Common Patterns

### Window Management
```typescript
// Create child windows
const settingsWindow = createChildWindow({
  title: 'Settings',
  width: 600,
  height: 400,
  route: '/settings'
})
```

### System Integration
```typescript
// Add to system tray
const tray = createTray()
tray.setContextMenu(contextMenu)

// Register global shortcuts
globalShortcut.register('CommandOrControl+Shift+D', showDevTools)
```

### Data Persistence
```typescript
// Save user preferences
store.set('user.preferences', {
  theme: 'dark',
  notifications: true
})

// Listen for changes
store.onDidChange('user.preferences', (newValue, oldValue) => {
  updateUI(newValue)
})
```

## Example code:
[examples.md](./examples.md)


## Debugging

### Main Process
- Use **console.log** or **electron-log**
- Enable **DevTools** for main process debugging
- Use **VS Code debugger** with proper configuration

### Renderer Process
- Use **React DevTools** extension
- Leverage **browser DevTools**
- Use **Redux DevTools** if using Redux

## Dependencies Management

### Core Dependencies
- **electron** - Desktop app framework
- **react** + **react-dom** - UI framework
- **typescript** - Type safety
- **tailwindcss** - Styling
- **@radix-ui/*** - Headless UI components

### Keep Updated
- Regularly update **Electron** for security patches
- Update **React** for new features and fixes
- Monitor **security advisories** for dependencies

## File Organization Rules

### Component Structure
```typescript
// Component file structure
import React from 'react'
import { cn } from '@/lib/utils'

interface ComponentProps {
  // Props interface
}

export const Component: React.FC<ComponentProps> = ({ ...props }) => {
  // Component implementation
}

// Export default if single component
export default Component
```

### Hook Structure
```typescript
// Custom hook structure
import { useState, useEffect } from 'react'

interface UseHookOptions {
  // Options interface
}

export const useCustomHook = (options: UseHookOptions) => {
  // Hook implementation
  return {
    // Return object
  }
}
```

## Key Reminders

1. **Always** use TypeScript strict mode
2. **Test** on all target platforms during development
3. **Handle** offline scenarios gracefully
4. **Implement** proper error boundaries
5. **Use** semantic versioning for releases
6. **Document** complex business logic
7. **Follow** accessibility guidelines (WCAG)
8. **Optimize** for performance and memory usage
9. **Secure** all IPC communications
10. **Monitor** application analytics and errors

This boilerplate is designed for **production-ready applications**. Always consider security, performance, and user experience in your implementations.