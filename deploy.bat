@echo off
echo ========================================
echo Meal Tracker - Complete Deployment
echo ========================================
echo.
echo This script will:
echo 1. Build the React app
echo 2. Deploy to Firebase Hosting
echo 3. Deploy Firestore rules
echo.
pause
echo.

echo ========================================
echo Step 1: Building React App...
echo ========================================
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ❌ Build failed! Please check the errors above.
    pause
    exit /b 1
)
echo ✅ Build completed successfully!
echo.

echo ========================================
echo Step 2: Deploying to Firebase...
echo ========================================
firebase deploy
if %errorlevel% neq 0 (
    echo.
    echo ❌ Deployment failed! Please check the errors above.
    pause
    exit /b 1
)
echo.

echo ========================================
echo ✅ Deployment Complete!
echo ========================================
echo.
echo Your app is now live at:
echo https://meal-tracker-11262.web.app
echo or
echo https://meal-tracker-11262.firebaseapp.com
echo.
echo What was deployed:
echo ✅ React app (built to dist folder)
echo ✅ Firestore security rules
echo ✅ PWA manifest and service worker
echo.
pause

