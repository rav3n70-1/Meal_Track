# Debt Tracking Feature Documentation

## Overview

The Debt Tracking feature allows household members to record and manage personal debts/IOUs between members. This feature includes manager approval, payment tracking, automatic balance updates, and celebration when debts are fully paid.

## Features

### 1. **Debt Record Creation**
- Any household member can create a debt record
- Fields include:
  - Debtor (person who owes money)
  - Creditor (person to whom money is owed)
  - Amount
  - Reason for debt
  - Date
  - Optional notes
- All debt records require manager approval before becoming active

### 2. **Manager Approval System**
- Managers see pending debt approvals in:
  - Dashboard (Pending Debt Approvals card)
  - Debts page
- Managers can:
  - View detailed debt information
  - Approve debt records
  - Reject debt records
- Only approved debts affect member balances

### 3. **Payment Tracking**
- Debtors can record partial or full payments
- Payment form includes:
  - Payment amount (validated against remaining balance)
  - Payment date
  - Optional notes
- Payment history is tracked for each debt
- Progress bar shows percentage paid

### 4. **Automatic Balance Updates**
- Debts are automatically included in balance calculations
- Balance formula:
  ```
  Balance = (money paid - share of expenses) + (money owed to you - money you owe)
  ```
- Active debts impact:
  - Debtor: Negative impact (reduces balance)
  - Creditor: Positive impact (increases balance)

### 5. **Celebration Feature**
- When a debt is fully paid:
  - Confetti animation plays automatically
  - Congratulations toast message appears
  - Debt status changes to "paid"
  - Payment recorded with full details

### 6. **Security & Permissions**

#### Firestore Rules:
```javascript
// Debts subcollection
match /debts/{debtId} {
  // All household members can read debts
  allow read: if isMember(householdId);
  
  // Any household member can create a debt record
  allow create: if isMember(householdId) && 
                  request.auth.uid == request.resource.data.createdBy;
  
  // Managers can update any debt (for approval/rejection)
  // Debtors can update their own debts (for recording payments)
  allow update: if isSignedIn() && 
                  (isManager(householdId) || 
                   (request.auth.uid == resource.data.debtor && 
                    resource.data.status == 'approved') ||
                   (request.auth.uid == resource.data.createdBy && 
                    resource.data.status == 'pending'));
  
  // Only managers can delete debts
  allow delete: if isManager(householdId);
}
```

## Components

### 1. **DebtForm** (`src/components/Debts/DebtForm.jsx`)
- Form for creating new debt records
- Validates input data
- Submits to Firestore with pending status

### 2. **DebtList** (`src/components/Debts/DebtList.jsx`)
- Displays all debt records with filtering
- Filter options:
  - All Debts
  - I Owe (debts where current user is debtor)
  - Owed to Me (debts where current user is creditor)
- Shows:
  - Debt details
  - Progress bar
  - Payment history
  - Action buttons

### 3. **DebtPaymentForm** (`src/components/Debts/DebtPaymentForm.jsx`)
- Form for recording payments towards a debt
- Validates payment amount
- Triggers celebration when fully paid
- Updates debt record with new payment

### 4. **PendingDebtApprovals** (`src/components/Debts/PendingDebtApprovals.jsx`)
- Manager-only component
- Shows pending debt records
- Quick approve/reject actions
- Detailed view modal

### 5. **Debts Page** (`src/pages/Debts.jsx`)
- Main page for debt management
- Shows statistics:
  - Active debts count
  - Pending approval count
  - Fully paid count
  - Total debt amount
- Personal summary cards:
  - Money I Owe
  - Money Owed to Me
- Pending approvals (for managers)
- Debt list with filtering
- Floating add button

## Data Structure

### Debt Document
```javascript
{
  debtor: "user_uid",              // Person who owes
  creditor: "user_uid",            // Person to whom owed
  originalAmount: 100.00,          // Original debt amount
  remainingAmount: 50.00,          // Current remaining amount
  reason: "Borrowed for groceries",
  date: "2024-01-15",              // Debt creation date
  notes: "Optional notes",
  status: "approved",              // pending, approved, rejected, paid
  payments: [                      // Array of payment records
    {
      amount: 50.00,
      date: "2024-01-20",
      notes: "First payment",
      paidBy: "user_uid",
      paidAt: "2024-01-20T10:30:00.000Z"
    }
  ],
  createdAt: "2024-01-15T08:00:00.000Z",
  createdBy: "user_uid",
  approvedBy: "manager_uid",       // null if not approved
  approvedAt: "2024-01-15T09:00:00.000Z",
  paidAt: "2024-01-20T10:30:00.000Z"  // null if not fully paid
}
```

## Navigation

The Debts page is accessible from:
- Sidebar navigation (DollarSign icon)
- Route: `/debts`
- Available to all household members

## Usage Flow

### For Members (Debtors):

1. **Create Debt Record**
   - Navigate to Debts page
   - Click floating "+" button
   - Fill in debt details
   - Submit for approval

2. **Wait for Approval**
   - Debt appears in "Pending Approval" status
   - Manager reviews and approves/rejects

3. **Make Payments**
   - Once approved, debt appears in "I Owe" filter
   - Click "Record Payment" button
   - Enter payment amount and date
   - Submit payment

4. **Celebrate Completion**
   - When last payment is made:
     - Confetti animation plays
     - Congratulations message appears
     - Debt status changes to "paid"

### For Managers:

1. **Review Pending Debts**
   - View pending debts in Dashboard or Debts page
   - Click "View Details" for more information

2. **Approve/Reject**
   - Review debt information
   - Click "Approve" to activate debt
   - Click "Reject" to decline debt record

3. **Monitor Debts**
   - View all active debts
   - Track payments made by members
   - See completed debts

## Integration with Existing Features

### Balance Calculation
- Updated `calculateBalances()` function in `src/utils/calculations.js`
- Now accepts debts as third parameter
- Includes debt amounts in member balances:
  - `totalDebtOwed`: Money member owes to others
  - `totalDebtCredit`: Money others owe to member
  - `debtCount`: Number of active debts

### Dashboard
- Updated to fetch and pass debts to balance calculations
- Shows accurate balances including debt impact

### Profile Page
- Updated to include debts in personal balance calculation
- Reflects accurate financial status

### Reports Page
- Updated to include debts in balance reports
- Settlement calculations consider active debts

## Technical Details

### State Management
- Debts are fetched in real-time via `HouseholdContext`
- Uses Firestore `onSnapshot` for live updates
- Sorted by date (descending)

### Calculations
```javascript
// Balance with debts
balance = totalPaid - totalShare + totalDebtCredit - totalDebtOwed

// Active debts
activeDebts = debts.filter(
  debt => debt.status === 'approved' && debt.remainingAmount > 0
)
```

### Animations
- Uses `canvas-confetti` for celebration animation
- Uses `framer-motion` for UI animations
- Smooth transitions and progress bars

## Testing Checklist

- [ ] Create debt record as member
- [ ] Approve debt as manager
- [ ] Reject debt as manager
- [ ] Record partial payment
- [ ] Record full payment (test celebration)
- [ ] View debt history
- [ ] Filter debts (All, I Owe, Owed to Me)
- [ ] Check balance updates after approval
- [ ] Check balance updates after payment
- [ ] Verify manager-only features are hidden from members
- [ ] Test validation (negative amounts, invalid dates, etc.)

## Future Enhancements

Possible improvements:
1. Debt reminders/notifications
2. Recurring debt tracking
3. Interest calculation option
4. Debt consolidation feature
5. Export debt reports
6. Debt categories
7. Attach receipts/images to debt records
8. Payment schedules
9. Multi-currency support for debts
10. Debt dispute resolution system

## Dependencies

- `canvas-confetti`: ^1.9.3 (for celebration animation)
- All existing project dependencies

## Files Modified/Created

### Created:
- `src/components/Debts/DebtForm.jsx`
- `src/components/Debts/DebtList.jsx`
- `src/components/Debts/DebtPaymentForm.jsx`
- `src/components/Debts/PendingDebtApprovals.jsx`
- `src/pages/Debts.jsx`
- `DEBT_TRACKING_FEATURE.md`

### Modified:
- `src/context/HouseholdContext.jsx` - Added debts state and listener
- `src/utils/calculations.js` - Updated calculateBalances to include debts
- `src/pages/Dashboard.jsx` - Pass debts to balance calculations
- `src/pages/Profile.jsx` - Pass debts to balance calculations
- `src/pages/Reports.jsx` - Pass debts to balance calculations
- `src/components/Layout/Sidebar.jsx` - Added Debts navigation item
- `src/App.jsx` - Added Debts route
- `firestore.rules` - Added security rules for debts collection
- `package.json` - Added canvas-confetti dependency

## Support

For issues or questions about the debt tracking feature:
1. Check this documentation
2. Review Firestore rules for permission issues
3. Check browser console for errors
4. Verify manager role for approval features

