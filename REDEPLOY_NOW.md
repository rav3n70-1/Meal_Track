# 🚀 Redeploy Your App - Quick Guide

## The Problem
You're seeing Firebase's welcome page instead of your app because the wrong folder was deployed.

## The Fix (3 Easy Steps)

### ✅ Step 1: Build Your App
Open terminal in your project folder and run:

```bash
npm run build
```

**Wait for:** "✓ built in XXXms" message

**Check:** A `dist` folder should appear with your built app

---

### ✅ Step 2: Deploy to Firebase

Run:

```bash
firebase deploy
```

**Or just hosting (faster):**
```bash
firebase deploy --only hosting
```

**Wait for:** 
```
✔ Deploy complete!
Hosting URL: https://meal-tracker-11262.web.app
```

---

### ✅ Step 3: View Your App

Open your browser and go to:
- https://meal-tracker-11262.web.app

**Hard refresh** to clear cache:
- Windows: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

**You should now see your Meal Tracker app!** 🎉

---

## Even Easier: Use the Deploy Script

Just double-click `deploy.bat` or run:

```bash
deploy.bat
```

This automatically:
1. Builds the app
2. Deploys to Firebase
3. Shows you the URL

---

## Quick Troubleshooting

### ❌ "Firebase command not found"
**Solution:**
```bash
npm install -g firebase-tools
firebase login
```

### ❌ Build errors
**Solution:**
```bash
npm install
npm run build
```

### ❌ Still seeing welcome page
**Solution:**
1. Hard refresh (Ctrl + Shift + R)
2. Try incognito window
3. Clear browser cache

### ❌ Permission errors
**Solution:**
```bash
firebase login
firebase use meal-tracker-11262
firebase deploy
```

---

## What Changed?

Fixed `firebase.json`:
- Before: `"public": "public"` ❌
- After: `"public": "dist"` ✅

Now Firebase deploys the correct folder with your built app!

---

## After Deployment

Your app will be live at:
- ✅ https://meal-tracker-11262.web.app
- ✅ https://meal-tracker-11262.firebaseapp.com

Features working:
- ✅ Sign in with Google
- ✅ Create/Join household
- ✅ Add expenses
- ✅ Bangla/English toggle
- ✅ ৳ currency
- ✅ Profile page
- ✅ All features!

---

**Ready?** Run these 2 commands:

```bash
npm run build
firebase deploy
```

**That's it!** 🚀

