# Vercel Deployment Guide - Firebase Environment Variables

## Problem
Om du ser felet "Firebase auth is not initialized" när du kör appen på Vercel, betyder det att Firebase-miljövariablerna saknas.

## Lösning: Sätt upp miljövariabler i Vercel

### Steg 1: Logga in på Vercel
1. Gå till [vercel.com](https://vercel.com)
2. Logga in på ditt konto
3. Välj ditt projekt

### Steg 2: Lägg till miljövariabler
1. Gå till **Settings** → **Environment Variables**
2. Lägg till följande variabler (en i taget):

#### Obligatoriska variabler:
```
VITE_FIREBASE_API_KEY=AIzaSyBge71BrBafsNQM_bCOoANoTmaWgNQMwWQ
VITE_FIREBASE_AUTH_DOMAIN=project-management-dcd11.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=project-management-dcd11
VITE_FIREBASE_STORAGE_BUCKET=project-management-dcd11.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=421714252326
VITE_FIREBASE_APP_ID=1:421714252326:web:05c34fb17286f7c8d84ce7
```

#### Valfri variabel (för Analytics):
```
VITE_FIREBASE_MEASUREMENT_ID=G-LMJV91QG88
```

### Steg 3: Välj miljö
För varje variabel, välj:
- ✅ **Production** (för live-webbplatsen)
- ✅ **Preview** (för preview-deployments)
- ✅ **Development** (om du vill testa lokalt med Vercel CLI)

### Steg 4: Redeploy
Efter att du har lagt till alla variabler:
1. Gå till **Deployments**
2. Klicka på de tre punkterna (...) på senaste deployment
3. Välj **Redeploy**
4. Eller pusha en ny commit till GitHub för att trigga en ny deployment

## Verifiering

Efter redeploy, kontrollera:
1. Gå till din Vercel-webbplats
2. Du bör INTE se felet "Firebase auth is not initialized" längre
3. Login-skärmen bör fungera korrekt

## Alternativ: Använd .env.local (för lokal utveckling)

Om du vill testa lokalt med Vercel CLI, skapa en `.env.local` fil i projektets rot:

```env
VITE_FIREBASE_API_KEY=AIzaSyBge71BrBafsNQM_bCOoANoTmaWgNQMwWQ
VITE_FIREBASE_AUTH_DOMAIN=project-management-dcd11.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=project-management-dcd11
VITE_FIREBASE_STORAGE_BUCKET=project-management-dcd11.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=421714252326
VITE_FIREBASE_APP_ID=1:421714252326:web:05c34fb17286f7c8d84ce7
VITE_FIREBASE_MEASUREMENT_ID=G-LMJV91QG88
```

**Viktigt:** Lägg INTE till `.env.local` i Git! Den finns redan i `.gitignore`.

## Felsökning

### Problem: Variablerna visas inte
- Kontrollera att du har valt rätt miljö (Production/Preview/Development)
- Kontrollera stavningen - de måste vara exakt som ovan
- Redeploy efter att ha lagt till variablerna

### Problem: Fortfarande fel efter redeploy
- Kontrollera Vercel-loggarna för att se om variablerna laddas
- Se till att variablerna är satta för **Production**-miljön
- Kontrollera att inga mellanslag finns i variabelnamnen eller värdena

### Problem: Firebase fungerar lokalt men inte på Vercel
- Lokalt använder appen fallback-värden
- På Vercel (produktion) krävs miljövariabler
- Se till att alla variabler är satta i Vercel

## Säkerhet

⚠️ **Viktigt:** Dessa Firebase-nycklar är publika och säkra att exponera i frontend-koden. De är inte hemliga nycklar. Men om du vill ändra dem:

1. Gå till [Firebase Console](https://console.firebase.google.com)
2. Välj ditt projekt
3. Gå till **Project Settings** → **General**
4. Scrolla ner till **Your apps** och kopiera de nya värdena
5. Uppdatera miljövariablerna i Vercel
