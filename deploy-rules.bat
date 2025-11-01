@echo off
echo ============================================
echo   Deploying Firestore Security Rules
echo ============================================
echo.

echo Checking Firebase CLI...
call firebase --version
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Firebase CLI not found!
    echo Please install it first: npm install -g firebase-tools
    pause
    exit /b 1
)

echo.
echo Deploying Firestore rules...
echo.

call firebase deploy --only firestore:rules

if %errorlevel% equ 0 (
    echo.
    echo ============================================
    echo   SUCCESS! Rules deployed successfully
    echo ============================================
    echo.
    echo All new features are now available:
    echo  - Recurring Expenses
    echo  - Budget Management
    echo  - Savings Goals
    echo  - Inventory Management
    echo  - Debt Payments
    echo  - Expense Comments
    echo.
) else (
    echo.
    echo ============================================
    echo   ERROR: Deployment failed
    echo ============================================
    echo.
    echo Troubleshooting:
    echo 1. Make sure you're logged in: firebase login
    echo 2. Check if project is set: firebase use --add
    echo 3. Verify you have permissions to this project
    echo.
)

pause
