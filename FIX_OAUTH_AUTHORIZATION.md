# Fix OAuth Authorization Error

## ❌ Current Error

```
403 Forbidden - Unable to verify that the app domain is authorized
GET https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=...
```

## 🔍 Root Cause

Your Firebase project doesn't have `localhost` authorized for OAuth redirects.

## ✅ Solution - Add Authorized Domain

### Step 1: Go to Firebase Console
1. Open: https://console.firebase.google.com/
2. Select your project: **meal-tracker-11262**

### Step 2: Navigate to Authentication Settings
1. Click **"Authentication"** in the left sidebar
2. Click the **"Settings"** tab at the top
3. Scroll down to **"Authorized domains"** section

### Step 3: Add Localhost
1. Click **"Add domain"** button
2. Type: `localhost`
3. Click **"Add"**

### Step 4: Verify Other Domains
Make sure these domains are also in the list:
- ✅ `localhost` (just added)
- ✅ `meal-tracker-11262.firebaseapp.com` (should be there by default)
- ✅ `meal-tracker-11262.web.app` (should be there by default)

If you're deploying to a custom domain later, add it here too.

---

## 🔐 Additional Check - API Key Restrictions

Your API key might also have restrictions. Let's verify:

### Step 1: Go to Google Cloud Console
1. Open: https://console.cloud.google.com/
2. Make sure **meal-tracker-11262** project is selected (top left)

### Step 2: Navigate to API Credentials
1. Click the **≡ Menu** (hamburger icon)
2. Go to **"APIs & Services"** → **"Credentials"**

### Step 3: Find Your API Key
1. Look for API key starting with: `AIzaSyDVgLLM19SnoBY50ZMDQC5Kan5p0Sr2aec`
2. Click on it to edit

### Step 4: Check Restrictions

#### Option A: No Restrictions (Easiest for Development)
- Select **"None"** under "Application restrictions"
- Click **"Save"**

#### Option B: HTTP Referrers (More Secure)
If you want to keep restrictions:
1. Select **"HTTP referrers (web sites)"**
2. Add these referrers:
   - `http://localhost:*/*`
   - `https://localhost:*/*`
   - `http://localhost:5173/*`
   - `https://localhost:5173/*`
   - `https://meal-tracker-11262.firebaseapp.com/*`
   - `https://meal-tracker-11262.web.app/*`
3. Click **"Save"**

### Step 5: Check API Restrictions
Scroll down to **"API restrictions"**:
1. Select **"Don't restrict key"** (easiest)
   
   OR
   
2. Select **"Restrict key"** and enable:
   - ✅ Identity Toolkit API
   - ✅ Token Service API
   - ✅ Cloud Firestore API

---

## 🚀 Quick Test After Fix

1. **Wait 5 minutes** for changes to propagate
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. **Close all browser tabs**
4. **Restart your dev server**:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```
5. Open fresh: `http://localhost:5173`
6. Try login again

---

## 🎯 Expected Result

After the fix:
- ✅ Popup opens
- ✅ Google login page loads
- ✅ User can select account
- ✅ Popup closes
- ✅ User is logged in
- ✅ Redirected to dashboard/setup

---

## 🐛 Still Having Issues?

### Issue: Blank popup window
**Solution**: Clear browser cache and cookies

### Issue: "Action is invalid" message
**Solution**: Don't hard reload the popup window - let it load naturally

### Issue: Still 403 error
**Solution**: 
1. Double-check authorized domains in Firebase
2. Wait 10 minutes for DNS propagation
3. Try in incognito/private window

### Issue: Popup blocked
**Solution**: Allow popups for localhost in browser settings

---

## 📱 Test on Mobile (Alternative)

If popup continues to fail, test the redirect flow:
1. Open on mobile device or use browser DevTools mobile mode
2. The system will use redirect instead of popup
3. Should work even if popup is blocked

---

## ✅ Checklist

- [ ] Added `localhost` to Firebase Authorized domains
- [ ] Removed API key restrictions (or added localhost referrers)
- [ ] Waited 5 minutes
- [ ] Cleared browser cache
- [ ] Restarted dev server
- [ ] Tested login
- [ ] ✅ **Success!**

---

## 📞 Firebase Console Links

- **Authentication Settings**: 
  https://console.firebase.google.com/project/meal-tracker-11262/authentication/settings

- **Authorized Domains**:
  https://console.firebase.google.com/project/meal-tracker-11262/authentication/settings

- **Google Cloud Credentials**:
  https://console.cloud.google.com/apis/credentials?project=meal-tracker-11262

---

## 🎓 Why This Happens

Firebase security prevents OAuth flows from unauthorized domains to protect against:
- Phishing attacks
- Unauthorized app access
- Domain spoofing

For development, we need to explicitly authorize `localhost`.

For production, you'll need to authorize your actual domain.

---

**Follow these steps and your login will work! 🚀**

