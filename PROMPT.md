# PROMPT - Projekt Management Gantt App

## Projektöversikt

Detta är en modern React-applikation för projektplanering med Gantt-diagram. Applikationen är byggd med React 18, Firebase (Firestore & Authentication), och Tailwind CSS. Den är optimerad för prestanda med code splitting, memoization, och lazy loading.

**Version:** 3.7.0  
**Namn:** projekt-planering-gantt  
**Beskrivning:** Projektplanering med Gantt-diagram

## Teknisk Stack

### Core Dependencies
- **React 18.2.0** - UI-bibliotek
- **Firebase 10.14.1** - Backend (Firestore, Authentication, Analytics)
- **Vite 5.0.8** - Build tool och dev server
- **Tailwind CSS 3.3.6** - Styling framework
- **Lucide React 0.294.0** - Ikoner

### Development Dependencies
- **@vitejs/plugin-react** - React plugin för Vite
- **PostCSS & Autoprefixer** - CSS processing

## Arkitektur

### Huvudkomponenter

**App.jsx** - Huvudkomponenten som sammanställer hela applikationen:
- Hanterar autentisering via `useAuth` hook
- Hanterar tasks via `useTasks` hook
- Hanterar UI-state (modals, sidebar, dashboard)
- Implementerar filter, sortering och gruppering
- Lazy loading av modaler och stora komponenter
- Error boundaries för felhantering

### Hooks (Custom React Hooks)

1. **useAuth.js** - Autentisering
   - Hanterar login, register, logout
   - Stöd för demo-mode (endast localhost)
   - Firebase Authentication integration

2. **useTasks.js** - Task management
   - CRUD-operationer för tasks
   - Real-time synkronisering med Firestore
   - Backup/restore funktionalitet (lokal och moln)
   - Export/import (JSON, CSV)
   - Demo-mode med localStorage (endast localhost)

3. **useQuickList.js** - Quick list management
   - Hanterar snabblistor
   - Arkiv och papperskorg för quick list items

4. **useDragAndDrop.js** - Drag & drop funktionalitet
   - Hanterar drag operations i Gantt-diagrammet
   - Uppdaterar task-datum vid drag

5. **useTaskFilters.js** - Filter och sparade vyer
   - Avancerade filter (client, phase, status, tags, roles)
   - Sparade vyer med localStorage
   - Filter-persistens

6. **useTimeline.js** - Timeline-hantering
   - Zoom-nivåer (day, week, month)
   - View navigation

7. **useDebounce.js** - Debounce utility
   - Används för sökning för att minska re-renders

### Komponentstruktur

#### Layout Components (`components/layout/`)
- **Header.jsx** - Huvudmeny med navigation, sökning, zoom-kontroller
- **Sidebar.jsx** - Task-lista med filter och sortering

#### Gantt Components (`components/gantt/`)
- **GanttTimeline.jsx** - Huvudkomponent för Gantt-diagrammet
  - Visar tasks som bars på en tidslinje
  - Stöd för drag & drop
  - Checklist items kan visas inuti bars
  - Zoom-nivåer (day/week/month)

#### Dashboard Components (`components/dashboard/`)
- **Dashboard.jsx** - Översiktsvy med statistik och workload

#### Modal Components (`components/modals/`)
- **TaskModal.jsx** - Redigera/skapa tasks
- **SettingsModal.jsx** - Applikationsinställningar
- **ArchiveModal.jsx** - Visa arkiverade tasks
- **TrashModal.jsx** - Visa borttagna tasks
- **QuickListModal.jsx** - Hantera snabblistor
- **QuickListArchiveModal.jsx** - Arkiv för quick list
- **QuickListTrashModal.jsx** - Papperskorg för quick list
- **WorkloadTasksModal.jsx** - Workload-statistik

#### Common Components (`components/common/`)
- **AuthScreen.jsx** - Login/register skärm
- **ErrorBoundary.jsx** - React error boundary
- **ErrorDisplay.jsx** - Felvisning
- **FiltersBar.jsx** - Filter-kontroller
- **FirebaseHealthCheck.jsx** - Firebase connection diagnostic
- **DemoModeWarning.jsx** - Varning för demo-mode
- **TaskItem.jsx** - Task list item
- **ChecklistItem.jsx** - Checklist item component
- **RoleBadge.jsx** - Roll-badge component
- **QuickList.jsx** - Quick list component

### Utils (`utils/`)
- **helpers.js** - Hjälpfunktioner (generateId, formatDate, checkIsDone, etc.)
- **toast.js** - Toast notification system
- **validation.js** - Data validation för tasks
- **export.js** - Export-funktioner (CSV, JSON)
- **date.js** - Datum-hjälpfunktioner
- **task.js** - Task-specifika utilities

### Config (`config/`)
- **firebase.js** - Firebase konfiguration och initialisering
  - Stöd för environment variables (VITE_FIREBASE_*)
  - Fallback till hardcoded config
  - Demo-mode detection (endast localhost)
  - Firestore collection helpers

### Constants (`constants/`)
- **index.js** - Applikationskonstanter
  - ZOOM_LEVELS (day, week, month)
  - STATUSES (Planerad, Pågående, Klar, Försenad)
  - ROLES (assignee, executor, CAD, reviewer, agent, BE, PL)
  - BREAKPOINTS (MOBILE: 768)
  - DRAG_THRESHOLD (5px)
- **translations.js** - Översättningar (Svenska/Engelska)

### Types (`types/`)
- **index.js** - TypeScript-typer (om TypeScript används) eller JSDoc-typer

## Funktioner

### Core Features
1. **Gantt-diagram**
   - Visuell tidslinje med tasks som bars
   - Drag & drop för att ändra start/slutdatum
   - Zoom-nivåer (dag, vecka, månad)
   - Checklist items kan visas inuti bars

2. **Task Management**
   - Skapa, redigera, ta bort tasks
   - Status-hantering (Planerad, Pågående, Klar, Försenad)
   - Checklistor med datum och executor
   - Roller (UA, HL, CAD, G, O, BE, PL)
   - Tags och kategorier
   - Client och phase

3. **Filter & Sortering**
   - Sökning i titel, client, phase, executor
   - Filter på client, phase, status, tags, roles
   - Sortering på startDate, endDate, title
   - "Endast mina tasks" filter
   - Sparade vyer

4. **Dashboard**
   - Översikt över alla tasks
   - Statistik per roll
   - Workload-visualisering
   - Deadline-varningar

5. **Backup & Restore**
   - Lokal backup (JSON export/import)
   - Moln-backup (Firestore)
   - Automatisk backup-hantering

6. **Arkiv & Papperskorg**
   - Arkivera tasks (markera som klara)
   - Papperskorg för borttagna tasks
   - Återställning från arkiv/papperskorg
   - Permanent borttagning

7. **Quick List**
   - Snabblista för enkla tasks
   - Egen arkiv/papperskorg

8. **Inställningar**
   - Dark mode
   - Tvåspråkig (Svenska/Engelska)
   - Warning threshold för deadlines
   - Visa/dölj checklist i Gantt

9. **Export/Import**
   - CSV export
   - JSON export/import

## Firebase Konfiguration

### Environment Variables
Applikationen stödjer environment variables med `VITE_` prefix:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `VITE_APP_ID`
- `VITE_INITIAL_AUTH_TOKEN`

Om environment variables inte är satta, används hardcoded config (endast för utveckling).

### Firestore Struktur
```
artifacts/
  {appId}/
    users/
      {userId}/
        tasks/
          {taskId}/
        backups/
          {backupId}/
```

### Demo Mode
- Demo-mode är endast tillgängligt på localhost
- Använder localStorage istället för Firestore
- I produktion krävs riktig Firebase Authentication
- Demo users har UID som börjar med `demo-user-`

## Performance Optimeringar

1. **Code Splitting**
   - Lazy loading av modaler
   - Lazy loading av Dashboard och GanttTimeline
   - React.Suspense för loading states

2. **Memoization**
   - React.memo för komponenter
   - useCallback för event handlers
   - useMemo för beräkningar (processedTasks, activeTasksCount)

3. **Debouncing**
   - Sökning är debounced (300ms)

4. **Optimized Re-renders**
   - Conditional rendering
   - State management optimering

## Felhantering

1. **Error Boundaries**
   - ErrorBoundary component för att fånga React-fel
   - ErrorDisplay för användarvänlig felvisning

2. **Toast Notifications**
   - showSuccess, showError för användarfeedback
   - Automatisk initiering vid laddning

3. **Try-Catch Blocks**
   - Alla async operationer har felhantering
   - Retry-funktionalitet för failed operations

4. **Firebase Health Check**
   - FirebaseHealthCheck component diagnostiserar connection
   - Loggar status till console

## Accessibility

- ARIA labels på interaktiva element
- Keyboard navigation support
- Semantic HTML
- Screen reader support

## Responsive Design

- Breakpoint vid 768px (MOBILE)
- Sidebar stängs automatiskt på mobil
- Responsiv Gantt-timeline
- Touch support för drag & drop

## Development Guidelines

### Naming Conventions
- Komponenter: PascalCase (TaskModal.jsx)
- Hooks: camelCase med "use" prefix (useTasks.js)
- Utils: camelCase (helpers.js)
- Constants: UPPER_SNAKE_CASE (ZOOM_LEVELS)

### File Organization
- Komponenter grupperade efter funktion (layout, modals, common, etc.)
- Hooks i separat `hooks/` mapp
- Utils i `utils/` mapp
- Config i `config/` mapp
- Constants i `constants/` mapp

### State Management
- Local state med useState
- Custom hooks för delad logik
- localStorage för persistens (settings, saved views)
- Firestore för data persistence

### Styling
- Tailwind CSS utility classes
- Dark mode via `dark:` prefix
- Responsive via breakpoint utilities
- Custom CSS i `index.css` för globala styles

## Deployment

### Vercel Deployment
- Se `DEPLOYMENT.md` för detaljerade instruktioner
- Environment variables måste sättas i Vercel dashboard
- Production build: `npm run build`
- Preview: `npm run preview`

### Build Process
1. `npm run dev` - Development server
2. `npm run build` - Production build
3. `npm run preview` - Preview production build

## Viktiga Noteringar

1. **Firebase Config**
   - Konfiguration förväntas finnas i environment variables eller hardcoded
   - Demo-mode fungerar endast på localhost
   - Production kräver riktig Firebase Authentication

2. **Toast System**
   - Initieras automatiskt vid laddning
   - Använd `showSuccess()` och `showError()` från `utils/toast.js`

3. **Task Validation**
   - Alla tasks valideras via `utils/validation.js`
   - Normalisering av data vid import

4. **ID Generation**
   - Använd `generateId()` från `utils/helpers.js`
   - Garanterar unika ID:n

5. **Date Handling**
   - Använd `formatDate()` från `utils/helpers.js`
   - Datum lagras som ISO-strängar i Firestore

6. **Translations**
   - Använd `TRANSLATIONS[lang][key]` från `constants/translations.js`
   - Stöd för Svenska (sv) och Engelska (en)

## Migration Notes

Koden har refaktorerats från en monolitisk struktur till en modulär arkitektur:
- Komponenter är uppdelade i logiska grupper
- Hooks separerade från komponenter
- Utils och constants centraliserade
- Bakåtkompatibel med tidigare versioner

## Testing

- Error boundaries testas via ErrorBoundary component
- Firebase health check diagnostiserar connection
- Demo-mode kan testas lokalt utan Firebase

## Framtida Förbättringar

- Unit tests
- Integration tests
- E2E tests
- TypeScript migration
- Offline support (Service Workers)
- Real-time collaboration
- Notifikationer för deadlines
