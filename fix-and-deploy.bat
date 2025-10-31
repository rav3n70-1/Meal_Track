@echo off
echo ========================================
echo Quick Fix and Deploy
echo ========================================
echo.
echo This will:
echo 1. Rebuild the app with the routing fix
echo 2. Deploy to Firebase
echo 3. Also work on localhost
echo.
pause
echo.

echo ========================================
echo Step 1: Rebuilding App...
echo ========================================
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ❌ Build failed! Please check the errors above.
    pause
    exit /b 1
)
echo ✅ Build completed!
echo.

echo ========================================
echo Step 2: Deploying to Firebase...
echo ========================================
firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo.
    echo ❌ Deployment failed! Please check the errors above.
    pause
    exit /b 1
)
echo.

echo ========================================
echo ✅ Fix Complete!
echo ========================================
echo.
echo What was fixed:
echo ✅ Root path (/) now redirects to login if not authenticated
echo ✅ Fixed routing order
echo ✅ App deployed to Firebase
echo.
echo Test locally:
echo   npm run dev
echo   Then visit: http://localhost:5173
echo.
echo Test online:
echo   https://meal-tracker-11262.web.app
echo.
echo Both should now work! Remember to hard refresh (Ctrl+Shift+R)
echo.
pause

