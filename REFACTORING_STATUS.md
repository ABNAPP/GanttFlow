# Refaktoreringsstatus

## ✅ Genomförda steg

### 1. Filstruktur skapad
- ✅ `src/constants/translations.ts` - Flyttat från `src/translations/index.js`
- ✅ `src/utils/date.ts` - Datum-relaterade funktioner
- ✅ `src/utils/task.ts` - Task-relaterade funktioner
- ✅ `src/utils/helpers.js` - Kompatibilitetsfil (re-exports)
- ✅ Mappar skapade: `layout/`, `modals/`, `gantt/`, `dashboard/`, `common/`

### 2. Funktioner organiserade
**date.ts:**
- `formatDate()` - Formatera datum
- `getDaysArray()` - Hämta dagar mellan två datum
- `getHolidayName()` - Hämta helgdagsnamn
- `isRedDay()` - Kontrollera om röd dag

**task.ts:**
- `checkIsDone()` - Kontrollera om klar
- `getTimeStatus()` - Hämta tidsstatus (försenad/varning)
- `getStatusColor()` - Hämta statusfärg
- `getStatusBorder()` - Hämta statusborder
- `calculateChecklistProgress()` - Beräkna checklist-progress
- `generateId()` - Generera unikt ID
- `validateTaskForm()` - Validera formulär

## 📋 Återstående arbete

### 3. Organisera komponenter
- [ ] Flytta `Sidebar.jsx` → `components/layout/Sidebar.tsx`
- [ ] Skapa `components/layout/Header.tsx` (extrahera från GanttApp.jsx)
- [ ] Flytta `GanttChart.jsx` → `components/gantt/GanttTimeline.tsx`
- [ ] Flytta alla modals till `components/modals/`
- [ ] Flytta common-komponenter till `components/common/`

### 4. Förbättra Dashboard
- [ ] Lägg till översikt med:
  - Antal aktiva uppgifter
  - Antal slutförda (arkiverade)
  - Antal per fas (fördelning)
  - Workload (topp 3 mest belastade roller)

### 5. Refaktorera huvudkomponent
- [ ] Skapa `App.tsx` (eller `App.jsx`)
- [ ] Flytta all state-hantering
- [ ] Organisera handlers
- [ ] Tydlig struktur: Översikt → Lista → Detaljer

## 🔄 Kompatibilitet

Alla befintliga imports fungerar fortfarande tack vare:
- `src/utils/helpers.js` re-exporterar från nya moduler
- `src/translations/index.js` kan behållas eller uppdateras

## 📝 Nästa steg

1. Flytta och organisera komponenter
2. Skapa Header-komponent
3. Förbättra Dashboard
4. Refaktorera GanttApp → App

