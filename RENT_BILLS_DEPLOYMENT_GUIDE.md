# Rent & Bills Feature - Deployment Guide

## Prerequisites
- Firebase project already set up
- Firebase CLI installed
- Project already configured with Firestore

## Deployment Steps

### 1. Deploy Firestore Rules
The updated firestore rules include permissions for the new rent/bills collections.

```bash
# Deploy the updated rules
firebase deploy --only firestore:rules
```

### 2. Build the Application
```bash
# Install any new dependencies (if needed)
npm install

# Build the production version
npm run build
```

### 3. Deploy to Firebase Hosting
```bash
# Deploy the entire application
firebase deploy

# Or deploy only hosting
firebase deploy --only hosting
```

### 4. Verify Deployment

After deployment, verify:

1. **Firestore Rules are Active**
   - Go to Firebase Console → Firestore Database → Rules
   - Check that the rules include `rentBillMembers` and `rentBills` sections

2. **Application Loads**
   - Visit your deployed URL
   - Login with a manager account
   - Check that "Rent & Bills" appears in the sidebar

3. **Test Basic Operations**
   - Create a rent-only member
   - Create a bill
   - Record a payment
   - Check dashboard shows rent/bills summary

## Post-Deployment Configuration

### Setting Up First Rent-Only Member

1. **Login as Manager**
   - Use a manager account

2. **Navigate to Rent & Bills**
   - Click "Rent & Bills" in sidebar

3. **Add Rent-Only Member**
   - Click "Members" tab
   - Click "Add Member"
   - Enter email address
   - Add name and optional nickname
   - Submit

4. **Create First Bill**
   - Go back to "Bills" tab
   - Click the floating "+" button
   - Select bill type (e.g., Rent)
   - Choose the member you just added
   - Enter amount and due date
   - Submit

5. **Test Rent-Only Member Login**
   - Logout from manager account
   - Login with the rent-only member's Gmail
   - Verify they can only see their bills
   - Verify they cannot access other features

## Firestore Indexes

If you encounter any "requires an index" errors, Firestore will provide a link to create the required index. Common indexes you might need:

### For `rentBills` Collection
- Composite index on: `householdId`, `memberId`, `dueDate`
- Composite index on: `householdId`, `status`, `dueDate`

To create indexes manually:
1. Go to Firebase Console → Firestore Database → Indexes
2. Click "Create Index"
3. Add the fields mentioned above

Or use the Firebase CLI:
```bash
firebase deploy --only firestore:indexes
```

## Environment Variables

Make sure your `.env` or environment configuration includes:
- Firebase API Key
- Firebase Auth Domain
- Firebase Project ID
- Firestore Database URL

## Security Checklist

- [x] Firestore rules deployed
- [x] Manager-only operations protected
- [x] Rent-only members restricted to their bills
- [x] Regular members have view-only access
- [x] Authentication required for all operations

## Troubleshooting

### Issue: "Permission Denied" Errors

**Solution:**
1. Verify Firestore rules are deployed
2. Check user authentication
3. Verify user role (manager/member/rent-only)

### Issue: Rent-Only Member Can't Login

**Solution:**
1. Verify Google Sign-In is enabled in Firebase Console
2. Check that the email is correctly added in the system
3. Clear browser cache and try again

### Issue: Bills Not Showing on Dashboard

**Solution:**
1. Check that RentBillsProvider is wrapping the Dashboard
2. Verify bills exist in Firestore
3. Check browser console for errors

### Issue: Real-time Updates Not Working

**Solution:**
1. Verify Firestore listeners are active
2. Check network connection
3. Verify Firestore rules allow read access

## Rollback Plan

If you need to rollback:

```bash
# Rollback hosting
firebase hosting:rollback

# Manually revert firestore rules in Firebase Console
```

To revert code changes:
1. Remove `RentBillsProvider` from App.jsx
2. Remove the `/rent-bills` route
3. Remove "Rent & Bills" from sidebar
4. Redeploy

## Monitoring

After deployment, monitor:

1. **Firebase Console → Firestore → Usage**
   - Check for unusual read/write patterns
   - Monitor storage usage

2. **Firebase Console → Authentication**
   - Monitor new user signups
   - Check for authentication errors

3. **Application Logs**
   - Check browser console for errors
   - Monitor user feedback

## Performance Optimization

### Recommended Settings:

1. **Firestore Caching**
   - Already enabled via `enablePersistence()`

2. **Lazy Loading**
   - Consider lazy loading the RentBills page if bundle size is large

3. **Pagination**
   - If you have many bills, implement pagination in RentBillList

## Backup Strategy

Before making changes:
1. Export Firestore data
2. Backup firestore.rules file
3. Tag the current git commit

```bash
# Export Firestore data
firebase firestore:export gs://your-bucket/backups/$(date +%Y%m%d)

# Tag git commit
git tag -a rent-bills-v1.0 -m "Rent & Bills feature deployed"
git push origin rent-bills-v1.0
```

## Testing in Production

1. **Smoke Tests**
   - Manager can create bills ✓
   - Regular members can view bills ✓
   - Rent-only members limited access ✓
   - Dashboard shows summary ✓

2. **Performance Tests**
   - Load time < 3 seconds
   - Real-time updates < 1 second delay
   - No memory leaks

3. **Security Tests**
   - Try accessing bills without authentication (should fail)
   - Try editing as regular member (should fail)
   - Try viewing other's bills as rent-only member (should fail)

## Maintenance

### Regular Tasks:
- Monitor Firestore usage
- Review and update firestore rules as needed
- Check for outdated dependencies
- Review user feedback

### Monthly Tasks:
- Export Firestore backups
- Review security rules
- Check for Firebase updates

## Support Resources

- Firebase Documentation: https://firebase.google.com/docs
- React Documentation: https://react.dev
- Project README: README.md
- Feature Summary: RENT_BILLS_FEATURE_SUMMARY.md

---

**Last Updated**: November 1, 2025  
**Deployment Version**: 1.0.0

