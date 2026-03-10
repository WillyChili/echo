# Echo App — Session Summary (March 6, 2026)

## What Was Completed ✅

### 1. Production Build & Deployment
- ✅ Fixed Vite build error (was transient `#` issue, resolved)
- ✅ Built production APK: `npm run build`
- ✅ Output: `client/android/app/release/app-release.apk`
- ✅ Output: `client/android/app/release/app-release.aab` (AAB for Play Store)
- ✅ Synced Capacitor: `npx cap sync android`

### 2. Static Pages (Privacy & Terms of Service)
- ✅ Created `public/privacy.html` at root level
- ✅ Created `public/tos.html` at root level
- ✅ Updated `server.js` to serve static files with `express.static('public')`
- ✅ Pushed to Railway — both URLs now live:
  - `https://echo-production-c241.up.railway.app/privacy.html`
  - `https://echo-production-c241.up.railway.app/tos.html`

### 3. Firebase & Push Notifications Setup
- ✅ Created Firebase project "Echo"
- ✅ Registered Android app with package name `com.willychili.echo`
- ✅ Downloaded `google-services.json` → placed at:
  ```
  C:\Users\charl\OneDrive\Escritorio\ClaudeCode\echo-app\client\android\app\google-services.json
  ```
- ✅ Firebase Cloud Messaging V1 API enabled
- ✅ Created service account in Firebase Console
- ✅ Added `FIREBASE_SERVICE_ACCOUNT_JSON` env var to Railway
- ✅ Installed `firebase-admin` npm package in server
- ✅ `build.gradle` files already configured to detect `google-services.json`
- ✅ Synced with Capacitor

### 4. Signed APK Generated
- ✅ Created keystore: `C:\Users\charl\OneDrive\Documents\echo-release.keystore`
- ✅ Generated signed AAB: `client/android/app/release/app-release.aab`
- ✅ AAB is ready for Play Store internal testing

---

## Upload Key Issue — RESOLVED ✅

### The Problem (was)
AAB was signed with wrong keystore (`echo-release.keystore` alias `echo-key`, SHA1: `A5:79:DC...`).
Google expected SHA1: `D6:96:0C...` from the upload key reset.

### The Fix
Found the correct keystore at:
```
C:\Users\charl\Documents\Keystore\echo-release-v2.keystore
```
- Alias: `upload`
- SHA1: `D6:96:0C:16:50:6C:E9:DE:4A:52:66:F6:7F:A0:CB:CB:BC:EA:31:43` ✅ MATCHES Google

Fixed `keystore.properties` path from `C:/Users/charl/Documents/echo-release-v2.keystore` to `C:/Users/charl/Documents/Keystore/echo-release-v2.keystore`.

Rebuilt AAB with Gradle: `JAVA_HOME="C:/Program Files/Android/Android Studio/jbr" ./gradlew bundleRelease`

### New AAB Location
```
client/android/app/build/outputs/bundle/release/app-release.aab
```
This AAB is signed with the CORRECT key and ready for Play Store upload after March 7, 11:51 PM UTC.

---

## Next Steps (For New Session)

### AFTER March 7, 11:51 PM UTC
- Upload AAB to Play Store Internal Testing:
  ```
  client/android/app/build/outputs/bundle/release/app-release.aab
  ```
- Test on physical device (install from Play Store internal testing)
- Test push notifications

### Testing Push Notifications (After Upload & Install)
1. Install the new APK from Play Store internal testing
2. Open app → go to Perfil (Profile) → Edit Profile
3. Toggle **Notifications ON**
4. Accept the Android permission prompt
5. The app automatically registers with FCM and saves token to database
6. Test sending notification via server API:
   ```bash
   curl -X POST https://echo-production-c241.up.railway.app/api/push/test \
     -H "Authorization: Bearer <USER_TOKEN>" \
     -H "Content-Type: application/json"
   ```
   Should receive a test notification on device

---

## File Locations (Key Files)

| Item | Path |
|------|------|
| **Keystore (CORRECT)** | `C:\Users\charl\Documents\Keystore\echo-release-v2.keystore` (alias: `upload`, SHA1: `D6:96:0C...`) |
| **Keystore (OLD/WRONG)** | `C:\Users\charl\OneDrive\Documents\echo-release.keystore` (DO NOT USE for Play Store) |
| **Signed AAB** | `client/android/app/build/outputs/bundle/release/app-release.aab` |
| **keystore.properties** | `client/android/keystore.properties` (has correct path now) |
| **google-services.json** | `client/android/app/google-services.json` |
| **Privacy Policy** | `public/privacy.html` |
| **Terms of Service** | `public/tos.html` |
| **Server Static Config** | `server.js` (lines 13, 19) |
| **Firebase Credentials** | Railway env var: `FIREBASE_SERVICE_ACCOUNT_JSON` |

---

## Environment Variables (Railway)

These are already set in Railway deployment:

```
VITE_API_URL=https://echo-production-c241.up.railway.app
FIREBASE_SERVICE_ACCOUNT_JSON=<full JSON from Firebase service account>
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

---

## Client-Side Push Notifications Code

- Hook: `client/src/hooks/usePushNotifications.js` ✅ Already implemented
- Flow:
  1. User toggles notifications in EditProfilePage
  2. Requests permission from Android
  3. Registers with FCM
  4. Gets FCM token
  5. Sends token to backend via `POST /api/profile { fcm_token }`
  6. Server can then send notifications via Firebase Admin SDK

---

## Server-Side Push Notifications

- Route: `server/routes/push.js`
- Test endpoint: `POST /api/push/test` (requires auth)
- Uses Firebase Admin SDK V1 API with `FIREBASE_SERVICE_ACCOUNT_JSON`
- Helper function `sendPushToUser(userId, title, body)` for programmatic sends

---

## Play Store Submission Checklist

- [x] Privacy Policy (public URL)
- [x] Terms of Service (public URL)
- [x] Signed AAB
- [x] Firebase Cloud Messaging configured
- [x] Upload key resolved — correct keystore found and AAB rebuilt
- [ ] Screenshots (user has these already)
- [ ] Feature graphic (user has this already)
- [ ] App icon 512×512 (need to verify generated)
- [ ] Store listing texts (user has these already)

---

## Recent Git Commits

```
cfcd5e6 Add firebase-admin dependency for push notifications
b6eea30 Add static serving for privacy policy and terms of service pages
```

---

## Known Limitations / Warnings

1. ⚠️ **Lottie library warning**: `lottie-web` uses eval() in build — safe but noted in build output
2. ⚠️ **RevenueCat warning**: `Using flatDir should be avoided` — Gradle warning, app still works
3. ⚠️ **Chunk size**: JS bundle is 885KB (warning but functional)
4. ⚠️ **Upload key issue**: Cannot upload to Play Store until this is resolved

---

## Debug Commands

```bash
# Check Railway health
curl https://echo-production-c241.up.railway.app/api/health

# Rebuild client
cd client && npm run build

# Sync Capacitor
cd client && npx cap sync android

# Generate keystore certificate (if needed)
keytool -export -alias echo-key -keystore "C:\Users\charl\OneDrive\Documents\echo-release.keystore" -file echo-cert.pem -rfc
```

---

## Contact Info for Support
- Play Console: https://play.google.com/console
- Firebase Console: https://console.firebase.google.com
- Railway Dashboard: https://railway.app/dashboard
