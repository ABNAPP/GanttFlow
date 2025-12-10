# Projektplanering - Gantt App

En modern React-applikation för projektplanering med Gantt-diagram, byggd med Firebase och optimerad för prestanda.

## 🚀 Deployment

För att deploya appen till Vercel, se [DEPLOYMENT.md](./DEPLOYMENT.md) för detaljerade instruktioner.

## 🚀 Förbättringar

### Struktur & Organisation
- ✅ **Modulär arkitektur**: Koden är uppdelad i logiska komponenter och hooks
- ✅ **Separerade concerns**: Konfiguration, utils, hooks och komponenter är separerade
- ✅ **Återanvändbara komponenter**: Komponenter kan enkelt återanvändas

### Performance
- ✅ **React.memo**: Komponenter är memoized för att undvika onödiga re-renders
- ✅ **useCallback**: Event handlers är memoized
- ✅ **useMemo**: Beräkningar är memoized där det behövs

### Error Handling
- ✅ **Toast notifications**: Användaren får feedback vid alla operationer
- ✅ **Try-catch blocks**: Alla async operationer har felhantering
- ✅ **Validering**: Formulär har validering innan submission

### Bugfixes
- ✅ **generateId**: Förbättrad för att garantera unika ID:n
- ✅ **dragMovedRef**: Korrekt reset vid drag completion
- ✅ **Memory leaks**: Event listeners cleanup i useEffect

### Accessibility
- ✅ **ARIA labels**: Alla interaktiva element har aria-labels
- ✅ **Keyboard navigation**: Stöd för tangentbordsnavigation
- ✅ **Semantic HTML**: Korrekt användning av semantiska HTML-element

## 📁 Filstruktur

```
src/
├── components/          # React-komponenter
│   ├── TaskModal.jsx
│   ├── Sidebar.jsx
│   ├── GanttChart.jsx
│   ├── TaskItem.jsx
│   ├── ChecklistItem.jsx
│   ├── RoleBadge.jsx
│   ├── SettingsModal.jsx
│   ├── ArchiveModal.jsx
│   ├── TrashModal.jsx
│   └── StatsModal.jsx
├── hooks/              # Custom React hooks
│   ├── useAuth.js
│   ├── useTasks.js
│   └── useDragAndDrop.js
├── utils/              # Hjälpfunktioner
│   ├── helpers.js
│   └── toast.js
├── config/             # Konfiguration
│   └── firebase.js
├── constants/          # Konstanter
│   └── index.js
├── translations/       # Översättningar
│   └── index.js
└── GanttApp.jsx        # Huvudkomponent
```

## 🔧 Användning

### Importera huvudkomponenten:

```jsx
import GanttApp from './src/GanttApp';

// Använd i din app
<GanttApp />
```

### Använda hooks separat:

```jsx
import { useAuth } from './src/hooks/useAuth';
import { useTasks } from './src/hooks/useTasks';

function MyComponent() {
  const { user } = useAuth();
  const { tasks, addTask } = useTasks(user);
  // ...
}
```

## 🎯 Funktioner

- ✅ Projektplanering med Gantt-diagram
- ✅ Drag & drop för att flytta uppgifter
- ✅ Checklistor med datum
- ✅ Flera roller (UA, HL, CAD, etc.)
- ✅ Status-hantering (Planerad, Pågående, Klar, Försenad)
- ✅ Varningar för närmande deadlines
- ✅ Arkiv och papperskorg
- ✅ Backup/restore (lokal och moln)
- ✅ Dark mode
- ✅ Tvåspråkig (Svenska/Engelska)
- ✅ Responsiv design
- ✅ Statistik per roll

## 📝 Noteringar

- Firebase-konfigurationen förväntas finnas i globala variabler (`__firebase_config`, `__app_id`, `__initial_auth_token`)
- Toast-notifikationer initieras automatiskt vid laddning
- Alla komponenter är optimerade med React.memo där det är lämpligt

## 🔄 Migration från gammal kod

Den nya strukturen är bakåtkompatibel. Alla funktioner fungerar som tidigare, men koden är nu:
- Mer underhållbar
- Lättare att testa
- Bättre prestanda
- Mer tillgänglig
- Bättre felhantering


