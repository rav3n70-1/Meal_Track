# 🔧 Firebase API Key Error Fix

## The Problem

You're getting `auth/invalid-api-key` or `auth/configuration-not-found` errors when running the app locally at `http://localhost:5173`.

**Root Cause:** Your Firebase API key has domain restrictions that only allow requests from:
- `meal-tracker-11262.firebaseapp.com`
- `meal-tracker-11262.web.app`

But NOT from `localhost`, which is needed for local development.

## Solution: Add localhost to Allowed Domains

### Step 1: Go to Google Cloud Console

1. Open this link (opens the API Credentials page for your project):
   **https://console.cloud.google.com/apis/credentials?project=meal-tracker-11262**

2. Sign in with your Google account if prompted

### Step 2: Find and Edit Your API Key

1. Look for the API key: `AIzaSyDVgLLM19SnoBY50ZMDQC5Kan5p0Sr2aec`
2. It should be listed under "API Keys" section
3. Click on the key name to edit it

### Step 3: Add Localhost Referrers

1. Scroll down to **"Application restrictions"** section
2. You should see **"HTTP referrers (websites)"** is selected
3. Click **"ADD AN ITEM"** button
4. Add these referrers one by one:

```
http://localhost:5173/*
http://localhost/*
http://127.0.0.1:5173/*
http://127.0.0.1/*
```

5. Your existing production domains should already be there:
```
https://meal-tracker-11262.firebaseapp.com/*
https://meal-tracker-11262.web.app/*
```

### Step 4: Save Changes

1. Click **"SAVE"** at the bottom
2. Wait 1-2 minutes for changes to propagate

### Step 5: Test Locally

1. Stop your dev server (press `q` in terminal if running)
2. Restart it:
```bash
npm run dev
```

3. Open `http://localhost:5173`
4. Try signing in with Google - it should work now! ✅

## Alternative: No Restrictions (Not Recommended for Production)

If you want to completely remove restrictions (easier but less secure):

1. In Google Cloud Console → API Credentials
2. Edit your API key
3. Under "Application restrictions", select **"None"**
4. Click "SAVE"

**⚠️ Warning:** This allows the key to be used from ANY domain. Fine for development, but not recommended for production keys.

## What We Already Fixed

✅ Updated storage bucket URL in `.env` from `.appspot.com` to `.firebasestorage.app`
✅ Added validation in `firebase/config.js` to catch missing API keys
✅ Restored production `.env` file with correct configuration

## Still Having Issues?

### Error: "API key not valid"
- Make sure you added all localhost variations to the referrers list
- Wait 2-3 minutes after saving for changes to take effect
- Hard refresh your browser (Ctrl + Shift + R)

### Error: "configuration-not-found"
- This means Authentication isn't enabled in Firebase Console
- Go to Firebase Console → Authentication → Get Started
- Enable Google as a sign-in provider

### Clear Browser Cache
Sometimes cached responses cause issues:
```bash
# In browser DevTools Console
localStorage.clear()
sessionStorage.clear()
# Then hard refresh (Ctrl + Shift + R)
```

## Resources

- [Firebase Console](https://console.firebase.google.com/project/meal-tracker-11262/overview)
- [Google Cloud Console](https://console.cloud.google.com/apis/credentials?project=meal-tracker-11262)
- [Firebase API Key Restrictions Docs](https://cloud.google.com/docs/authentication/api-keys#api_key_restrictions)

---

**Quick Summary:**
1. Go to Google Cloud Console → API Credentials
2. Edit your API key
3. Add `http://localhost:5173/*` to HTTP referrers
4. Save and wait 1-2 minutes
5. Restart dev server and test

That's it! 🎉

