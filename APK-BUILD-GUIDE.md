# 📱 RANG BIRANGI — Android APK Build Guide

This guide shows you how to turn the web app into a real Android `.apk` file.

## ⚠️ Why This Can't Be Done Automatically

The `.apk` compilation requires:
- **Android SDK** (not available in web sandboxes)
- **Gradle** build system
- **Java JDK 17+**

These must be installed on YOUR computer. But the good news — it's only a few commands!

---

## 🚀 Option 1: Capacitor (Recommended — wraps the web app in a native shell)

### Prerequisites (install on your computer)
1. **Node.js 18+**: https://nodejs.org
2. **Android Studio**: https://developer.android.com/studio (installs Android SDK + Gradle)
3. **Java JDK 17**: comes with Android Studio

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/ojaskhannaXnightmare/rang-birangi.git
cd rang-birangi

# 2. Install dependencies
bun install  # or npm install

# 3. Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# 4. Build the web app
bun run build

# 5. Add Android platform
npx cap add android

# 6. Copy web assets to native project
npx cap copy android

# 7. Open in Android Studio
npx cap open android
```

### In Android Studio:
1. Wait for Gradle sync to complete
2. Click **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. Find the APK at: `android/app/build/outputs/apk/debug/app-debug.apk`
4. Install on your phone: `adb install app-debug.apk`

### For Release APK (signed, for Play Store):
```bash
# Generate keystore
keytool -genkey -v -keystore rangbirangi.keystore -alias rangbirangi -keyalg RSA -keysize 2048 -validity 10000

# Build release APK
cd android
./gradlew assembleRelease
```

APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

---

## 📲 Option 2: PWA (Easiest — no APK needed!)

The web app is already a **Progressive Web App (PWA)**. Users can install it directly:

### On Android (Chrome):
1. Open `https://rang-birangi.vercel.app` in Chrome
2. Tap the **menu** (3 dots, top right)
3. Tap **"Add to Home screen"** or **"Install app"**
4. The app appears in the app drawer — works like a native app!

### On iOS (Safari):
1. Open the URL in Safari
2. Tap the **Share** button
3. Tap **"Add to Home Screen"**
4. The app appears on the home screen

### PWA Features Already Enabled:
- ✅ Installable (manifest.json)
- ✅ App icon (logo.png)
- ✅ Standalone display (no browser chrome)
- ✅ Theme color (#7B1E3A maroon)
- ✅ Background color (#0F0F10 dark)
- ✅ Portrait orientation
- ✅ Apple touch icon

---

## 🔗 URL Routing

The app now supports URL hash routing:

| URL | View |
|-----|------|
| `/#/` | Home |
| `/#/shop` | Shop (all products) |
| `/#/shop/handmade-bangles` | Shop (specific category) |
| `/#/product/rajasthani-lac-bangles-set` | Product detail |
| `/#/cart` | Cart |
| `/#/checkout` | Checkout |
| `/#/dashboard` | Customer dashboard |
| `/#/admin` | Admin panel |
| `/#/login` | Opens login modal |
| `/#/signup` | Opens signup modal |

Users can:
- Bookmark specific pages
- Share product links
- Use browser back/forward buttons
- Refresh without losing their place

---

## 📦 Summary

| Option | Difficulty | Result |
|--------|-----------|--------|
| **PWA** (already done) | ⭐ Easy | Installable via Chrome — no APK file needed |
| **Capacitor APK** | ⭐⭐ Medium | Real `.apk` file — requires your computer + Android Studio |
| **Play Store** | ⭐⭐⭐ Hard | Signed release APK — requires developer account ($25) |

**Recommendation**: Start with PWA (already working!), then build APK with Capacitor when you're ready for Play Store.
