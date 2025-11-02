# 🔍 Google Cloud Console Configuration Check

## Is Google Cloud Console Causing the 404?

**Short Answer:** Possibly, but more likely it's a routing issue in your React app. However, **both need to be configured correctly** for OAuth to work.

## ✅ What to Check in Google Cloud Console

### 1. OAuth 2.0 Client ID Configuration

**Location:** [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials?project=meal-tracker-11262)

1. Click on your **OAuth 2.0 Client ID** (should be named something like "Web client (auto created by Google Service)" or similar)
2. Check **"Authorized redirect URIs"** section
3. Make sure these URIs are included:
   ```
   http://localhost:5174/__/auth/handler
   http://localhost:5173/__/auth/handler
   http://localhost/__/auth/handler
   https://meal-tracker-11262.firebaseapp.com/__/auth/handler
   https://meal-tracker-11262.web.app/__/auth/handler
   ```

   **Note:** The port number (`5174`, `5173`) should match your dev server port. Check what port Vite is running on!

4. Click **"SAVE"**

### 2. API Key Restrictions

**Location:** Same page, find API key: `AIzaSyDVgLLM19SnoBY50ZMDQC5Kan5p0Sr2aec`

1. Click on the API key to edit
2. Under **"Application restrictions"**:
   - Either select **"None"** (easiest for development)
   - OR if using "HTTP referrers", add:
     ```
     http://localhost:*/*
     http://localhost:5174/*
     http://localhost:5173/*
     https://meal-tracker-11262.firebaseapp.com/*
     https://meal-tracker-11262.web.app/*
     ```

3. Click **"SAVE"**

### 3. Firebase Console Authorized Domains

**Location:** [Firebase Console → Authentication → Settings](https://console.firebase.google.com/project/meal-tracker-11262/authentication/settings)

1. Scroll to **"Authorized domains"** section
2. Make sure `localhost` is listed
3. If not, click **"Add domain"** and add `localhost`
4. Also verify these are present:
   - ✅ `localhost`
   - ✅ `meal-tracker-11262.firebaseapp.com`
   - ✅ `meal-tracker-11262.web.app`

## 🎯 The Real Issue: Routing

The 404 you're seeing is likely because:

1. **Firebase OAuth popup** redirects to: `handler?state=...` or `/__/auth/handler?state=...`
2. **React Router** isn't matching this URL pattern correctly
3. The **404 route** catches it before the handler route can process it

### What We've Already Fixed:

✅ Added handler routes for `/__/auth/handler`, `/handler`, `/auth/handler`
✅ Added detection in 404 route for OAuth callbacks
✅ Added logging to track what's happening

### What to Check Now:

1. **What port is your dev server running on?**
   ```bash
   # Check your terminal when running `npm run dev`
   # It should show something like: "Local: http://localhost:5174"
   ```

2. **Make sure the redirect URI in Google Cloud Console matches your dev server URL:**
   - If you're on port 5174: `http://localhost:5174/__/auth/handler`
   - If you're on port 5173: `http://localhost:5173/__/auth/handler`

## 🧪 Test After Configuration Changes

1. **Wait 2-3 minutes** after saving changes (Google needs time to propagate)
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. **Check browser console** for the logs we added:
   - `[POPUP HANDLER]` - Shows if handler component loads
   - `[404 DEBUG]` - Shows why 404 is triggered
   - `[ROOT ROUTE]` - Shows if root route with OAuth params is hit

## 🔗 Direct Links

- **Firebase Auth Settings**: https://console.firebase.google.com/project/meal-tracker-11262/authentication/settings
- **Google Cloud Credentials**: https://console.cloud.google.com/apis/credentials?project=meal-tracker-11262
- **Google Cloud APIs Dashboard**: https://console.cloud.google.com/apis/dashboard?project=meal-tracker-11262

## 💡 Key Takeaway

The **Google Cloud Console configuration** is necessary for OAuth to work, but the **404 error** is primarily a **React Router routing issue** that we've addressed with handler routes. Both need to be correct for the full flow to work!

