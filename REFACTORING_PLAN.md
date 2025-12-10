# Refaktoreringsplan - Gantt App

## Föreslagen filstruktur

```
src/
├── App.tsx (eller App.jsx) - Huvudkomponent (tidigare GanttApp.jsx)
├── main.jsx - Entry point (oförändrad)
├── index.css - Globala styles (oförändrad)
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx - Header med sök, språk, dark mode, zoom, knappar
│   │   └── Sidebar.tsx - Sidomeny med uppgiftslista (redan finns, flytta hit)
│   │
│   ├── gantt/
│   │   └── GanttTimeline.tsx - Gantt-diagram (redan finns som GanttChart.jsx, döp om)
│   │
│   ├── modals/
│   │   ├── TaskModal.tsx - Redigera/skapa uppgift (redan finns, flytta hit)
│   │   ├── ArchiveModal.tsx - Arkiv (redan finns, flytta hit)
│   │   ├── TrashModal.tsx - Papperskorg (redan finns, flytta hit)
│   │   ├── SettingsModal.tsx - Inställningar (redan finns, flytta hit)
│   │   └── WorkloadTasksModal.tsx - Belastning per roll (redan finns, flytta hit)
│   │
│   ├── dashboard/
│   │   └── Dashboard.tsx - Översikt/Dashboard (redan finns, förbättra)
│   │
│   └── common/
│       ├── RoleBadge.tsx - Roll-badge (redan finns, flytta hit)
│       ├── TaskItem.tsx - Uppgiftsrad i sidebar (redan finns, flytta hit)
│       └── ChecklistItem.tsx - Checklist-item (redan finns, flytta hit)
│
├── hooks/
│   ├── useAuth.ts - Auth-hook (redan finns som .js, konvertera)
│   ├── useTasks.ts - Tasks-hook med all Firebase-logik (redan finns som .js, konvertera)
│   └── useDragAndDrop.ts - Drag & drop (redan finns som .js, konvertera)
│
├── constants/
│   ├── index.ts - Zoom levels, breakpoints, defaults (redan finns, behåll)
│   └── translations.ts - TRANSLATIONS (flytta från translations/index.js)
│
├── utils/
│   ├── date.ts - Alla datum-relaterade funktioner (från helpers.js)
│   ├── task.ts - Task-relaterade helpers (från helpers.js)
│   └── toast.ts - Toast-notifikationer (redan finns, behåll)
│
└── config/
    └── firebase.js - Firebase-konfiguration (oförändrad)
```

## Refaktoreringssteg

1. ✅ Flytta translations till constants/translations.ts
2. ✅ Dela upp helpers.js i date.ts och task.ts
3. ✅ Organisera komponenter i layout/, modals/, gantt/, dashboard/, common/
4. ✅ Förbättra Dashboard med översikt
5. ✅ Refaktorera GanttApp till App.tsx med tydlig struktur

## Viktiga principer

- Behåll ALL funktionalitet
- Behåll samma Firebase-struktur och fältnamn
- Behåll samma JSON-format för backup/import
- Kommentera var koden kom ifrån i ursprungliga filen
- Använd TypeScript där möjligt (eller .jsx/.js om användaren föredrar)

