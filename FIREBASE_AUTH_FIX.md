# 🔧 Fixa Firebase Anonymous Authentication

## Problem

Du ser detta fel i Console:
```
Anonymous auth failed: auth/configuration-not-found
```

Detta betyder att **Anonymous Authentication inte är aktiverad** i ditt Firebase-projekt.

## ✅ Lösning: Aktivera Anonymous Authentication

### Steg 1: Öppna Firebase Console

1. Gå till [Firebase Console](https://console.firebase.google.com/)
2. Välj ditt projekt: **project-management-dcd11**

### Steg 2: Aktivera Anonymous Authentication

1. I vänstermenyn, klicka på **Authentication**
2. Klicka på fliken **Sign-in method** (eller **Sign-in providers**)
3. I listan över providers, hitta **Anonymous**
4. Klicka på **Anonymous** för att öppna inställningar
5. **Aktivera** toggle-switchen (sätt den på **Enabled**)
6. Klicka på **Save**

### Steg 3: Verifiera

1. Efter att ha aktiverat, ladda om din app
2. Öppna Console (F12)
3. Du ska nu se:
   ```
   Signing in anonymously...
   Auth state changed: User logged in (xxxxxxxxxxxxx)
   ```
   **ISTÄLLET FÖR:**
   ```
   Anonymous auth failed: auth/configuration-not-found
   Creating mock user for demo mode
   ```

## 📸 Visuell guide

```
Firebase Console
├── Authentication
    ├── Sign-in method  ← Klicka här
    │   ├── Email/Password
    │   ├── Anonymous  ← Klicka här och aktivera
    │   ├── Google
    │   └── ...
    └── Users
```

## ⚠️ Viktigt

- **Anonymous Authentication är GRATIS** och ingår i Firebase's gratis tier
- Det skapar temporära användare som inte kräver e-post eller lösenord
- Perfekt för demo-appar och utveckling
- Användare kan senare "uppgraderas" till permanenta konton om du vill

## 🔍 Ytterligare felsökning

Om du fortfarande får fel efter att ha aktiverat:

1. **Vänta 1-2 minuter** - Ändringar kan ta lite tid att spridas
2. **Rensa cache** - Tryck Ctrl+Shift+R (eller Cmd+Shift+R på Mac) för att hårdladda sidan
3. **Kontrollera projekt-ID** - Se till att `projectId: "project-management-dcd11"` stämmer i din config
4. **Kontrollera API-nyckel** - Se till att API-nyckeln i din `.env` eller Vercel matchar projektet

## ✅ Efter fix

När Anonymous Authentication är aktiverad ska du se:

✅ I Console:
```
[Firebase] Firebase app initialized successfully
Signing in anonymously...
Auth state changed: User logged in (xxxxxxxxxxxxx)
Setting up Firestore listener for collection: artifacts/...
```

✅ I Firebase Console → Authentication → Users:
- En ny anonym användare skapas automatiskt
- Provider: **anonymous**

✅ I appen:
- Uppgifter sparas i Firestore (inte localStorage)
- Data finns kvar efter siduppladdning
- Inga "demo-user-" meddelanden i Console

