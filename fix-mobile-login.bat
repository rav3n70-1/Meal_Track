@echo off
echo ========================================
echo Mobile Login 404 Fix - Deployment
echo ========================================
echo.
echo This fix includes:
echo ✅ Hybrid auth (popup desktop + redirect for mobile)
echo ✅ Redirect result handler
echo ✅ No manual navigation
echo ✅ OAuth callback processing
echo ✅ Improved error handling
echo.
echo This will:
echo 1. Build the app with mobile login fixes
echo 2. Deploy to Firebase Hosting
echo 3. Test URLs provided
echo.
pause
echo.

echo ========================================
echo Step 1: Building App...
echo ========================================
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ❌ Build failed! Check errors above.
    pause
    exit /b 1
)
echo ✅ Build successful!
echo.

echo ========================================
echo Step 2: Deploying to Firebase...
echo ========================================
firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo.
    echo ❌ Deployment failed! Check errors above.
    pause
    exit /b 1
)
echo.

echo ========================================
echo ✅ Deployment Complete!
echo ========================================
echo.
echo Your app is live at:
echo https://meal-tracker-11262.web.app
echo.
echo CRITICAL: Test on mobile device now!
echo.
echo Mobile Test Steps:
echo 1. Open link on mobile browser
echo 2. Clear browser cache
echo 3. Tap "Sign in with Google"
echo 4. Authenticate
echo 5. Should return to app smoothly
echo 6. NO 404 error!
echo 7. NO hard reload needed!
echo.
echo Desktop Test:
echo 1. Open link in browser
echo 2. Click "Sign in with Google"
echo 3. Popup appears
echo 4. Works smoothly
echo 5. No issues!
echo.
pause

