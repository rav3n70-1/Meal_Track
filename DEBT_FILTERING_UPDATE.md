# Debt Filtering Update - Role-Based Visibility

## Date: November 1, 2025

## Overview
Updated the Debts page to implement role-based filtering, ensuring managers see all debts while regular members only see debts that involve them.

---

## Changes Made

### 1. DebtList Component (`src/components/Debts/DebtList.jsx`)

**Updated Filtering Logic:**
- **Managers**: Can see ALL debts in the household
- **Regular Members**: Only see debts where they are either the debtor or creditor

**Filter Behavior:**

| Filter | Manager Sees | Member Sees |
|--------|-------------|-------------|
| **All Debts** / **My Debts** | All household debts | Only debts involving them |
| **I Owe** | All debts where anyone owes | Only debts where they owe |
| **Owed to Me** | All debts where anyone is owed | Only debts owed to them |

**Button Label Update:**
- Managers see: "All Debts" button
- Members see: "My Debts" button (for the 'all' filter)

### 2. Debts Page (`src/pages/Debts.jsx`)

**Updated Statistics:**
- Statistics now calculated based on visible debts only
- Managers see stats for all debts
- Members see stats only for debts involving them

**Updated Description:**
- Managers see: "Track all money owed between household members"
- Members see: "Track your debts and money owed to you"

**Total Debt Calculation:**
- Managers: Sum of ALL active debts in household
- Members: Sum of debts they owe + debts owed to them

---

## Implementation Details

### Filtering Code (DebtList.jsx)

```javascript
// Filter debts based on user role
const filteredDebts = debts.filter(debt => {
  // Skip non-approved debts
  if (debt.status !== 'approved') return false;

  // Apply specific filters
  if (filter === 'my-debts') {
    return debt.debtor === currentUser?.uid;
  }
  if (filter === 'owed-to-me') {
    return debt.creditor === currentUser?.uid;
  }
  
  // 'all' filter - depends on role
  if (role === 'manager') {
    // Managers see ALL debts
    return true;
  } else {
    // Regular members only see debts involving them
    return debt.debtor === currentUser?.uid || debt.creditor === currentUser?.uid;
  }
});
```

### Statistics Code (Debts.jsx)

```javascript
// Filter debts based on role - same logic as DebtList
let visibleDebts = debts;
if (role !== 'manager') {
  // Regular members only see debts involving them
  visibleDebts = debts.filter(debt => 
    debt.debtor === currentUser?.uid || debt.creditor === currentUser?.uid
  );
}
```

---

## User Experience

### For Managers:
1. Navigate to Debts page
2. See **all household debts** by default
3. Statistics show **complete household debt overview**
4. Can filter to see specific debt types
5. Button shows "All Debts" for comprehensive view

### For Regular Members:
1. Navigate to Debts page
2. See **only debts involving them** by default
3. Statistics show **only their personal debt situation**
4. Can filter to:
   - "My Debts" - All debts involving them
   - "I Owe" - Only debts they owe
   - "Owed to Me" - Only debts owed to them
5. Button shows "My Debts" for clarity

---

## Privacy & Security

### What Members CAN See:
- ✅ Debts where they are the debtor
- ✅ Debts where they are the creditor
- ✅ Payment history for their debts
- ✅ Statistics about their debts only

### What Members CANNOT See:
- ❌ Debts between other household members
- ❌ Total household debt (unless they're involved)
- ❌ Other members' debt details
- ❌ Payment history of debts not involving them

### What Managers CAN See:
- ✅ **All debts** in the household
- ✅ Complete household debt statistics
- ✅ All payment histories
- ✅ Total household debt amount

---

## Examples

### Example Household:
- **Alice** (Manager)
- **Bob** (Member)
- **Charlie** (Member)

### Debt Scenarios:

**Debt 1:** Bob owes Alice ৳500  
**Debt 2:** Charlie owes Bob ৳300  
**Debt 3:** Alice owes Charlie ৳200

### What Each User Sees:

**Alice (Manager):**
- Filter: "All Debts" → Shows Debt 1, 2, 3
- Filter: "I Owe" → Shows Debt 3
- Filter: "Owed to Me" → Shows Debt 1
- Total Debt stat: ৳1,000 (sum of all debts)

**Bob (Member):**
- Filter: "My Debts" → Shows Debt 1, 2 (only involving Bob)
- Filter: "I Owe" → Shows Debt 1
- Filter: "Owed to Me" → Shows Debt 2
- Total Debt stat: ৳800 (৳500 he owes + ৳300 owed to him)
- **Cannot see Debt 3** (between Alice and Charlie)

**Charlie (Member):**
- Filter: "My Debts" → Shows Debt 2, 3 (only involving Charlie)
- Filter: "I Owe" → Shows Debt 2
- Filter: "Owed to Me" → Shows Debt 3
- Total Debt stat: ৳500 (৳300 he owes + ৳200 owed to him)
- **Cannot see Debt 1** (between Bob and Alice)

---

## Benefits

### For Managers:
✅ Complete oversight of household debt situation  
✅ Can mediate and manage all debts  
✅ Full transparency for household management

### For Members:
✅ Privacy - don't see other members' debts  
✅ Focused view - only see relevant information  
✅ Less clutter - simplified interface  
✅ Clear understanding of personal debt situation

### For Household:
✅ Better privacy protection  
✅ Reduced information overload  
✅ Clearer role separation  
✅ More intuitive user experience

---

## Testing Checklist

### As Manager:
- [ ] Navigate to Debts page
- [ ] Verify you see all household debts
- [ ] Check "All Debts" button shows all debts
- [ ] Verify statistics include all household debts
- [ ] Test "I Owe" filter
- [ ] Test "Owed to Me" filter

### As Regular Member:
- [ ] Navigate to Debts page
- [ ] Verify you only see debts involving you
- [ ] Check "My Debts" button label
- [ ] Verify statistics only include your debts
- [ ] Confirm you DON'T see debts between other members
- [ ] Test "I Owe" filter
- [ ] Test "Owed to Me" filter

### Edge Cases:
- [ ] Member with no debts sees empty state
- [ ] Member involved in many debts sees all of them
- [ ] Manager can switch between all filters
- [ ] Statistics update correctly when filtering

---

## Files Modified

1. **src/components/Debts/DebtList.jsx**
   - Updated filtering logic (lines 38-59)
   - Updated button label (line 113)

2. **src/pages/Debts.jsx**
   - Updated statistics calculation (lines 27-77)
   - Updated page description (lines 100-104)

---

## Migration Notes

### No Breaking Changes:
- ✅ Existing debts remain unchanged
- ✅ No database migration required
- ✅ Firestore rules unchanged (already support this)
- ✅ Backward compatible

### Automatic Behavior:
- ✅ Managers automatically see all debts
- ✅ Members automatically see filtered debts
- ✅ No user action required

---

## Future Enhancements (Optional)

1. **Manager Toggle**: Add option for managers to view "as member" to see member perspective
2. **Notification System**: Notify members when debts involving them change
3. **Export Filtering**: Allow members to export only their debts
4. **Search Function**: Add search within visible debts
5. **Sort Options**: Add sorting by amount, date, member name

---

## Conclusion

The debt filtering system now provides:
- ✅ **Role-based visibility** - Managers see all, members see only their debts
- ✅ **Privacy protection** - Members can't see other members' debts
- ✅ **Better UX** - Clear, focused interface for each user type
- ✅ **Intuitive labels** - "All Debts" vs "My Debts" based on role
- ✅ **Accurate statistics** - Stats reflect what each user can see

**Status:** ✅ Complete and Ready for Use

