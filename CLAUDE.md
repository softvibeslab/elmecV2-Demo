# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ElmecV2 is a React Native/Expo enterprise application for request management, real-time chat, and industrial calculators. It runs on iOS, Android, and Web with Spanish localization.

**Stack:** React Native 0.79, Expo 53, TypeScript 5.8, Supabase (PostgreSQL, Auth, Realtime)

## Essential Commands

```bash
# Development
npm run dev                    # Start Expo dev server
npm run android                # Run on Android
npm run ios                    # Run on iOS

# Code Quality (run before commits)
npm run pre-commit             # Runs lint:check, format:check, type-check
npm run lint                   # ESLint with auto-fix
npm run format                 # Prettier formatting
npm run type-check             # TypeScript check

# Build & Deploy
npm run build:production       # Production web build
npm run deploy                 # Deploy to Netlify production
npm run deploy:preview         # Deploy preview

# Database Scripts
npm run test-supabase          # Test Supabase connection
npm run setup-supabase         # Setup Supabase completely
npm run test-logins            # Test login functionality
```

## Architecture

### File-Based Routing (Expo Router)
- `app/` - Screens using file-based routing
- `app/(tabs)/` - Tab navigation (home, directory, requests, chat, calculator, profile)
- `app/auth/` - Authentication screens (login, register, forgot-password)
- `app/calculator/` - Calculator sub-screens (Barrenado, Fresado)

### State Management
- **Context API** (primary): `AuthContext`, `ChatContext`, `NotificationContext` in `contexts/`
- **Redux Toolkit** (calculator only): `store/calculatorSlice.ts`

### Key Directories
- `components/` - Reusable UI components
- `services/supabaseService.ts` - All Supabase database operations
- `lib/supabase.ts` - Supabase client initialization
- `hooks/` - Custom hooks (useChat, useSupabaseHealth)
- `utils/` - Logger, error handler, calculator utilities
- `constants/` - Colors, types, calculator constants
- `supabase/migrations/` - SQL migration files

### Real-time Features
Chat uses Supabase Realtime subscriptions for:
- New messages (INSERT on `messages` table)
- Message updates (UPDATE on `messages` table)
- Typing indicators

## Code Style

- Single quotes, 2-space indentation, trailing commas (es5)
- Use `@/` path alias for imports (configured in babel.config.js)
- Colors must use constants from `constants/colors.ts` - no inline color literals
- ESLint strict mode with TypeScript rules enforced

## Environment Variables

Required in `.env` (copy from `.env.example`):
```
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_ENVIRONMENT=development|production
EXPO_PUBLIC_BASIC_AUTH=true|false   # Enable for dev without Supabase Auth
```

## Database

Tables: `users`, `requests`, `chat_rooms`, `messages`, `notifications`

Row Level Security (RLS) is enabled on all tables. See `supabase/migrations/` for schema.

## Testing

Jest is configured but **no test files currently exist**. Test commands:
```bash
npm test                       # Run tests
npm run test:coverage          # With coverage
```

## Known Issues

- `metro.config.js` has a temporary workaround for react-native-reanimated
- Some demo data is hardcoded in `app/(tabs)/index.tsx` (home screen stats)
- `app/(tabs)/requests.tsx` contains simulation code for demo purposes (lines with `setInterval`)

## Deployment

- **Web (Netlify):** Configured in `netlify.toml`, deploys from `dist/` directory
- **Mobile (EAS):** Configured in `eas.json` for development, preview, and production builds
- Security headers are pre-configured for Supabase connections
