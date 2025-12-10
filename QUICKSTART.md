# Snabbstart - Preview av Appen

## 🚀 Starta Development Server

1. **Installera dependencies** (om inte redan gjort):
   ```bash
   npm install
   ```

2. **Starta development server**:
   ```bash
   npm run dev
   ```

3. **Öppna webbläsaren**:
   - Servern öppnas automatiskt på `http://localhost:3000`
   - Om inte, öppna manuellt i din webbläsare

## 🔧 Firebase Konfiguration

För att använda Firebase (valfritt för demo):

1. Skapa en `.env` fil i root-mappen:
   ```env
   VITE_FIREBASE_CONFIG={"apiKey":"your-key","authDomain":"your-domain","projectId":"your-project","storageBucket":"your-bucket","messagingSenderId":"123","appId":"your-app-id"}
   VITE_APP_ID=your-app-id
   ```

2. Eller använd demo-mode (fungerar utan Firebase för att testa UI)

## 📝 Noteringar

- Appen fungerar i demo-mode utan Firebase-konfiguration
- Alla funktioner är tillgängliga för att testa UI/UX
- För full funktionalitet, konfigurera Firebase enligt ovan

## 🎯 Funktioner att testa

- ✅ Skapa nya uppgifter
- ✅ Drag & drop för att flytta uppgifter
- ✅ Checklistor med datum
- ✅ Dark mode toggle
- ✅ Språkväxling (SV/EN)
- ✅ Zoom-nivåer (Dag/Vecka/Månad)
- ✅ Statistik
- ✅ Arkiv och papperskorg
- ✅ Backup/restore


