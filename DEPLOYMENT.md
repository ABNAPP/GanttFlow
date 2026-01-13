# Deployment Guide - Vercel

Denna guide visar hur du deployar Gantt-appen till Vercel.

## 📋 Förutsättningar

1. Ett Vercel-konto (gratis på [vercel.com](https://vercel.com))
2. Ett Firebase-projekt konfigurerat
3. Git repository (GitHub, GitLab eller Bitbucket)

## 🔧 Steg 1: Förbered Firebase-konfiguration

### Hämta Firebase-konfiguration

1. Gå till [Firebase Console](https://console.firebase.google.com)
2. Välj ditt projekt
3. Gå till Project Settings → General
4. Scrolla ner till "Your apps" och välj din web-app
5. Kopiera konfigurationsvärdena

### Skapa .env fil (för lokal utveckling)

Skapa en `.env` fil i projektets rotmapp (se `.env.example` för mall):

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
VITE_APP_ID=default-app-id
```

**OBS:** `.env` filen är redan i `.gitignore` och kommer inte committas till Git.

## 🚀 Steg 2: Testa build lokalt

Innan du deployar, testa att bygga projektet:

```bash
npm run build
```

Kontrollera att `dist/` mappen skapas utan fel.

## 📦 Steg 3: Deploya till Vercel

### Alternativ A: Via Vercel Dashboard (Rekommenderat)

1. **Gå till Vercel Dashboard**
   - Besök [vercel.com](https://vercel.com) och logga in
   - Klicka på "Add New Project"

2. **Importera Git Repository**
   - Välj ditt repository (GitHub/GitLab/Bitbucket)
   - Vercel kommer automatiskt detektera Vite

3. **Konfigurera Build Settings**
   - **Framework Preset:** Vite (auto-detected)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

4. **Lägg till Environment Variables** ⚠️ **VIKTIGT!**
   - Klicka på "Environment Variables"
   - Lägg till följande variabler med dessa EXAKTA värden:
     ```
     VITE_FIREBASE_API_KEY=AIzaSyBge71BrBafsNQM_bCOoANoTmaWgNQMwWQ
     VITE_FIREBASE_AUTH_DOMAIN=project-management-dcd11.firebaseapp.com
     VITE_FIREBASE_PROJECT_ID=project-management-dcd11
     VITE_FIREBASE_STORAGE_BUCKET=project-management-dcd11.firebasestorage.app
     VITE_FIREBASE_MESSAGING_SENDER_ID=421714252326
     VITE_FIREBASE_APP_ID=1:421714252326:web:05c34fb17286f7c8d84ce7
     ```
   - **Välj miljöer:** ✅ Production, ✅ Preview, ✅ Development
   - **OBS:** Utan dessa variabler kommer appen visa felet "Firebase auth is not initialized"
   - Se [VERCEL_SETUP.md](./VERCEL_SETUP.md) för detaljerade instruktioner

5. **Deploya**
   - Klicka på "Deploy"
   - Vänta på att builden slutförs
   - Din app kommer vara live på en Vercel-URL

### Alternativ B: Via Vercel CLI

```bash
# Installera Vercel CLI globalt
npm i -g vercel

# Logga in
vercel login

# Deploya (första gången - interaktiv setup)
vercel

# För production deployment
vercel --prod
```

**OBS:** Med CLI behöver du lägga till environment variables via Vercel Dashboard efter första deployment.

## 🔐 Steg 4: Konfigurera Firebase Security Rules

Efter deployment måste du uppdatera Firebase Security Rules för att tillåta åtkomst från din Vercel-domän:

### Firestore Security Rules

Gå till Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/users/{userId}/tasks/{taskId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /artifacts/{appId}/users/{userId}/backups/{backupId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Firebase Authentication

1. Gå till Firebase Console → Authentication → Settings
2. Lägg till din Vercel-domän i "Authorized domains"
3. Vercel-domänen kommer se ut som: `your-project.vercel.app`

## ✅ Steg 5: Verifiera Deployment

Efter deployment, kontrollera:

1. **Appen laddas korrekt**
   - Öppna din Vercel-URL
   - Kontrollera att appen renderas utan fel

2. **Firebase-konfiguration**
   - Öppna Browser Console (F12)
   - Kontrollera att inga Firebase-fel visas
   - Verifiera att Firebase initialiseras korrekt

3. **Autentisering fungerar**
   - Testa att logga in
   - Verifiera att användare kan autentiseras

4. **Data sparas/laddas**
   - Skapa en test-uppgift
   - Verifiera att den sparas i Firestore
   - Ladda om sidan och kontrollera att data finns kvar

## 🔄 Kontinuerlig Deployment

Vercel deployar automatiskt när du pushar till Git:

- **Production:** Automatisk deployment vid push till `main` eller `master` branch
- **Preview:** Automatisk deployment för alla andra branches och pull requests

## 🐛 Felsökning

### Build misslyckas

- Kontrollera att alla dependencies är installerade
- Verifiera att `package.json` har korrekt build script
- Kolla build logs i Vercel Dashboard

### Firebase fungerar inte / "Firebase auth is not initialized"

**Detta är det vanligaste problemet!**

1. **Kontrollera Environment Variables i Vercel:**
   - Gå till Settings → Environment Variables
   - Verifiera att ALLA 6 variabler är satta (se ovan)
   - Kontrollera att de är aktiverade för **Production**-miljön
   - Se [VERCEL_SETUP.md](./VERCEL_SETUP.md) för detaljerade instruktioner

2. **Redeploy efter att ha lagt till variabler:**
   - Variabler laddas bara vid ny deployment
   - Gå till Deployments → Klicka på tre punkter → Redeploy

3. **Verifiera att Firebase-projektet tillåter din Vercel-domän**
4. **Verifiera Security Rules i Firebase Console**

### Routing fungerar inte

- Kontrollera att `vercel.json` innehåller rewrite-regler
- Verifiera att SPA routing är korrekt konfigurerad

## 📝 Ytterligare Resurser

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#vercel)
- [Firebase Documentation](https://firebase.google.com/docs)

