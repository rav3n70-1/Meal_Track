# Meal Expense Tracker - Complete Setup Guide

This guide will walk you through setting up and deploying your Meal Expense Tracker application.

## Prerequisites

- Node.js 18+ and npm installed
- A Google account
- A Firebase account (free tier works great)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Firebase Setup

### 2.1 Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name (e.g., "meal-expense-tracker")
4. Disable Google Analytics (optional)
5. Click "Create project"

### 2.2 Enable Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Click on **Google**
3. Toggle **Enable**
4. Add your support email
5. Click **Save**

### 2.3 Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Select **Start in production mode** (we'll set up rules next)
4. Choose a location close to your users
5. Click **Enable**

### 2.4 Set Up Firestore Security Rules

Go to **Firestore Database** > **Rules** and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User documents
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Household documents
    match /households/{householdId} {
      allow read: if request.auth != null && 
                    exists(/databases/$(database)/documents/households/$(householdId)/members/$(request.auth.uid));
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
                      exists(/databases/$(database)/documents/households/$(householdId)/members/$(request.auth.uid));
      
      // Members subcollection
      match /members/{memberId} {
        allow read: if request.auth != null && 
                      exists(/databases/$(database)/documents/households/$(householdId)/members/$(request.auth.uid));
        allow write: if request.auth != null && 
                       (request.auth.uid == memberId || 
                        get(/databases/$(database)/documents/households/$(householdId)/members/$(request.auth.uid)).data.role == 'manager');
      }
      
      // Expenses subcollection
      match /expenses/{expenseId} {
        allow read: if request.auth != null && 
                      exists(/databases/$(database)/documents/households/$(householdId)/members/$(request.auth.uid));
        allow create: if request.auth != null && 
                        exists(/databases/$(database)/documents/households/$(householdId)/members/$(request.auth.uid));
        allow update: if request.auth != null && 
                        (get(/databases/$(database)/documents/households/$(householdId)/members/$(request.auth.uid)).data.role == 'manager' ||
                         request.auth.uid == resource.data.createdBy);
        allow delete: if request.auth != null && 
                        get(/databases/$(database)/documents/households/$(householdId)/members/$(request.auth.uid)).data.role == 'manager';
      }
    }
  }
}
```

Click **Publish** to save the rules.

### 2.5 Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **Your apps**
3. Click the **Web** icon (`</>`)
4. Register your app with a nickname (e.g., "Meal Tracker Web")
5. **Don't** check "Also set up Firebase Hosting"
6. Click **Register app**
7. Copy the configuration object

## Step 3: Environment Configuration

1. Create a `.env` file in the project root:

```bash
cp .env.example .env
```

2. Edit `.env` and add your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
```

## Step 4: PWA Icons (Optional but Recommended)

You'll need PWA icons for the best mobile experience. You can:

1. Create icons manually (192x192 and 512x512 PNG files)
2. Use a tool like [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)
3. Use online tools like [RealFaviconGenerator](https://realfavicongenerator.net/)

Place the icons in the `public/` folder:
- `public/pwa-192x192.png`
- `public/pwa-512x512.png`
- `public/apple-touch-icon.png` (180x180)
- `public/favicon.ico`

Quick icon creation command:
```bash
# If you have a logo.png file
npx pwa-asset-generator logo.png public --icon-only
```

## Step 5: Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

## Step 6: Test the Application

1. Click "Sign in with Google"
2. Create a new household
3. Note the invite code
4. Open an incognito window and join with the invite code
5. Test adding expenses, approving them, and viewing reports

## Step 7: Build for Production

```bash
npm run build
```

This creates optimized files in the `dist/` folder.

## Step 8: Deploy

### Option A: Firebase Hosting (Recommended)

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase Hosting:
```bash
firebase init hosting
```

Select:
- Use existing project: Choose your project
- Public directory: `dist`
- Configure as single-page app: `Yes`
- Set up automatic builds with GitHub: `No` (or `Yes` if you want)

4. Deploy:
```bash
npm run build
firebase deploy
```

### Option B: Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
npm run build
vercel --prod
```

3. Add environment variables in Vercel dashboard

### Option C: Netlify

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Deploy:
```bash
npm run build
netlify deploy --prod
```

3. Add environment variables in Netlify dashboard

## Step 9: Set Up PWA on Mobile

### iOS (iPhone/iPad)
1. Open the app in Safari
2. Tap the Share button
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"

### Android
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Tap "Add to Home Screen" or "Install app"
4. Tap "Install"

## Troubleshooting

### Firebase Authentication Issues

If Google Sign-In doesn't work:
1. Check that you've enabled Google authentication in Firebase Console
2. Add your domain to authorized domains in Authentication > Settings > Authorized domains
3. For localhost, make sure `localhost` is in the authorized domains

### PWA Not Installing

1. Ensure you're using HTTPS (required for PWA)
2. Check that manifest.json is accessible
3. Verify icons exist in public folder
4. Check browser console for errors

### Firestore Permission Denied

1. Verify security rules are published
2. Check that user is authenticated
3. Ensure user is a member of the household they're trying to access

## Production Checklist

Before going live:

- [ ] Firebase security rules are properly configured
- [ ] Environment variables are set in production
- [ ] PWA icons are created and in place
- [ ] App is tested on both mobile and desktop
- [ ] HTTPS is enabled
- [ ] Domain is added to Firebase authorized domains
- [ ] Test with multiple users
- [ ] Test all features (create, approve, reject expenses)
- [ ] Test PWA installation on mobile devices

## Support

For issues or questions:
- Check the README.md for feature documentation
- Review Firebase Console for errors
- Check browser console for client-side errors
- Review Firestore security rules

## Next Steps

Once deployed, you can:
- Customize colors in `tailwind.config.js`
- Add more features based on your needs
- Set up analytics to track usage
- Configure Firebase Cloud Functions for automated tasks (e.g., weekly summaries)

