# Deploy Updated Firestore Rules

## ⚠️ IMPORTANT: Rules Must Be Deployed to Firebase

The new features (Recurring Expenses, Budgets, Savings, Inventory, etc.) require updated Firestore security rules. Without deploying these rules, you'll get **"Missing or insufficient permissions"** errors.

---

## 🚀 Quick Deploy (Windows)

### Option 1: Using Batch File
```bash
deploy-rules.bat
```

### Option 2: Using Firebase CLI
```bash
firebase deploy --only firestore:rules
```

---

## 📋 Step-by-Step Deployment

### 1. Ensure Firebase CLI is Installed
```bash
firebase --version
```

If not installed:
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase (if needed)
```bash
firebase login
```

### 3. Deploy Rules
```bash
firebase deploy --only firestore:rules
```

You should see:
```
✔ Deploy complete!
```

---

## 🔒 What Was Added to firestore.rules

The following new collections now have security rules:

### 1. **recurringTemplates**
- ✅ All members can read
- ✅ Members can create (own createdBy)
- ✅ Creator/Manager can update
- ✅ Creator/Manager can delete

### 2. **budgets**
- ✅ All members can read
- ✅ Only managers can create
- ✅ Only managers can update
- ✅ Only managers can delete

### 3. **savingsGoals**
- ✅ All members can read
- ✅ Members can create
- ✅ Creator/Manager can update
- ✅ Creator/Manager can delete

### 4. **inventory**
- ✅ All members can read
- ✅ All members can create
- ✅ All members can update
- ✅ All members can delete

### 5. **debtPayments**
- ✅ All members can read
- ✅ Payer can create
- ✅ Only managers can update
- ✅ Only managers can delete

### 6. **comments** (under expenses)
- ✅ All members can read
- ✅ Members can create (own userId)
- ✅ Only creator can delete
- ✅ No one can update (immutable)

---

## ✅ Verify Deployment

After deploying, test each feature:

1. **Recurring Expenses**: Create/edit recurring template
2. **Budgets**: Create budget (manager only)
3. **Savings Goals**: Create savings goal
4. **Inventory**: Add inventory item
5. **Debt Payments**: Record a payment
6. **Comments**: Add comment to expense

If you get "permissions" errors, rules weren't deployed correctly.

---

## 🛠️ Troubleshooting

### Error: "Missing or insufficient permissions"
**Solution**: Deploy the rules using the command above

### Error: "firebase command not found"
**Solution**: Install Firebase CLI:
```bash
npm install -g firebase-tools
```

### Error: "No project active"
**Solution**: Initialize Firebase:
```bash
firebase use --add
```
Then select your project from the list.

### Error: "User does not have permission to access project"
**Solution**: Make sure you're logged in with the correct account:
```bash
firebase logout
firebase login
```

---

## 📝 Firebase Console (Alternative)

If you prefer to deploy manually:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Firestore Database** → **Rules** tab
4. Copy content from `firestore.rules` file
5. Paste into the console
6. Click **Publish**

---

## 🔄 Quick Reference

| Command | Description |
|---------|-------------|
| `firebase deploy --only firestore:rules` | Deploy rules only |
| `firebase deploy` | Deploy everything (rules + hosting + functions) |
| `firebase deploy --only firestore` | Deploy rules + indexes |

---

## ⚡ After Deployment

Your new features will work immediately:
- ✅ Recurring Expenses with custom amounts
- ✅ Budget management
- ✅ Savings goals tracking
- ✅ Inventory management
- ✅ Debt payment tracking
- ✅ Expense comments

---

**Deploy now to start using all the new features!** 🎉

