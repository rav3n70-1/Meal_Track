# New Features Quick Guide

## 🎯 Quick Overview

Three major features have been added to enhance your Meal Tracker experience:

1. **Enhanced Balance Display with Debt Information**
2. **Detailed Balance View Modal**
3. **Member Management (Manager Only)**

---

## 1️⃣ Enhanced Balance Display

### What's New:
The "My Balance" card on the Dashboard now shows a clear breakdown of your financial status.

### Features:
- **Total Paid**: Shows how much you've paid for expenses
- **Your Share**: Shows what you owe based on shared expenses
- **Debt Details** (when applicable):
  - 🟢 **Owed to you**: Money others owe you (green)
  - 🔴 **You owe**: Money you owe to others (red)
- **Net Balance**: Large, color-coded total balance
- **View Details** button for comprehensive breakdown

### Color Coding:
- 🟢 Green: Positive balance (others owe you)
- 🔴 Red: Negative balance (you owe others)

### Location:
Dashboard → "My Balance" card (below stats cards)

---

## 2️⃣ Detailed Balance View

### How to Access:
1. Go to Dashboard
2. Find "My Balance" card
3. Click "View Details" button

### What You'll See:

#### Net Balance Summary (Top)
- Large, prominent display of your total balance
- Color-coded: green if positive, red if negative
- Status message explaining what it means

#### Breakdown Section
Four detailed cards showing:

1. **Total Paid** 💰
   - Amount you've paid for expenses
   - Blue color theme
   - Description: "Total amount you have paid for expenses"

2. **Your Share** 📉
   - Your portion of all shared expenses
   - Orange color theme
   - Description: "Your share of all household expenses"

3. **Debts You Owe** 💳
   - Money you owe to other members
   - Red color theme
   - Description: "Money you owe to other members"

4. **Money Owed to You** 📈
   - Money other members owe you
   - Green color theme
   - Description: "Money other members owe to you"

#### Calculation Explanation
Step-by-step formula showing:
```
Total Paid          +৳XXX.XX
Your Share          -৳XXX.XX
Money Owed to You   +৳XXX.XX
Debts You Owe       -৳XXX.XX
─────────────────────────────
Net Balance         ±৳XXX.XX
```

#### Statistics
- Number of expenses you've paid
- Number of active debts you're involved in

---

## 3️⃣ Member Management (Manager Only)

### Who Can Access:
✅ Managers only
❌ Regular members cannot see management controls

### Location:
Navigate to **Members** page (sidebar menu)

### Available Actions:

#### A. Edit Member Information

**How to Edit:**
1. Go to Members page
2. Find the member you want to edit
3. Click "Edit" button
4. Update information:
   - Full Name
   - Nickname (optional)
   - Role (Member or Manager)
   - Email (view only, cannot change)
5. Click "Save Changes"

**What Can Be Changed:**
- ✅ Full Name
- ✅ Nickname
- ✅ Role (Member ↔ Manager)
- ❌ Email (locked to Google account)

**Use Cases:**
- Fix typos in names
- Add/update nicknames
- Promote member to manager
- Demote manager to member

#### B. Remove Member

**How to Remove:**
1. Go to Members page
2. Find the member you want to remove
3. Click "Remove" button (red)
4. Confirm removal in dialog
5. Member is removed immediately

**Safety Features:**
- ❌ Cannot remove yourself
- ❌ Cannot remove the last manager
- ⚠️ Confirmation required before removal
- ℹ️ Action cannot be undone

**What Happens When Removed:**
- Member is removed from household
- Member loses access to household data
- Member's household ID is cleared
- Member can join another household

#### C. Visual Indicators

**Member Cards Show:**
- Member photo/avatar
- Display name (nickname or full name)
- Full name (if nickname is set)
- Email address
- Join date
- Role badge (Manager = green, Member = default)
- Crown icon for managers 👑
- "You" badge on your own profile

**Manager Controls:**
- Edit button (all members)
- Remove button (all except yourself)

---

## 🎨 UI/UX Details

### Animations:
- ✨ Smooth fade-in for modals
- 🔄 Scale animation on balance numbers
- 📊 Staggered list animations
- 🎯 Hover effects on buttons

### Responsive Design:
- 📱 Mobile-optimized layouts
- 💻 Desktop-friendly spacing
- 🖥️ Tablet support
- ↔️ Adaptive button sizing

### Color Themes:
Works with both light and dark modes:
- 🌞 Light mode: Clean, bright interface
- 🌙 Dark mode: Easy on the eyes

---

## 📝 Testing Checklist

### Balance Features:
- [ ] View balance card on Dashboard
- [ ] Check if debt info appears (if you have debts)
- [ ] Click "View Details" button
- [ ] Review all four breakdown sections
- [ ] Check calculation formula
- [ ] View statistics

### Member Management (Manager):
- [ ] Navigate to Members page
- [ ] See Edit/Remove buttons on members
- [ ] Edit a member's name
- [ ] Edit a member's nickname
- [ ] Change a member's role
- [ ] Try to remove a member
- [ ] Confirm removal works
- [ ] Verify cannot remove yourself

### Safety Checks:
- [ ] Try to remove the last manager (should fail)
- [ ] Verify email cannot be changed
- [ ] Check confirmation dialog appears

---

## 🚀 Tips & Tricks

### For All Users:
1. **Check Balance Regularly**: Use the detailed view to understand where you stand
2. **Debt Tracking**: Pay attention to the debt indicators
3. **Color Codes**: Green = good, Red = owe money

### For Managers:
1. **Member Nicknames**: Set nicknames for easier identification
2. **Role Management**: Promote trusted members to co-managers
3. **Regular Reviews**: Periodically review member list
4. **Backup Managers**: Always have at least 2 managers

### Best Practices:
- ✅ Update member info when needed
- ✅ Remove inactive members
- ✅ Set clear nicknames
- ✅ Communicate before removing members
- ✅ Check balance details regularly

---

## 🆘 Troubleshooting

### "Cannot remove member" error:
- You're trying to remove yourself → Not allowed
- They're the last manager → Assign another manager first

### Edit button not visible:
- You're not a manager → Only managers can edit members
- Solution: Ask a manager to promote you

### Balance seems wrong:
- Check "View Details" for breakdown
- Verify all expenses are approved
- Check active debts
- Formula: Paid - Share + Credit - Owed = Balance

### Changes not saving:
- Check internet connection
- Verify you're still logged in
- Try refreshing the page
- Check browser console for errors

---

## 📞 Support

If you encounter any issues:
1. Check this guide first
2. Review the implementation summary
3. Check browser console for errors
4. Ensure you're using a modern browser
5. Clear cache and try again

---

## 🎓 Understanding Balance Calculation

### Simple Example:

**Scenario:**
- You paid ৳500 for groceries
- Shared with 5 people
- You borrowed ৳100 from someone
- Someone owes you ৳50

**Calculation:**
```
Total Paid:         +৳500
Your Share:         -৳100 (৳500 ÷ 5)
Money Owed to You:  +৳50
Debts You Owe:      -৳100
──────────────────────────
Net Balance:        +৳350
```

**Interpretation:**
You're +৳350 in the green! Others owe you money overall.

---

## ✅ Success!

You now have:
- ✅ Clear visibility into your balance
- ✅ Detailed breakdown of all financial components
- ✅ Full control over household members (if manager)
- ✅ Better financial tracking
- ✅ Improved household management

Enjoy your enhanced Meal Tracker experience! 🎉

