# CLAUDE.md - AI Assistant Guide for ElmecV2-Demo

> This file provides comprehensive guidance for AI assistants working on this codebase.
> Last updated: 2025-11-26

## Project Overview

**ElmecV2-Demo** is an enterprise-grade React Native/Expo mobile application for managing requests, real-time chat, personnel directory, and industrial calculators. The app supports iOS, Android, and Web platforms.

### Tech Stack Summary

| Layer | Technology |
|-------|------------|
| **Framework** | React Native 0.79.5 + Expo 53.0.24 |
| **Language** | TypeScript 5.8.3 (strict mode) |
| **Routing** | Expo Router (file-based routing) |
| **State Management** | Redux Toolkit (calculator) + Context API (auth, chat, notifications) |
| **Backend** | Supabase (PostgreSQL, Auth, Realtime) |
| **Deployment** | Netlify (web), EAS (mobile) |

---

## Quick Commands

```bash
# Development
npm run dev              # Start Expo development server
npm run lint             # Fix linting issues
npm run lint:check       # Check for lint errors
npm run format           # Format code with Prettier
npm run type-check       # Run TypeScript type checking

# Building
npm run build            # Build for web (development)
npm run build:production # Build for web (production)

# Deployment
npm run deploy           # Deploy to Netlify production
npm run deploy:preview   # Deploy preview to Netlify

# Testing
npm test                 # Run Jest tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage

# Validation scripts
npm run validate-demo    # Validate demo data
npm run test-supabase    # Test Supabase connection
npm run test-logins      # Test authentication

# Native platforms
npm run android          # Run on Android
npm run ios              # Run on iOS
```

---

## Project Structure

```
elmecV2-Demo/
├── app/                    # Expo Router screens (file-based routing)
│   ├── _layout.tsx         # Root layout (providers, fonts, error boundary)
│   ├── index.tsx           # Landing page
│   ├── +not-found.tsx      # 404 page
│   ├── auth/               # Authentication screens
│   │   ├── _layout.tsx     # Auth stack layout
│   │   ├── index.tsx       # Auth entry/welcome
│   │   ├── login.tsx       # Login screen
│   │   ├── register.tsx    # Registration screen
│   │   ├── forgot-password.tsx
│   │   └── reset-password.tsx
│   ├── (tabs)/             # Main app (bottom tab navigation)
│   │   ├── _layout.tsx     # Tab navigator (6 tabs)
│   │   ├── index.tsx       # Home/Dashboard
│   │   ├── directory.tsx   # Personnel directory
│   │   ├── requests.tsx    # Request management (CRM)
│   │   ├── chat/           # Chat module
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx   # Chat rooms list
│   │   │   └── [roomId].tsx # Dynamic chat room
│   │   ├── calculator.tsx  # Calculator entry
│   │   └── profile.tsx     # User profile
│   ├── calculator/         # Calculator screens
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── BarrenadoScreen.tsx  # Drilling calculator
│   │   ├── FresadoScreen.tsx    # Milling calculator
│   │   └── SettingsCalculadoraScreen.tsx
│   ├── profile/
│   │   └── requests-by-status.tsx
│   └── settings/
│       ├── _layout.tsx
│       └── account.tsx
│
├── components/             # Reusable UI components
│   ├── ContextProviders.tsx     # Context wrapper component
│   ├── ErrorBoundary.tsx        # Error boundary
│   ├── AdminDashboard.tsx       # Admin panel
│   ├── MessageBubble.tsx        # Chat message component
│   ├── TypingIndicator.tsx      # Chat typing animation
│   ├── EmojiPicker.tsx          # Emoji selector
│   ├── FileUploadComponent.tsx  # File upload handler
│   ├── NotificationToast.tsx    # Toast notifications
│   ├── HeaderComponent.tsx      # Navigation header
│   ├── HealthCheck.tsx          # System health monitor
│   └── calculator/              # Calculator UI components
│
├── contexts/               # Global state (Context API)
│   ├── AuthContext.tsx     # Authentication & user session
│   ├── ChatContext.tsx     # Real-time chat & messaging
│   └── NotificationContext.tsx  # Push & in-app notifications
│
├── store/                  # Redux store (calculator only)
│   ├── index.ts            # Store configuration
│   ├── hooks.ts            # Typed hooks (useAppDispatch, useAppSelector)
│   └── calculatorSlice.ts  # Calculator state slice
│
├── services/               # API services
│   ├── supabaseService.ts  # Supabase CRUD operations
│   └── apiService.ts       # Legacy REST API client
│
├── hooks/                  # Custom React hooks
│   ├── useChat.ts          # Chat context hook
│   ├── useFrameworkReady.ts
│   └── useSupabaseHealth.ts
│
├── lib/                    # Library configurations
│   └── supabase.ts         # Supabase client initialization
│
├── types/                  # TypeScript definitions
│   ├── supabase.ts         # Database types (User, Request, Message, etc.)
│   ├── supabase-helpers.ts # Helper types for updates
│   └── supabase-override.d.ts
│
├── utils/                  # Utility functions
│   ├── errorHandler.ts     # Centralized error handling
│   ├── logger.ts           # Structured logging system
│   ├── calculatorUtils.ts  # Calculator math functions
│   └── fileUpload.ts       # File upload utilities
│
├── constants/              # App constants
│   ├── commons.ts          # API URLs, enums, collections
│   ├── calculator.ts       # Calculator constants
│   ├── colors.ts           # Color palette
│   └── types.ts            # Type constants
│
├── i18n/                   # Internationalization (Spanish primary)
│   └── index.ts            # i18next configuration
│
├── assets/                 # Static assets (images, fonts)
├── supabase/               # Supabase configuration
│   ├── config.toml         # Local development config
│   └── migrations/         # SQL migrations
├── scripts/                # Utility scripts
├── public/                 # Public web assets
└── docs/                   # Documentation
```

---

## Architecture Patterns

### 1. State Management (Hybrid Approach)

```typescript
// Redux: Used ONLY for Calculator module
import { useAppDispatch, useAppSelector } from '@/store/hooks';
const dispatch = useAppDispatch();
const calculatorState = useAppSelector(state => state.calculator);
dispatch(setField({ field: 'D', value: '10' }));

// Context API: Used for Auth, Chat, Notifications
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { useNotifications } from '@/contexts/NotificationContext';

const { user, login, logout } = useAuth();
const { chatRooms, sendMessage, markMessagesAsRead } = useChat();
const { notifications, sendDemoNotification } = useNotifications();
```

### 2. Provider Hierarchy

```tsx
// app/_layout.tsx
<ErrorBoundary>
  <Provider store={store}>
    <ContextProviders>
      {/* AuthContext, ChatContext, NotificationContext */}
      <Stack>{/* Routes */}</Stack>
    </ContextProviders>
  </Provider>
</ErrorBoundary>
```

### 3. File-Based Routing (Expo Router)

- `app/` directory defines routes automatically
- `_layout.tsx` files define navigation layouts
- `[param].tsx` files create dynamic routes
- `(group)/` folders create route groups without affecting URL

### 4. Real-Time Subscriptions

```typescript
// ChatContext pattern for real-time
const channel = supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `chat_room_id=eq.${roomId}`
  }, handleNewMessage)
  .subscribe();
```

---

## Code Style & Conventions

### TypeScript

- **Strict mode enabled** - All files must be properly typed
- **Path aliases** - Use `@/` prefix for imports (e.g., `@/components/`, `@/contexts/`)
- **Interface naming** - PascalCase, descriptive names (e.g., `ChatRoom`, `UserProfile`)

### ESLint Rules (Key)

```javascript
// Enforced rules
'react-hooks/rules-of-hooks': 'error'
'react-hooks/exhaustive-deps': 'warn'
'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
'@typescript-eslint/no-explicit-any': 'warn'
'react-native/no-unused-styles': 'error'
'react-native/no-inline-styles': 'warn'
'prefer-const': 'error'
'no-var': 'error'
```

### Prettier Configuration

```json
{
  "singleQuote": true,
  "tabWidth": 2,
  "semi": true,
  "trailingComma": "es5",
  "printWidth": 80,
  "arrowParens": "avoid"
}
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `MessageBubble.tsx` |
| Hooks | camelCase with `use` prefix | `useChat.ts` |
| Contexts | PascalCase with `Context` suffix | `AuthContext.tsx` |
| Services | camelCase with `Service` suffix | `supabaseService.ts` |
| Utils | camelCase | `errorHandler.ts` |
| Types | PascalCase | `ChatRoom`, `User` |
| Constants | UPPER_SNAKE_CASE or camelCase | `API_BASE_URL`, `requestTypes` |

---

## Database Schema (Supabase)

### Main Tables

```sql
-- Users table
users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  empresa TEXT,
  nombre TEXT,
  apellido_paterno TEXT,
  apellido_materno TEXT,
  celular TEXT,
  ciudad TEXT,
  estado TEXT,
  rol TEXT, -- 'customer' | 'agent' | 'admin'
  categoria TEXT,
  zona TEXT,
  activo BOOLEAN,
  foto TEXT,
  is_online BOOLEAN,
  last_seen TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Requests (CRM tickets)
requests (
  id UUID PRIMARY KEY,
  titulo TEXT,
  mensaje TEXT,
  tipo TEXT, -- 'soporte_tecnico' | 'facturacion' | 'informacion' | 'queja' | 'sugerencia'
  prioridad TEXT, -- 'baja' | 'media' | 'alta' | 'urgente'
  estatus TEXT, -- 'nuevo' | 'asignado' | 'en_proceso' | 'pausado' | 'resuelto' | 'cerrado'
  usuario_id UUID REFERENCES users(id),
  agente_id UUID REFERENCES users(id),
  archivos JSONB,
  tags TEXT[],
  rating INTEGER,
  feedback TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Chat rooms
chat_rooms (
  id UUID PRIMARY KEY,
  tipo TEXT, -- 'support' | 'sales' | 'general'
  participants UUID[],
  request_id UUID REFERENCES requests(id),
  last_message TEXT,
  is_active BOOLEAN,
  metadata JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Messages
messages (
  id UUID PRIMARY KEY,
  chat_room_id UUID REFERENCES chat_rooms(id),
  sender_id UUID REFERENCES users(id),
  sender_name TEXT,
  message TEXT,
  type TEXT, -- 'text' | 'image' | 'file' | 'audio' | 'system'
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  audio_duration INTEGER,
  reply_to UUID REFERENCES messages(id),
  read_by UUID[],
  edited_at TIMESTAMP,
  is_deleted BOOLEAN,
  created_at TIMESTAMP
)

-- Notifications
notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title TEXT,
  body TEXT,
  type TEXT, -- 'request' | 'message' | 'assignment' | 'reminder'
  priority TEXT,
  data JSONB,
  read BOOLEAN,
  read_at TIMESTAMP,
  expired_at TIMESTAMP,
  created_at TIMESTAMP
)
```

---

## Environment Variables

```bash
# Required
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
EXPO_PUBLIC_ENVIRONMENT=development  # or 'production'

# Optional
EXPO_PUBLIC_BASIC_AUTH=false         # Enable mock auth for development
EXPO_PUBLIC_OFFLINE_MODE=false
EXPO_PUBLIC_API_BASE_URL=            # Legacy API URL
EXPO_PUBLIC_EAS_PROJECT_ID=elmec-mobile-app-demo

# Server-side only (never expose to client)
SUPABASE_SERVICE_ROLE_KEY=eyJyyy...
DEFAULT_TEMP_PASSWORD=ChangeMe123!
```

---

## Common Development Tasks

### Adding a New Screen

1. Create file in `app/` directory following routing conventions
2. Add `_layout.tsx` if new navigation group needed
3. Export default component with typed props
4. Add to navigation if manual linking required

```tsx
// app/new-feature/index.tsx
import { View, Text, StyleSheet } from 'react-native';

export default function NewFeatureScreen() {
  return (
    <View style={styles.container}>
      <Text>New Feature</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
```

### Adding a New Context

1. Create context file in `contexts/`
2. Define types for state and actions
3. Create provider component with hooks
4. Add to `ContextProviders.tsx`
5. Export custom hook for consumption

```tsx
// contexts/NewContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

interface NewContextType {
  data: string;
  updateData: (value: string) => void;
}

const NewContext = createContext<NewContextType | null>(null);

export function NewProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState('');

  return (
    <NewContext.Provider value={{ data, updateData: setData }}>
      {children}
    </NewContext.Provider>
  );
}

export function useNew() {
  const context = useContext(NewContext);
  if (!context) throw new Error('useNew must be used within NewProvider');
  return context;
}
```

### Working with Supabase

```typescript
// Basic CRUD operations
import { supabase } from '@/lib/supabase';

// Read
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('activo', true);

// Create
const { data, error } = await supabase
  .from('requests')
  .insert({ titulo: 'New Request', usuario_id: userId })
  .select()
  .single();

// Update
const { data, error } = await supabase
  .from('requests')
  .update({ estatus: 'en_proceso' })
  .eq('id', requestId);

// Delete
const { error } = await supabase
  .from('notifications')
  .delete()
  .eq('id', notificationId);

// Real-time subscription
const channel = supabase
  .channel('custom-channel')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'messages'
  }, payload => console.log(payload))
  .subscribe();
```

---

## Error Handling

### Using the Error Handler

```typescript
import { ErrorHandler, ErrorSeverity, ErrorCategory } from '@/utils/errorHandler';

try {
  // Operation that may fail
} catch (error) {
  ErrorHandler.handle(error, {
    severity: ErrorSeverity.MEDIUM,
    category: ErrorCategory.DATABASE,
    context: { operation: 'fetchUsers' }
  });
}
```

### Using the Logger

```typescript
import { Logger } from '@/utils/logger';

Logger.info('Operation completed', { userId, action: 'login' });
Logger.warn('Deprecated API usage', { endpoint });
Logger.error('Failed to fetch data', { error, context });
```

---

## Important Notes for AI Assistants

### Do's

1. **Always run `npm run lint` and `npm run type-check`** after making changes
2. **Use existing patterns** - Follow the established Context/Redux hybrid approach
3. **Preserve TypeScript strict mode** - Ensure all types are properly defined
4. **Use path aliases** - Import with `@/` prefix
5. **Follow file-based routing** - Place screens in correct `app/` subdirectories
6. **Check for existing components** before creating new ones
7. **Use the error handling utilities** for consistent error management
8. **Test Supabase operations** locally before committing

### Don'ts

1. **Don't mix state management approaches** - Keep Redux for calculator, Context for rest
2. **Don't hardcode sensitive data** - Use environment variables
3. **Don't skip TypeScript types** - Avoid `any` unless absolutely necessary
4. **Don't create new navigation patterns** - Use Expo Router conventions
5. **Don't modify Supabase migrations** in production - Create new migration files
6. **Don't use inline styles excessively** - Use StyleSheet.create()

### Known Issues

1. **Metro config**: May have react-native-reanimated conflicts - check metro.config.js
2. **Web platform**: Some native features (camera, audio recording) are limited
3. **Demo mode**: `app/(tabs)/requests.tsx` has demo simulation code that should be removed in production
4. **Dashboard data**: `app/(tabs)/index.tsx` has hardcoded activity data that needs real queries

### Key Files to Understand

| File | Purpose |
|------|---------|
| `app/_layout.tsx` | Root layout, provider setup, font loading |
| `contexts/AuthContext.tsx` | Authentication flow, session management |
| `contexts/ChatContext.tsx` | Real-time messaging implementation |
| `services/supabaseService.ts` | All Supabase CRUD operations |
| `lib/supabase.ts` | Supabase client initialization |
| `types/supabase.ts` | Database type definitions |

---

## Deployment Checklist

### Pre-deployment

- [ ] All TypeScript errors resolved (`npm run type-check`)
- [ ] All linting errors fixed (`npm run lint:check`)
- [ ] Environment variables set for production
- [ ] Remove demo/simulation code
- [ ] Replace hardcoded data with real queries
- [ ] Test authentication flow
- [ ] Test real-time features
- [ ] Verify Supabase RLS policies

### Deployment

```bash
# Web (Netlify)
npm run build:production
npm run deploy

# Mobile (EAS)
eas build --platform all
eas submit --platform all
```

---

## Additional Resources

- **Project Documentation**: `.claude/PROJECT_DOCUMENTATION.md`
- **Session Logs**: `.claude/SESSION_LOG.md`
- **SQL Migrations**: `supabase/migrations/`
- **Demo Data Setup**: `CONFIGURACION_SUPABASE.md`
- **Deployment Guide**: `DEPLOY-NETLIFY.md`

---

*This document should be updated when significant architectural changes are made to the project.*
