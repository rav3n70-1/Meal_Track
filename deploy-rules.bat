@echo off
echo ========================================
echo Deploying Firestore Security Rules
echo ========================================
echo.
echo Project: meal-tracker-11262
echo.
echo This will deploy the updated security rules that fix the invite code issue.
echo.
pause
echo.
echo Deploying...
firebase deploy --only firestore:rules
echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Test joining a household with an invite code
echo 2. Verify no permission errors
echo 3. Check Firebase Console for rule updates
echo.
pause

