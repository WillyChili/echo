# Echo — Next Steps (Play Store)

## Estado actual del proyecto
- ✅ Capacitor v8 instalado y proyecto Android generado en `client/android/`
- ✅ `appId`: `com.willychili.echo`
- ✅ `targetSdkVersion 36` (Play Store exige 34+)
- ✅ `minSdkVersion 24` (~94% de dispositivos)
- ✅ Permisos: INTERNET, RECORD_AUDIO, MODIFY_AUDIO_SETTINGS
- ⚠️ `capacitor.config.json` tiene URL de dev server → sacar para producción

---

## Fase 1 — Terminar diseño ← ESTÁS ACÁ
Iterar todo en browser. Es mucho más rápido que en mobile.

---

## Fase 2 — Deploys

### Backend → Railway
1. Ir a railway.app, conectar repo
2. Configurar variables de entorno:
   ```
   SUPABASE_URL=...
   SUPABASE_SERVICE_KEY=...
   ANTHROPIC_API_KEY=...
   PORT=3000
   ```
3. Root directory: `server/`
4. Copiar la URL pública que genera Railway (ej: `https://echo-api.railway.app`)

### Frontend → Vercel
1. Ir a vercel.com, conectar repo
2. Root directory: `client/`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Variable de entorno:
   ```
   VITE_API_URL=https://echo-api.railway.app
   ```

### Actualizar `client/capacitor.config.json`
Sacar el bloque `server` entero. Debe quedar así:
```json
{
  "appId": "com.willychili.echo",
  "appName": "Echo",
  "webDir": "dist"
}
```

---

## Fase 3 — Assets mobile

Necesitás dos imágenes:
- `icon.png` — 1024×1024px (ícono de la app)
- `splash.png` — 2732×2732px (splash screen)

Ponerlas en `client/assets/` y correr:
```bash
cd client
npm install @capacitor/assets --save-dev
npx capacitor-assets generate --android
```

---

## Fase 4 — Build de producción

### 1. Build del frontend y sync con Android
```bash
cd client
npm run build
npx cap sync android
```

### 2. Generar keystore de firma (una sola vez — guardarlo en lugar seguro)
```bash
keytool -genkey -v -keystore echo-release.keystore \
  -alias echo -keyalg RSA -keysize 2048 -validity 10000
```
> ⚠️ Si perdés este archivo no podés publicar actualizaciones. Guardarlo fuera del repo.

### 3. Configurar firma en `client/android/app/build.gradle`
```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('../../echo-release.keystore')
            storePassword 'TU_PASSWORD'
            keyAlias 'echo'
            keyPassword 'TU_PASSWORD'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
        }
    }
}
```

### 4. Generar AAB firmado
En Android Studio: **Build → Generate Signed Bundle/APK → Android App Bundle**

---

## Fase 5 — Google Play Store

1. Crear cuenta en https://play.google.com/console ($25 one-time)
2. Crear nueva app → subir el AAB
3. Completar store listing:
   - Ícono 512×512px
   - 2 a 8 screenshots del celular
   - Descripción corta (80 caracteres)
   - Descripción larga
4. **Privacy Policy obligatoria** (la app tiene login + datos de usuario)
   - Generador gratuito: https://www.privacypolicygenerator.info
   - Hostearlo en Vercel o en una página simple
5. Elegir países de distribución
6. Submit → review tarda 1-3 días hábiles

---

## Checklist antes de submit
- [ ] Backend deployado en Railway
- [ ] Frontend deployado en Vercel con VITE_API_URL correcto
- [ ] `capacitor.config.json` sin bloque `server`
- [ ] Íconos y splash screen generados
- [ ] Keystore generado y guardado de forma segura
- [ ] AAB firmado generado
- [ ] Privacy Policy hosteada y con URL pública
- [ ] Screenshots tomados en dispositivo real o emulador
- [ ] Store listing completo
