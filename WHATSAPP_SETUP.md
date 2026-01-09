# WhatsApp Business API Setup Guide

This guide will help you set up WhatsApp Business API for sending notifications about bills and payments.

## Prerequisites

1. A Facebook/Meta Developer Account
2. A Meta App (create one at https://developers.facebook.com/apps/)

## Step 1: Create a Meta App

1. Go to https://developers.facebook.com/apps/
2. Click "Create App"
3. Select "Business" as the app type
4. Fill in your app details (Name, Contact Email)
5. Click "Create App"

## Step 2: Add WhatsApp Product

1. In your app dashboard, find "WhatsApp" in the products list
2. Click "Set up" on WhatsApp
3. Follow the setup wizard

## Step 3: Get Your Credentials

1. In your app dashboard, go to **WhatsApp > API Setup**
2. You'll find:
   - **Phone Number ID**: A unique identifier for your WhatsApp Business phone number
   - **Access Token**: A temporary token (valid for 24 hours) or a permanent token
   - **API Version**: Usually `v21.0` or similar

## Step 4: Get a Permanent Access Token (Recommended)

⚠️ **Important**: Temporary tokens expire after 24 hours. For production, you should create a permanent access token.

### Option A: Using System User (Recommended for Production)

1. Go to [Meta Business Settings](https://business.facebook.com/settings)
2. Navigate to **Users > System Users**
3. Click **Add** to create a new System User
4. Give it a name (e.g., "WhatsApp API User") and select **System User** role
5. Click **Create System User**
6. Click **Assign Assets** and select your App
7. Under **WhatsApp**, select your WhatsApp Business Account
8. Grant permissions: **Manage WhatsApp Messages** and **Manage WhatsApp Business Account**
9. Click **Save Changes**
10. Go back to **System Users** and click **Generate New Token**
11. Select your app, choose **whatsapp_business_messaging** and **whatsapp_business_management** permissions
12. Click **Generate Token** and copy the token (this is your permanent token)

### Option B: Using Temporary Token (For Testing)

1. Go to **WhatsApp > API Setup** in your app dashboard
2. Under "Temporary access token", click "Generate token"
3. Copy the token (valid for 24 hours only)
4. **Note**: You'll need to regenerate this token every 24 hours

### Option C: Extend Temporary Token (For Development)

If you need to extend a temporary token:
1. Go to **WhatsApp > API Setup**
2. Click "Generate token" to create a new temporary token
3. Update your `.env` file with the new token
4. Restart your development server

## Step 5: Configure Environment Variables

1. Copy `.env.example` to `.env` (if you haven't already)
2. Add your WhatsApp credentials:

```env
VITE_WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
VITE_WHATSAPP_ACCESS_TOKEN=your_access_token_here
VITE_WHATSAPP_API_VERSION=v21.0
```

## Step 6: Restart Your Development Server

⚠️ **Important**: After updating your `.env` file with new credentials, you MUST restart your development server for the changes to take effect:

```bash
# Stop your current server (Ctrl+C)
# Then restart it
npm run dev
```

## Step 7: Test Your Setup

1. Make sure you have added mobile numbers to your members
2. Create a test bill as a manager
3. Check if WhatsApp notifications are sent to members
4. Record a payment and verify notifications are sent
5. Try sending a manual message from the Members page

## Important Notes

### Free Tier Limitations

WhatsApp Business API has a free tier that includes:
- **1,000 conversations per month** (free)
- Each 24-hour conversation window counts as one conversation
- After 1,000 conversations, you'll need to pay per conversation

### Security Considerations

⚠️ **Important**: The current implementation stores the access token in the frontend environment variables. For production:

1. **Use a Backend/Cloud Function**: Create a Firebase Cloud Function or backend API to handle WhatsApp API calls
2. **Store tokens securely**: Keep access tokens on the server side
3. **Use environment variables**: Never commit tokens to version control

### Phone Number Format

The service automatically formats phone numbers to WhatsApp's required format:
- Removes all non-digit characters
- Adds country code if missing (default: 880 for Bangladesh)
- Formats as: `8801712345678` (no + or spaces)

### Testing in Development

In development mode, if WhatsApp credentials are not configured, the service will:
- Log the message to the console instead of sending
- Return `true` to allow testing without actual WhatsApp messages

## Troubleshooting

### Messages Not Sending

1. **Check credentials**: Verify your Phone Number ID and Access Token are correct
2. **Check token expiration**: Temporary tokens expire after 24 hours
3. **Check phone number format**: Ensure member phone numbers are in the correct format
4. **Check console**: Look for error messages in the browser console
5. **Check WhatsApp API status**: Verify your WhatsApp Business account is active

### Common Errors

- **Invalid phone number**: Make sure phone numbers include country code
- **Access token expired**: Generate a new token or use a permanent token
- **Rate limiting**: WhatsApp has rate limits; wait a few minutes and try again

## Alternative: Using a Backend Service

For better security and reliability, consider:

1. **Firebase Cloud Functions**: Create a function to handle WhatsApp API calls
2. **Custom Backend API**: Build a backend service to manage WhatsApp messaging
3. **Third-party Services**: Use services like Twilio, MessageBird, etc. (may have costs)

## Support

For more information, visit:
- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [WhatsApp Cloud API Guide](https://developers.facebook.com/docs/whatsapp/cloud-api)

