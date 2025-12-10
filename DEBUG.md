# Debug Guide - Felsökning av uppgiftsproblem

## Steg för att felsöka

### 1. Öppna Developer Console
- Tryck F12 i webbläsaren
- Gå till fliken "Console"

### 2. Kontrollera Auth Status
Titta efter dessa meddelanden i Console:

**Förväntat flöde:**
```
Signing in anonymously...
Auth state changed: User logged in (demo-user-1234567890)
```

**ELLER om Firebase fungerar:**
```
Signing in anonymously...
Auth state changed: User logged in (firebase-user-id)
```

**Om du ser:**
```
Auth timeout - creating mock user as fallback
```
Det betyder att auth tog för lång tid, men mock user skapas ändå.

### 3. När du skapar en uppgift
Titta efter dessa meddelanden:

**Förväntat:**
```
handleSaveTask called: { authLoading: false, hasUser: true, userId: "demo-user-..." }
addTask called with: { user: "demo-user-...", taskData: {...} }
Adding task to localStorage (demo mode): {...}
Saving to localStorage, total tasks: 1
Task added to localStorage with ID: demo-...
Current tasks after add: [{ id: "...", title: "..." }]
```

### 4. Om du ser fel

**"Cannot add task: No user"**
- Auth har inte skapat en user ännu
- Lösning: Vänta 2 sekunder och försök igen, eller ladda om sidan

**"Error adding task to localStorage"**
- localStorage är kanske blockerad
- Lösning: Kontrollera browser-inställningar för localStorage

**Inga meddelanden alls**
- Funktionen anropas inte
- Lösning: Kontrollera att formuläret har rätt onSubmit handler

### 5. Kontrollera localStorage
I Console, kör:
```javascript
localStorage.getItem('demo-tasks')
```
Detta ska visa dina sparade uppgifter som JSON.

### 6. Manuell test
I Console, kör:
```javascript
// Kontrollera user
console.log('User:', window.__user || 'Not set');

// Kontrollera tasks
const tasks = JSON.parse(localStorage.getItem('demo-tasks') || '[]');
console.log('Tasks in localStorage:', tasks);
```

## Vanliga problem

### Problem: "You must be logged in to save tasks"
**Orsak:** Auth har inte skapat en user ännu

**Lösning:**
1. Vänta 2-3 sekunder efter sidladdning
2. Ladda om sidan (F5)
3. Kontrollera Console för auth-fel

### Problem: Uppgift sparas men visas inte
**Orsak:** State uppdateras inte korrekt

**Lösning:**
1. Kontrollera Console för "Tasks processed and set"
2. Kontrollera att `processedTasks` inte filtrerar bort uppgiften
3. Ladda om sidan för att se om uppgiften finns i localStorage

### Problem: localStorage fungerar inte
**Orsak:** Browser blockerar localStorage

**Lösning:**
1. Kontrollera browser-inställningar
2. Testa i en annan browser
3. Kontrollera om du är i incognito/private mode

