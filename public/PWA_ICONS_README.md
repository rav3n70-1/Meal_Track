# PWA Icons Setup

This folder needs the following icon files for the Progressive Web App to work properly:

## Required Icons

1. **pwa-192x192.png** (192x192 pixels)
2. **pwa-512x512.png** (512x512 pixels)
3. **apple-touch-icon.png** (180x180 pixels)
4. **favicon.ico** (standard favicon)

## Quick Generation

You can generate these icons automatically using one of these methods:

### Method 1: Using PWA Asset Generator (Recommended)

```bash
# Install globally
npm install -g pwa-asset-generator

# Generate icons from your logo
pwa-asset-generator logo.png public --icon-only
```

### Method 2: Using Online Tools

1. **RealFaviconGenerator**: https://realfavicongenerator.net/
   - Upload your logo
   - Configure settings
   - Download and extract to public folder

2. **Favicon.io**: https://favicon.io/
   - Create from text, emoji, or image
   - Download package
   - Extract to public folder

3. **PWA Builder**: https://www.pwabuilder.com/imageGenerator
   - Upload base image (512x512 recommended)
   - Download generated assets
   - Place in public folder

### Method 3: Manual Creation

Using any image editor (Photoshop, GIMP, Figma, etc.):

1. Create a square logo
2. Export at these sizes:
   - 192x192 → save as `pwa-192x192.png`
   - 512x512 → save as `pwa-512x512.png`
   - 180x180 → save as `apple-touch-icon.png`
3. Create a favicon.ico (16x16 and 32x32 combined)

## Design Tips

- Use a simple, recognizable design
- Ensure good contrast
- Test on both light and dark backgrounds
- Use transparent background for better integration
- Keep important elements away from edges (safe zone)
- Use a green color scheme to match the app theme (#10b981)

## Icon Ideas

For a meal expense tracker, consider:
- 💰 Dollar sign with plate
- 🍽️ Utensils/plate icon
- 📊 Chart/graph icon
- 🏠 House with dollar sign
- 🧾 Receipt icon
- 💵 Money/bill icon

## Verification

After adding icons:
1. Run `npm run dev`
2. Open DevTools → Application → Manifest
3. Verify all icons are loaded correctly
4. Test PWA installation on mobile device

## Current Status

⚠️ **Icons Not Yet Added**

The app will still work, but PWA installation might not look professional without proper icons.
Add the icons following the instructions above for the best user experience.

