# Automatic Debt Tracking System - Updated Documentation

## Overview

The debt tracking system now has **TWO types of debts**:

1. **Automatic Debts** - Generated automatically from approved expenses (No approval needed)
2. **Manual Debts** - Personal IOUs/loans recorded by users (Requires manager approval)

## Features

### 1. Automatic Debt Generation from Expenses

#### How It Works:
- When expenses are approved, the system automatically calculates who owes whom
- If Person A paid for a shared expense but Person B consumed part of it, Person B automatically owes Person A
- These debts are consolidated (amounts owed between same people are combined)
- **No manager approval needed** - These are automatically approved

#### Example:
```
Expense 1: Alice paid ৳300 for groceries, shared among Alice, Bob, and Carol
- Bob owes Alice: ৳100
- Carol owes Alice: ৳100

Expense 2: Alice paid ৳600 for dinner, shared among Alice and Bob
- Bob owes Alice: ৳300

Result: Automatic debt created
- Bob owes Alice: ৳400 (combined from both expenses)
- Carol owes Alice: ৳100
```

### 2. Manual Debt Records

#### How It Works:
- Users can manually create debt records for personal loans/IOUs
- These require manager approval before becoming active
- Used for money borrowed outside of shared expenses

#### Example:
```
Bob borrowed ৳500 from Alice for personal use
→ Bob creates manual debt record
→ Manager approves
→ Debt becomes active
```

## Data Structure

### Automatic Debt Document
```javascript
{
  debtor: "user_uid",
  creditor: "user_uid",
  originalAmount: 400.00,
  remainingAmount: 400.00,
  reason: "Shared expenses",
  date: "2024-01-15",
  notes: "Automatically generated from shared expenses",
  status: "approved",           // Always approved
  type: "auto",                  // Automatic debt
  payments: [],
  createdAt: "2024-01-15T08:00:00.000Z",
  createdBy: "system",           // System-generated
  approvedBy: "system",
  approvedAt: "2024-01-15T08:00:00.000Z",
  paidAt: null
}
```

### Manual Debt Document
```javascript
{
  debtor: "user_uid",
  creditor: "user_uid",
  originalAmount: 500.00,
  remainingAmount: 500.00,
  reason: "Personal loan",
  date: "2024-01-15",
  notes: "Borrowed for bike repair",
  status: "pending",             // Needs approval
  type: "manual",                // Manual debt
  payments: [],
  createdAt: "2024-01-15T08:00:00.000Z",
  createdBy: "user_uid",
  approvedBy: null,
  approvedAt: null,
  paidAt: null
}
```

## Automatic Debt Calculation Logic

### Algorithm:

1. **Filter Approved Expenses**
   - Only process expenses with status = 'approved'

2. **Calculate Shares**
   - For each expense:
     - Divide amount by number of people in sharedAmong
     - Each person (except buyer) owes the buyer their share

3. **Consolidate Debts**
   - Group debts by debtor:creditor pair
   - Sum all amounts for each unique pair
   - Only create debts above ৳0.01

4. **Sync with Firestore**
   - Update existing automatic debts if amounts changed
   - Create new automatic debts if they don't exist
   - Delete automatic debts that no longer apply (amount became 0)

### Code Reference:
```javascript
// src/utils/debtGeneration.js
export const calculateAutomaticDebts = (expenses, members) => {
  const approvedExpenses = expenses.filter(exp => exp.status === 'approved');
  const debtMap = {};
  
  approvedExpenses.forEach(expense => {
    const amount = parseFloat(expense.amount) || 0;
    const buyer = expense.buyer;
    const sharedAmong = expense.sharedAmong || [];
    const sharePerPerson = amount / sharedAmong.length;
    
    sharedAmong.forEach(memberId => {
      if (memberId === buyer) return; // Skip if buyer
      
      const debtKey = `${memberId}:${buyer}`;
      if (!debtMap[debtKey]) debtMap[debtKey] = 0;
      debtMap[debtKey] += sharePerPerson;
    });
  });
  
  // Convert to debt objects...
};
```

## UI Components

### 1. DebtList Component

Shows both automatic and manual debts with visual indicators:

- **Auto Badge** - Blue badge with lightning icon (⚡ Auto)
- **Manual Badge** - Outlined badge with user icon (👤 Manual)
- **Info Banner** - Blue info box explaining automatic debt source

### 2. PendingDebtApprovals Component

Only shows **manual debts** that need approval:
- Filters: `debt.status === 'pending' && debt.type === 'manual'`
- Title: "Pending Manual Debt Approvals"
- Note: "(Automatic debts from expenses don't require approval)"

### 3. Debts Page

Updated statistics:
- **Auto Debts** - Count of active automatic debts
- **Manual Debts** - Count of active manual debts
- **Pending Approval** - Manual debts awaiting approval
- **Fully Paid** - All paid debts
- **Total Debt** - Combined amount

## Context Integration

### HouseholdContext

```javascript
// Auto-generate debts whenever expenses or members change
useEffect(() => {
  if (!household || !members.length || !expenses.length) return;

  const generateDebts = async () => {
    try {
      await updateAutomaticDebts(household.id, expenses, members, debts);
    } catch (error) {
      console.error('Error auto-generating debts:', error);
    }
  };

  // Delay to avoid too many writes
  const timeoutId = setTimeout(generateDebts, 1000);
  return () => clearTimeout(timeoutId);
}, [expenses, members, household, debts]);
```

### When Debts Are Generated:
- When new expenses are approved
- When expenses are updated
- When expenses are deleted
- Runs automatically with 1-second debounce

## Firestore Security Rules

```javascript
match /debts/{debtId} {
  allow read: if isMember(householdId);
  
  // Allow system to create auto debts, users to create manual debts
  allow create: if isMember(householdId) && 
                  (request.auth.uid == request.resource.data.createdBy ||
                   request.resource.data.createdBy == 'system');
  
  // Managers can update any debt
  // Debtors can update approved debts (for payments)
  // System/members can update auto debts
  allow update: if isSignedIn() && 
                  (isManager(householdId) || 
                   (request.auth.uid == resource.data.debtor && 
                    resource.data.status == 'approved') ||
                   (request.auth.uid == resource.data.createdBy && 
                    resource.data.status == 'pending') ||
                   (resource.data.type == 'auto' && isMember(householdId)));
  
  // Managers can delete debts, system can delete auto debts
  allow delete: if isManager(householdId) || 
                  (resource.data.type == 'auto' && isMember(householdId));
}
```

## Balance Calculations

Balances now include both types of debts:

```javascript
balance = (money paid - share of expenses) 
        + (money owed to you - money you owe)
```

Both automatic and manual debts contribute to:
- `totalDebtOwed` - Money member owes to others
- `totalDebtCredit` - Money others owe to member

## User Workflows

### Workflow 1: Automatic Debt (From Expenses)

1. Member creates expense (e.g., Alice paid ৳300 for groceries)
2. Expense includes sharedAmong: [Alice, Bob]
3. Manager approves expense
4. **System automatically creates debt:**
   - Bob owes Alice ৳150
   - Type: "auto"
   - Status: "approved" (no approval needed)
5. Debt appears immediately in Debts page
6. Bob's balance decreases by ৳150
7. Alice's balance increases by ৳150

### Workflow 2: Manual Debt (Personal IOU)

1. Bob clicks "+" button on Debts page
2. Fills form:
   - Who owes: Bob
   - Owed to: Alice
   - Amount: ৳500
   - Reason: "Personal loan"
3. Submits (Status: "pending", Type: "manual")
4. Manager sees in "Pending Manual Debt Approvals"
5. Manager approves
6. Debt becomes active (Status: "approved")
7. Bob's balance decreases by ৳500
8. Alice's balance increases by ৳500

### Workflow 3: Making Payments (Any Debt Type)

1. Bob views "I Owe" filter
2. Sees debt to Alice (৳650 total from both types)
3. Clicks "Record Payment"
4. Enters ৳200 payment
5. Remaining amount: ৳450
6. If debt becomes ৳0:
   - **Confetti animation! 🎉**
   - "Congratulations!" message
   - Status changes to "paid"

## Advantages of This System

### Automatic Debts:
✅ **No Manual Entry** - Generated automatically from expenses  
✅ **Always Accurate** - Based on actual consumption  
✅ **No Approval Delay** - Immediately active  
✅ **Auto-Consolidated** - Multiple expenses combined  
✅ **Self-Updating** - Adjusts when expenses change  

### Manual Debts:
✅ **Flexible** - For any type of loan/IOU  
✅ **Accountable** - Requires manager approval  
✅ **Documented** - Custom reason and notes  
✅ **Auditable** - Full approval trail  

## Technical Implementation

### Files Created:
- `src/utils/debtGeneration.js` - Automatic debt calculation and sync

### Files Modified:
- `src/components/Debts/DebtForm.jsx` - Added type: 'manual'
- `src/components/Debts/DebtList.jsx` - Visual indicators for debt types
- `src/components/Debts/PendingDebtApprovals.jsx` - Filter manual debts only
- `src/context/HouseholdContext.jsx` - Auto-generate debts effect
- `src/pages/Debts.jsx` - Updated stats and info
- `firestore.rules` - Allow system debt creation

## Performance Considerations

### Debouncing:
- 1-second delay before generating debts
- Prevents excessive Firestore writes
- Batches multiple expense changes together

### Batch Operations:
- Uses Firestore batch writes
- Single commit for all debt updates
- Efficient for large numbers of debts

### Caching:
- Real-time listeners for instant updates
- No need to manually refresh
- Firestore handles synchronization

## Testing Checklist

**Automatic Debts:**
- [ ] Create expense with 2+ people in sharedAmong
- [ ] Approve expense
- [ ] Verify automatic debt created
- [ ] Check debt has type: 'auto' and status: 'approved'
- [ ] Verify balance updated automatically
- [ ] Approve second expense with same people
- [ ] Verify debts are consolidated
- [ ] Delete expense
- [ ] Verify automatic debt removed/updated

**Manual Debts:**
- [ ] Create manual debt via form
- [ ] Verify appears in pending approvals
- [ ] Approve as manager
- [ ] Verify debt becomes active
- [ ] Record payment
- [ ] Record final payment
- [ ] Verify celebration animation

**UI:**
- [ ] Verify auto debts show "Auto" badge
- [ ] Verify manual debts show "Manual" badge
- [ ] Verify info banner on auto debts
- [ ] Verify stats show separate counts
- [ ] Verify pending only shows manual debts

## Troubleshooting

### Issue: Automatic debts not appearing
**Solution:** Check that expenses are approved and have sharedAmong field

### Issue: Duplicate automatic debts
**Solution:** Check HouseholdContext effect dependencies, may need to add debouncing

### Issue: Permission denied creating automatic debt
**Solution:** Verify Firestore rules allow createdBy: 'system'

### Issue: Balances not updating
**Solution:** Ensure calculations.js receives debts parameter

## Future Enhancements

1. **Smart Consolidation** - Bidirectional debt offsetting
2. **Payment Plans** - Scheduled payment reminders
3. **Debt History** - Track debt changes over time
4. **Export Debts** - Generate debt reports
5. **Debt Disputes** - Dispute resolution system
6. **Multi-Currency** - Support different currencies
7. **Debt Categories** - Categorize manual debts
8. **Recurring Debts** - Set up recurring IOUs

---

## Summary

The enhanced debt tracking system provides:
- ✅ Automatic debt generation from expenses (no approval)
- ✅ Manual debt recording for personal loans (with approval)
- ✅ Clear visual distinction between debt types
- ✅ Automatic balance updates
- ✅ Payment tracking with celebrations
- ✅ Real-time synchronization
- ✅ Secure Firestore rules

Both systems work together seamlessly to provide comprehensive debt tracking for households!

