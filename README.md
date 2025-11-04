# Meal Expense Tracker

A modern, responsive Progressive Web App (PWA) for managing shared household meal expenses built with React, Vite, Tailwind CSS, Firebase, and Framer Motion.

Version: v1.0.0

## Features

- 🔐 **Google Authentication** - Secure login with Firebase Auth
- 👥 **Role-Based Access** - Manager and Member roles with different permissions
- 💰 **Expense Management** - Add, approve, and track meal expenses
- 📊 **Visual Dashboard** - Interactive charts showing spending and balances
- 💳 **Debt Tracking** - Automatic debt calculation and tracking
- 🔍 **Detailed Balance View** - Comprehensive breakdown of payments, shares, and debts
- 👨‍👩‍👧‍👦 **Member Management** - Managers can add, edit, and remove household members
- 🌓 **Dark Mode** - Toggle between light and dark themes
- 📱 **PWA Support** - Install on mobile devices for native app experience
- 🎨 **Modern UI** - Clean design with Tailwind CSS and Framer Motion animations
- 📈 **Detailed Reports** - See who owes whom with automatic balance calculations
- 🌐 **Multi-language Support** - Bengali and English language options

## About the Developer

**Hey, I'm Mehedi Hasan Rohan**  
I'm a CSE student at Daffodil International University. I built this project out of curiosity and a genuine need—managing a student household is tough! Use this app to make your day-to-day easier. It's currently focused on the essentials, so please don't try to break it. If you run into any issues or have suggestions, feel free to reach out.

- GitHub: `https://github.com/rav3n70-1`
- Portfolio: `https://ravensportfolio.vercel.app/`
- LinkedIn: `https://www.linkedin.com/in/mehedi-hasan-rohan-62b5512aa/`
- Facebook: `https://www.facebook.com/rav3n69`
- Instagram: `https://www.instagram.com/ig_r4v39`

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Backend**: Firebase (Firestore + Authentication)
- **Charts**: Recharts
- **Icons**: Lucide React
- **PWA**: Vite PWA Plugin

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd MealTracker
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Google Sign-In)
   - Create a Firestore database
   - Copy your Firebase configuration

4. Create `.env` file:
```bash
cp env.example .env
```

5. Add your Firebase configuration to `.env`:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

6. Start the development server:
```bash
npm run dev
```

7. Build for production:
```bash
npm run build
```

## Environment Variables

Create a `.env` file in the project root with the following keys (values from your Firebase project):

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (Button, Card, Input, etc.)
│   ├── Dashboard/      # Dashboard-specific components
│   ├── Expenses/       # Expense-related components
│   └── Layout/         # Layout components (Navbar, Sidebar)
├── pages/              # Page components
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── Expenses.jsx
│   ├── Profile.jsx
│   └── Settings.jsx
├── context/            # React Context providers
│   ├── AuthContext.jsx
│   ├── HouseholdContext.jsx
│   └── ThemeContext.jsx
├── hooks/              # Custom React hooks
│   └── useExpenses.js
├── firebase/           # Firebase configuration and utilities
│   └── config.js
├── utils/              # Utility functions
│   ├── calculations.js
│   └── exportData.js
└── styles/             # Global styles
    └── index.css
```

## User Roles

### Manager
- Approve/reject expense submissions
- View and edit any expense
- Access detailed reports and summaries
- Manage household members

### Member
- Add expenses (requires approval)
- View own pending and approved expenses
- See household totals and balances

## Screenshots

You can add screenshots or GIFs of key flows (Dashboard, Add Expense, Balances) here to help users quickly understand the app.

## Database Structure

```
households/
  {householdId}/
    info: { name, createdBy, createdAt, inviteCode }
    members/
      {userId}: { name, email, role, joinedAt }
    expenses/
      {expenseId}: { 
        item, amount, buyer, date, 
        sharedAmong[], status, approvedBy,
        createdAt, notes
      }
```

## PWA Features

- Installable on mobile devices (Add to Home Screen)
- Offline support with service worker
- Cached assets for fast loading
- Native app-like experience

## Acknowledgements

- Icons by Lucide React
- Animations by Framer Motion
- Built with React + Vite and styled with Tailwind CSS

## Contributing

Contributions are welcome! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Use the provided issue and PR templates.

## License

This project is licensed under the [MIT License](LICENSE).

