# Expense Features - User Guide

## 🎯 Quick Start Guide

### For All Users: Adding Expenses with Multiple Items

**Old Way** ❌:
- Add "Rice" → Submit
- Add "Meat" → Submit  
- Add "Vegetables" → Submit
- = 3 separate forms

**New Way** ✅:
- Add all items in one form → Submit once!
- = 1 form, 1 submission

---

## 📝 Step-by-Step: Adding Multiple Items

### 1. Open Expense Form
- Click the **"+"** floating button (bottom right)
- Or navigate to Expenses → "Add Expense"

### 2. Select Purchase Date
```
┌─────────────────────────┐
│ Purchase Date *         │
│ 📅 Nov 1, 2025         │ ← DatePicker with calendar icon
└─────────────────────────┘
```

### 3. Add Items
Default: **1 item** pre-loaded

**To Add More Items:**
- Click **"Add Item"** button (top right)
- Each item gets its own card

```
┌─────────────────────────────────────┐
│ Items (3)          [+ Add Item]     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Item #1          [X Remove]     │ │
│ │ Item Name: Rice                 │ │
│ │ Amount: ৳500    Buyer: Alice    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Item #2          [X Remove]     │ │
│ │ Item Name: Meat                 │ │
│ │ Amount: ৳800    Buyer: Bob      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Item #3          [X Remove]     │ │
│ │ Item Name: Vegetables           │ │
│ │ Amount: ৳300    Buyer: Charlie  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Total Amount: ৳1,600.00            │
└─────────────────────────────────────┘
```

### 4. Fill Item Details

**For Each Item:**
- **Item Name**: What was purchased
- **Amount**: Cost in Taka (৳)
- **Buyer**: Who paid for THIS item

**Can be different buyers!** ✨
- Item #1 paid by Alice
- Item #2 paid by Bob
- Item #3 paid by Charlie

### 5. Select Shared Among
```
┌─────────────────────────┐
│ Shared Among            │
│ ☑ Alice                 │
│ ☑ Bob                   │
│ ☑ Charlie               │
│                         │
│ Selected: 3 member(s)   │
└─────────────────────────┘
```

### 6. Submit
- Click **"Submit Expense"**
- ✅ One request creates the expense
- ✅ Toast: "Expense with 3 items submitted for approval!"

---

## 📅 Viewing Expenses: Grouped by Date

### Expense List View
```
┌─────────────────────────────────────────┐
│ [Status Filter ▼]                       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 📅 Friday, November 1, 2025      [▼]    │
│    3 expenses              ৳5,200.00    │
└─────────────────────────────────────────┘
  ↓ (Click to expand)

┌─────────────────────────────────────────┐
│ 📅 Friday, November 1, 2025      [▲]    │
│    3 expenses              ৳5,200.00    │
│ ─────────────────────────────────────── │
│  ┌───────────────────────────────────┐  │
│  │ • Rice - ৳500 (Alice)             │  │
│  │ • Meat - ৳800 (Bob)               │  │
│  │ • Vegetables - ৳300 (Charlie)     │  │
│  │ Total: ৳1,600                     │  │
│  │ Shared by: Alice, Bob, Charlie    │  │
│  │ Status: [Pending]                 │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ • Electricity Bill - ৳2000 (Alice)│  │
│  │ Status: [Approved]                │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Features:
- ✅ **Click Date** to expand/collapse
- ✅ **See Total** for that date
- ✅ **Expense Count** visible
- ✅ **All Items** listed with buyers

---

## 👑 Manager: Bulk Actions

### Select Multiple Expenses

**1. Selection Bar Appears:**
```
┌─────────────────────────────────────────────┐
│ ☐ Select All (0 selected)                  │
└─────────────────────────────────────────────┘
```

**2. Check Boxes Appear on Pending Expenses:**
```
┌─────────────────────────────────────────┐
│ 📅 November 1, 2025              [▼]    │
└─────────────────────────────────────────┘
  ┌───────────────────────────────────┐
  │ ☐ Rice + 2 items - ৳1,600        │
  │    Status: [Pending]              │
  └───────────────────────────────────┘
  ┌───────────────────────────────────┐
  │ ☐ Pizza + 2 items - ৳1,300       │
  │    Status: [Pending]              │
  └───────────────────────────────────┘
```

**3. Select Expenses:**
- Click checkboxes individually
- Or click "Select All"

**4. Bulk Action Buttons Appear:**
```
┌─────────────────────────────────────────────┐
│ ☑ Select All (2 selected)                  │
│     [Approve Selected] [Reject Selected]   │
└─────────────────────────────────────────────┘
```

**5. Perform Action:**
- Click "Approve Selected" (green)
- Or "Reject Selected" (red)
- ✅ All selected expenses processed!
- ✅ Toast: "2 expenses approved!"

---

## 💡 Use Cases

### Use Case 1: Weekly Grocery Shopping
**Scenario:** Alice, Bob, and Charlie go shopping together

**How to Add:**
1. Open expense form
2. Date: Nov 1, 2025
3. Add items:
   - Rice (৳500) - Buyer: Alice
   - Meat (৳800) - Buyer: Bob
   - Vegetables (৳300) - Buyer: Charlie
   - Oil (৳200) - Buyer: Alice
   - Snacks (৳400) - Buyer: Bob
4. Shared Among: Alice, Bob, Charlie
5. Notes: "Weekly grocery trip to supermarket"
6. Submit

**Result:**
- ✅ 1 expense created
- ✅ 5 items in the expense
- ✅ Total: ৳2,200
- ✅ Each person's share: ৳733.33

### Use Case 2: Restaurant Bill
**Scenario:** Dinner with friends

**How to Add:**
1. Date: Nov 1, 2025
2. Items:
   - Pizza (৳600) - Buyer: Alice
   - Drinks (৳300) - Buyer: Bob
   - Dessert (৳400) - Buyer: Charlie
3. Shared Among: Alice, Bob, Charlie
4. Submit

**Result:**
- Total: ৳1,300
- Each person pays: ৳433.33
- Grouped by date in list

### Use Case 3: Manager Bulk Approval
**Scenario:** Manager has 10 pending expenses to review

**Old Way:**
- Click each → Review → Approve (×10)
- Time: ~2 minutes

**New Way:**
- Select All
- Approve Selected
- Time: ~5 seconds ✨

---

## 🔍 Quick Tips

### Adding Expenses:
💡 **Tip 1**: Add multiple items when shopping together
💡 **Tip 2**: Different buyers? No problem - assign per item
💡 **Tip 3**: Watch the total update as you type
💡 **Tip 4**: Must have at least 1 item (can't remove last)

### Viewing Expenses:
💡 **Tip 1**: Click date headers to expand/collapse
💡 **Tip 2**: See total for each date at a glance
💡 **Tip 3**: Filter by status to focus on pending/approved
💡 **Tip 4**: Click expense for full details

### Bulk Actions (Manager):
💡 **Tip 1**: Use "Select All" for quick approvals
💡 **Tip 2**: Can mix approve/reject in separate batches
💡 **Tip 3**: Selection counter shows how many selected
💡 **Tip 4**: Only pending expenses can be selected

---

## ❓ FAQ

### Q: Can I add different buyers for different items?
**A:** Yes! Each item can have its own buyer.

### Q: What happens when I submit multiple items?
**A:** One expense document is created with all items, making it more organized.

### Q: Will old expenses still work?
**A:** Yes! All components support both old and new formats seamlessly.

### Q: Can members use bulk actions?
**A:** No, bulk actions are manager-only features.

### Q: How do I remove an item while adding?
**A:** Click the "Remove" button on that item's card. You must keep at least 1 item.

### Q: What if items have different buyers?
**A:** Perfect! That's the point - each item tracks its own buyer.

### Q: Can I expand all dates at once?
**A:** Not currently, but you can click each date to expand individually.

---

## 🎉 Benefits Summary

### For Everyone:
✅ Faster expense entry
✅ Better organization
✅ Clearer item tracking
✅ Real-time totals

### For Managers:
✅ Bulk approvals
✅ Time-saving workflows
✅ Better oversight
✅ Grouped view

### Technical:
✅ Fewer database operations
✅ Better performance
✅ More efficient
✅ Scalable design

---

## 🚀 Get Started

1. **Sign in** to your account
2. **Click "+"** to add expense
3. **Try adding multiple items** with different buyers
4. **Submit** and see the magic!
5. **View expenses** grouped by date
6. **Managers**: Try bulk actions!

Enjoy the enhanced expense tracking! 🎊

