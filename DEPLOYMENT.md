# Deployment Guide - Meal Expense Tracker

Complete guide for deploying your Meal Expense Tracker to production.

## Pre-Deployment Checklist

Before deploying, ensure:

- ✅ Firebase project is created and configured
- ✅ Google Authentication is enabled in Firebase Console
- ✅ Firestore database is created
- ✅ Security rules are published
- ✅ Environment variables are configured
- ✅ App has been tested locally
- ✅ PWA icons are in place (optional but recommended)

## Deployment Options

Choose one of these deployment methods:

---

## Option 1: Firebase Hosting (Recommended)

### Why Firebase Hosting?
- Free SSL certificate
- Global CDN
- Easy rollbacks
- Integrated with Firebase services
- Automatic HTTPS redirect

### Step-by-Step

#### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

#### 2. Login to Firebase

```bash
firebase login
```

This will open a browser for authentication.

#### 3. Initialize Firebase in Your Project

```bash
firebase init hosting
```

Answer the prompts:
- **Select project**: Choose your existing project or create new
- **Public directory**: Enter `dist`
- **Single-page app**: `Yes`
- **Automatic builds with GitHub**: `No` (or Yes if you want CI/CD)
- **Overwrite index.html**: `No`

#### 4. Update .firebaserc

Edit `.firebaserc` to set your project ID:

```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

#### 5. Build Your App

```bash
npm run build
```

#### 6. Deploy

```bash
firebase deploy
```

#### 7. Access Your App

Your app will be live at: `https://your-project-id.web.app`

### Custom Domain Setup

1. Go to Firebase Console → Hosting → Add custom domain
2. Follow instructions to verify domain
3. Add DNS records provided by Firebase
4. Wait for SSL certificate provisioning (can take up to 24 hours)

### Environment Variables

Firebase Hosting doesn't use environment variables at runtime since this is a client-side app. The variables are baked into the build during `npm run build`, so ensure your `.env` file has the correct Firebase configuration before building.

---

## Option 2: Vercel

### Why Vercel?
- Automatic deployments from Git
- Built-in CI/CD
- Global edge network
- Zero configuration
- Free SSL

### Step-by-Step

#### 1. Install Vercel CLI

```bash
npm install -g vercel
```

#### 2. Build Your App

```bash
npm run build
```

#### 3. Deploy

```bash
vercel --prod
```

Follow the prompts to link your project.

#### 4. Add Environment Variables

Go to your project in [Vercel Dashboard](https://vercel.com/dashboard):
1. Select your project
2. Go to Settings → Environment Variables
3. Add all variables from your `.env` file:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

#### 5. Redeploy

After adding environment variables:

```bash
vercel --prod
```

### GitHub Integration

1. Push your code to GitHub
2. Import project in Vercel Dashboard
3. Configure environment variables
4. Deploy automatically on every push

---

## Option 3: Netlify

### Why Netlify?
- Git-based workflow
- Deploy previews
- Form handling
- Edge functions
- Free SSL

### Step-by-Step

#### 1. Install Netlify CLI

```bash
npm install -g netlify-cli
```

#### 2. Build Your App

```bash
npm run build
```

#### 3. Deploy

```bash
netlify deploy --prod
```

#### 4. Configure Build Settings

Create `netlify.toml` in project root:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### 5. Add Environment Variables

Go to [Netlify Dashboard](https://app.netlify.com/):
1. Select your site
2. Go to Site settings → Environment variables
3. Add all variables from your `.env` file

### GitHub Integration

1. Push code to GitHub
2. Go to Netlify Dashboard → New site from Git
3. Connect to GitHub and select repository
4. Configure build settings and environment variables
5. Deploy

---

## Option 4: Custom Server (VPS/Cloud)

### Requirements
- Node.js 18+ on server
- Nginx or Apache
- SSL certificate (Let's Encrypt)

### Step-by-Step

#### 1. Build Locally

```bash
npm run build
```

#### 2. Upload dist Folder

Use SCP, FTP, or your preferred method:

```bash
scp -r dist/* user@your-server:/var/www/meal-tracker/
```

#### 3. Configure Nginx

Create `/etc/nginx/sites-available/meal-tracker`:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/meal-tracker;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Enable gzip compression
    gzip on;
    gzip_types text/css application/javascript application/json;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 4. Enable SSL with Certbot

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Post-Deployment Steps

### 1. Update Firebase Authorized Domains

1. Go to Firebase Console
2. Authentication → Settings → Authorized domains
3. Add your production domain

### 2. Test Your Deployment

- ✅ Sign in with Google works
- ✅ Create household
- ✅ Invite members (test with different account)
- ✅ Add expenses
- ✅ Approve/reject expenses
- ✅ View reports and charts
- ✅ Export data works
- ✅ PWA installation works
- ✅ Dark mode toggle works
- ✅ Mobile responsive
- ✅ All pages accessible

### 3. Monitor Your App

#### Firebase Console
- Authentication → Users (check sign-ins)
- Firestore → Data (verify data structure)
- Usage → Monitor quotas

#### Browser DevTools
- Check for console errors
- Test PWA features
- Verify service worker registration

---

## Continuous Deployment (CI/CD)

### GitHub Actions (Firebase Hosting)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
          projectId: your-project-id
```

Add secrets in GitHub repository settings.

---

## Rollback Procedures

### Firebase Hosting

View previous deployments:
```bash
firebase hosting:channel:list
```

Rollback to previous version:
```bash
firebase hosting:rollback
```

### Vercel

Go to Deployments → Select previous deployment → Promote to Production

### Netlify

Go to Deploys → Select previous deploy → Publish deploy

---

## Performance Optimization

### Before Deployment

1. **Optimize Images**
   - Compress PWA icons
   - Use WebP format where possible

2. **Code Splitting**
   - Already configured in Vite

3. **Tree Shaking**
   - Remove unused code (automatic with Vite)

4. **Minification**
   - Enabled in production build

### After Deployment

1. **Monitor Performance**
   - Use Lighthouse in Chrome DevTools
   - Check Core Web Vitals

2. **Enable Caching**
   - Configured in firebase.json
   - Verify cache headers

---

## Security Checklist

- ✅ HTTPS enabled
- ✅ Firestore security rules published
- ✅ API keys restricted (optional, for production)
- ✅ Content Security Policy (optional)
- ✅ No sensitive data in client-side code
- ✅ Environment variables not committed to Git

---

## Troubleshooting

### Build Errors

**Error: Cannot find module**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Memory issues**
```bash
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

### Deployment Errors

**Firebase: unauthorized domain**
→ Add domain to Firebase Console → Authentication → Authorized domains

**Blank page after deployment**
→ Check browser console for errors
→ Verify environment variables are set
→ Check that routing is configured for SPA

**PWA not installing**
→ Ensure HTTPS is enabled
→ Verify manifest.json is accessible
→ Check service worker registration

---

## Maintenance

### Regular Tasks

1. **Weekly**
   - Monitor Firebase usage
   - Check for errors in console

2. **Monthly**
   - Update dependencies: `npm update`
   - Review security alerts: `npm audit`
   - Check Firebase quotas

3. **Quarterly**
   - Update major versions
   - Review and optimize security rules
   - Performance audit

---

## Support & Resources

- **Firebase Docs**: https://firebase.google.com/docs
- **Vite Docs**: https://vitejs.dev
- **React Docs**: https://react.dev

For issues specific to this app, check:
- `README.md` - General information
- `SETUP_GUIDE.md` - Detailed setup
- `FEATURES.md` - Feature documentation

---

**Ready to deploy? Choose your platform and follow the steps above!** 🚀

