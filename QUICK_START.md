# Quick Start Guide - Meal Expense Tracker

Get up and running in 5 minutes! 🚀

## Prerequisites

- Node.js 18+ installed
- Google account
- Firebase account (free)

## 1. Install Dependencies (1 minute)

```bash
npm install
```

## 2. Firebase Setup (2 minutes)

### A. Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Name it "meal-tracker" → Click Continue → Create

### B. Enable Google Authentication
1. Click "Authentication" → "Get Started"
2. Click "Google" → Enable → Add support email → Save

### C. Create Firestore Database
1. Click "Firestore Database" → "Create database"
2. Select "Start in production mode" → Next
3. Choose location → Enable

### D. Add Security Rules
1. Go to "Firestore Database" → "Rules" tab
2. Copy the rules from `FIREBASE_RULES.txt`
3. Paste and click "Publish"

### E. Get Configuration
1. Click gear icon (Project Settings)
2. Scroll to "Your apps" → Click Web icon (`</>`)
3. Register app → Copy the config object

## 3. Configure Environment (1 minute)

Create `.env` file in project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 4. Run the App (30 seconds)

```bash
npm run dev
```

Open http://localhost:5173 🎉

## 5. Test It Out (30 seconds)

1. Click "Sign in with Google"
2. Create a household
3. Copy the invite code
4. Open incognito/private window
5. Sign in and join with the code
6. Add an expense as member
7. Approve it as manager

## That's It! 🎊

Your app is now running locally.

## Next Steps

- **Add PWA Icons**: See `public/PWA_ICONS_README.md`
- **Deploy**: See `SETUP_GUIDE.md` for deployment options
- **Customize**: Edit `tailwind.config.js` for colors/themes
- **Learn More**: Check `FEATURES.md` for full feature list

## Common Issues

### "Firebase: Error (auth/unauthorized-domain)"
→ Add your domain to Firebase Console → Authentication → Settings → Authorized domains

### "Missing or insufficient permissions"
→ Double-check Firestore security rules are published

### Icons not showing
→ Add PWA icons to `public/` folder (app still works without them)

## File Structure

```
src/
├── components/       # UI components
│   ├── ui/          # Reusable components
│   ├── Layout/      # Navigation/layout
│   ├── Dashboard/   # Dashboard widgets
│   └── Expenses/    # Expense components
├── pages/           # Page components
├── context/         # React Context (state)
├── firebase/        # Firebase config
├── utils/           # Helper functions
└── styles/          # Global styles
```

## Key Features Working

✅ Google Authentication
✅ Create/Join Household
✅ Add Expenses
✅ Approve/Reject (Manager)
✅ Balance Calculations
✅ Charts & Reports
✅ Dark Mode
✅ PWA Ready
✅ Export to Excel/CSV
✅ Activity Log
✅ Real-time Updates

## Support

Need help? Check:
- `SETUP_GUIDE.md` - Detailed setup
- `FEATURES.md` - Feature documentation
- `README.md` - General overview

Happy tracking! 💰✨

