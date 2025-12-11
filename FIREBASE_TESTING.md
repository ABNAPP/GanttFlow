# Firebase-koppling: Testguide och Checklista

## 📋 Checklista för att testa Firebase-kopplingen

### 1. Kontrollera Console i DevTools (F12)

#### Vid app-start ska du se:

✅ **Firebase-initiering:**
```
[Firebase] Using environment variables for config
[Firebase] Initializing Firebase app with projectId: project-management-dcd11
[Firebase] Firebase app initialized successfully
[Firebase] Auth and Firestore initialized
```

✅ **Firebase Health Check:**
```
[Firebase Health Check] Starting diagnostic...
[Firebase Health Check] ✅ App initialized: { name: '[DEFAULT]', options: {...} }
[Firebase Health Check] ✅ Firestore initialized
[Firebase Health Check] ✅ Firestore connection successful!
[App] Firebase health check passed
```

✅ **Auth-initiering:**
```
Signing in anonymously...
Auth state changed: User logged in (xxxxxxxxxxxxx)
```

#### ❌ Om du ser fel:

- `[Firebase] Error initializing Firebase:` → Kontrollera environment variables
- `[Firebase Health Check] ❌` → Se felmeddelandet för mer info
- `Anonymous auth failed:` → Kontrollera att Anonymous Authentication är aktiverad i Firebase Console

---

### 2. Kontrollera Network-fliken i DevTools

#### Sök efter dessa förfrågningar:

✅ **Firestore-anslutningar:**
- `https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen`
- Status: `200 OK` eller `101 Switching Protocols` (för realtime listeners)

✅ **Auth-anslutningar:**
- `https://identitytoolkit.googleapis.com/v1/accounts:signUp`
- Status: `200 OK`

#### ❌ Om du ser fel:

- `403 Forbidden` → Firestore Rules blockerar åtkomst
- `401 Unauthorized` → Auth-problem, kontrollera API-nyckel
- `Network Error` → CORS-problem eller nätverksfel

---

### 3. Kontrollera Firebase Console

#### Firestore Database:

1. Gå till [Firebase Console](https://console.firebase.google.com/)
2. Välj ditt projekt: `project-management-dcd11`
3. Gå till **Firestore Database**

✅ **Vad du ska se:**
- En collection `artifacts` (eller den skapas när första uppgiften sparas)
- Under `artifacts` → `[appId]` → `users` → `[userId]` → `tasks`
- Dina uppgifter ska synas här när du skapar dem i appen

#### Authentication:

1. Gå till **Authentication** → **Sign-in method**

✅ **VIKTIGT - Aktivera Anonymous Authentication:**
- Klicka på **Anonymous** i listan över sign-in providers
- Aktivera **Enable** toggle
- Klicka på **Save**
- ⚠️ **Om detta inte är aktiverat får du felet `auth/configuration-not-found`!**

2. Gå till **Authentication** → **Users**

✅ **Vad du ska se:**
- En eller flera anonyma användare (UID börjar med långa alfanumeriska strängar)
- Varje användare ska ha `Provider: anonymous`

#### Firestore Rules:

1. Gå till **Firestore Database** → **Rules**

✅ **För utveckling (tillfälligt):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

⚠️ **Varning:** Ovanstående regel tillåter alla autentiserade användare att läsa/skriva. För produktion, använd mer restriktiva regler.

---

### 4. Testa funktionalitet i appen

#### Test 1: Skapa en uppgift

1. Klicka på "Ny" för att skapa en uppgift
2. Fyll i formuläret och spara
3. ✅ **Förväntat resultat:**
   - Uppgiften visas i listan
   - I Console: `Task saved successfully`
   - I Firestore Console: Uppgiften syns i `artifacts/[appId]/users/[userId]/tasks`

#### Test 2: Uppdatera en uppgift

1. Klicka på en uppgift för att redigera
2. Ändra något och spara
3. ✅ **Förväntat resultat:**
   - Ändringarna sparas
   - I Firestore Console: Dokumentet uppdateras i realtid

#### Test 3: Ladda om sidan

1. Skapa/uppdatera en uppgift
2. Ladda om sidan (F5)
3. ✅ **Förväntat resultat:**
   - Uppgiften är fortfarande där
   - Data hämtas från Firestore (inte localStorage)

---

### 5. Miljövariabler för Vercel

#### Environment Variables som MÅSTE finnas i Vercel:

1. Gå till ditt Vercel-projekt → **Settings** → **Environment Variables**

2. Lägg till dessa variabler (alla med prefix `VITE_`):

```
VITE_FIREBASE_API_KEY=AIzaSyBge71BrBafsNQM_bCOoANoTmaWgNQMwWQ
VITE_FIREBASE_AUTH_DOMAIN=project-management-dcd11.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=project-management-dcd11
VITE_FIREBASE_STORAGE_BUCKET=project-management-dcd11.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=421714252326
VITE_FIREBASE_APP_ID=1:421714252326:web:05c34fb17286f7c8d84ce7
VITE_FIREBASE_MEASUREMENT_ID=G-LMJV91QG88
VITE_APP_ID=default-app-id
```

3. ✅ **Viktigt:**
   - Välj miljö: **Production**, **Preview**, och **Development**
   - Efter att ha lagt till variablerna, gör en ny deployment

---

### 6. Lokal utveckling (.env-fil)

#### Skapa en `.env`-fil i projektets rot:

```env
VITE_FIREBASE_API_KEY=AIzaSyBge71BrBafsNQM_bCOoANoTmaWgNQMwWQ
VITE_FIREBASE_AUTH_DOMAIN=project-management-dcd11.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=project-management-dcd11
VITE_FIREBASE_STORAGE_BUCKET=project-management-dcd11.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=421714252326
VITE_FIREBASE_APP_ID=1:421714252326:web:05c34fb17286f7c8d84ce7
VITE_FIREBASE_MEASUREMENT_ID=G-LMJV91QG88
VITE_APP_ID=default-app-id
```

⚠️ **OBS:** Lägg `.env` i `.gitignore` så att den inte committas till Git!

---

## 🔍 Felsökning

### Problem: "Firebase app already initialized"

**Lösning:** Detta är nu hanterat i koden. Om du fortfarande ser detta, kontrollera att du inte importerar Firebase direkt i flera filer.

### Problem: "Missing or insufficient permissions"

**Lösning:** 
1. Kontrollera Firestore Rules i Firebase Console
2. Se till att användaren är autentiserad (kontrollera Console för auth-meddelanden)
3. Testa med temporär regel: `allow read, write: if true;` (endast för test!)

### Problem: "Network request failed"

**Lösning:**
1. Kontrollera internetanslutning
2. Kontrollera att Firebase-projektet är aktivt
3. Kontrollera CORS-inställningar (sällan ett problem med Firebase)

### Problem: Data sparas inte

**Lösning:**
1. Kontrollera Console för felmeddelanden
2. Kontrollera Firestore Rules
3. Kontrollera att användaren är autentiserad (se Console)
4. Kontrollera Network-fliken för misslyckade förfrågningar

---

## ✅ Sammanfattning: Snabbkontroll

- [ ] Console visar `[Firebase] Firebase app initialized successfully`
- [ ] Console visar `[Firebase Health Check] ✅ Firestore connection successful!`
- [ ] Network-fliken visar `200 OK` för Firestore-förfrågningar
- [ ] Firebase Console visar anonyma användare i Authentication
- [ ] Firebase Console visar data i Firestore Database
- [ ] Appen kan skapa/uppdatera/radera uppgifter
- [ ] Data finns kvar efter siduppladdning
- [ ] Environment variables är konfigurerade i Vercel (för production)

---

## 📝 Noteringar

- **Demo-mode:** Om Firebase inte fungerar, faller appen tillbaka till localStorage (demo-mode). Du ser då `demo-user-` i Console.
- **Health Check:** Komponenten `FirebaseHealthCheck` körs automatiskt när appen laddas och loggar resultat till Console.
- **Logging:** Alla Firebase-operationer loggas med prefix `[Firebase]` för enkel felsökning.

