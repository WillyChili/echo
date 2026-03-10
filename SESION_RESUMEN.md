# Echo App — Resumen de Sesión de Desarrollo

## Fecha: Marzo 2026
## Developer: WillyChili (Charly)

---

## ¿Qué es Echo?
App de **voice journaling con AI companion**. El usuario graba notas de voz, la app las transcribe y guarda. También tiene un chat con una IA (Echo) que recuerda las entradas del diario y actúa como compañero.

**Modelo de negocio:** Freemium + Suscripción Pro (via Google Play Billing)

---

## Stack Tecnológico

| Parte | Tecnología |
|-------|-----------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Express.js (`server.js`) |
| Base de datos / Auth | Supabase |
| AI | Anthropic Claude API |
| Email | Resend (digest emails) |
| Notificaciones push | Web Push API |
| Mobile packaging | Capacitor v8 |
| Backend hosting | Railway |
| Frontend hosting | Vercel |

---

## Repositorio
- **GitHub:** https://github.com/WillyChili/echo.git
- **Proyecto local:** `C:\Users\charl\OneDrive\Escritorio\ClaudeCode\echo-app`

---

## URLs en Producción
- **Frontend (Vercel):** (ver Vercel dashboard — dominio .vercel.app)
- **Backend (Railway):** (ver Railway dashboard)
- **Política de privacidad:** `[vercel-url]/privacy.html`
- **Borrar cuenta:** `[vercel-url]/delete-account.html`

---

## Variables de Entorno

### Railway (Backend)
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
RESEND_API_KEY=
PORT= (Railway lo inyecta automáticamente, NO agregar manualmente)
```

### Vercel (Frontend)
```
VITE_API_URL=https://[tu-url-railway]
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_REVENUECAT_API_KEY=test_saRmVunoRuVHLuBFMQQVblsmLrL
```

### RevenueCat
```
API Key (test): test_saRmVunoRuVHLuBFMQQVblsmLrL
Package name: com.willychili.echo
Entitlement: pro
Product ID: echo_pro_monthly
```

---

## Estructura del Proyecto

```
echo-app/
├── server.js               # Backend Express
├── package.json            # Script "start": "node server.js" para Railway
├── client/
│   ├── src/
│   │   ├── lib/api.js      # Usa VITE_API_URL
│   │   ├── lib/supabase.js # Usa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
│   │   ├── components/Nav.jsx
│   │   └── pages/TodayPage.jsx
│   ├── assets/
│   │   └── icon.png        # Ícono oficial de la app
│   ├── public/
│   │   ├── privacy.html    # Política de privacidad
│   │   └── delete-account.html
│   └── android/
│       └── app/release/app-release.aab  # AAB firmado listo para subir
```

---

## Ícono de la App
- **Diseño:** Anillos de sonar concéntricos (mint green) sobre fondo oscuro
- **Colores:** Gradiente `#0D8459` → `#7FFFD4` (mint green)
- **Fondo:** `#060c0a` (casi negro)
- **Archivos:** `client/assets/icon.png` + `client/assets/icon.svg`
- **Mint green principal:** `#3eb489` / `#7fffd4`

---

## Android Build

### Keystore (guardar estos datos de forma segura)
- **Archivo:** `echo-release.keystore` (en Documents)
- **Alias:** (el que usaste al crear)
- ⚠️ **NUNCA perder este archivo** — es necesario para todas las actualizaciones futuras

### AAB generado
- **Path:** `client/android/app/release/app-release.aab`
- **Versión:** 1 (1.0)
- Generado con Android Studio → Build → Generate Signed App Bundle

### Comandos útiles
```bash
# Sync cambios al proyecto Android
npx cap sync android

# Abrir Android Studio
npx cap open android
```

---

## Google Play Store

### Estado actual
- ✅ Cuenta de developer creada ($25 pagados)
- ✅ Store listing completado (descripción, categoría, screenshots, feature graphic)
- ✅ Data safety completado
- ✅ Privacy policy URL configurada
- ✅ Delete account URL configurada
- ✅ Documentos de identidad subidos
- ⏳ **Google verificando identidad** (1-3 días hábiles)
- ⏳ Verificar número de teléfono (disponible tras aprobación de identidad)
- ❌ AAB todavía no subido (bloqueado por verificación)

### Próximos pasos en Play Console
1. Esperar email de Google con aprobación de identidad
2. Verificar número de teléfono
3. Subir AAB a **Internal Testing**
4. Configurar **Closed Testing** con mínimo 12 testers por 14 días
5. Aplicar a **Production**

### Información del listing
- **Nombre:** Echo
- **Categoría:** Health & Fitness (o similar)
- **Modelo:** Freemium + suscripción Pro

---

## Supabase
- **Nota importante:** Se deshabilitó "Confirm email" (verificación de email) en Supabase Authentication Settings porque:
  - Free tier tiene límite de 2 emails/hora
  - Resend no tiene dominio custom configurado aún
- **Para re-habilitar:** Configurar dominio custom en Resend → volver a activar confirmación

---

## Problemas Resueltos

| Problema | Solución |
|----------|---------|
| Railway crash: `supabaseUrl is required` | Agregar variables de entorno en Railway Variables tab |
| Railway push rechazado | `git pull --rebase origin main` luego push |
| Vercel pantalla negra | Agregar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Vercel |
| VITE_API_URL sin https:// | Agregar `https://` al principio de la URL |
| icon.png vs Icon.png | Renombrar con `mv` (case sensitive en Linux/Railway) |
| Email verification no funciona | Deshabilitar "Confirm email" en Supabase temporalmente |
| Release notes error en Play Console | Wrappear en `<en-US>...</en-US>` |

---

## Pendiente / Próximas Tareas

- [ ] Esperar verificación de identidad de Google Play
- [ ] Subir AAB a Internal Testing
- [ ] 12 testers × 14 días en Closed Testing
- [ ] **Integrar Google Play Billing** para suscripción Pro
- [ ] Configurar dominio custom en Resend para re-habilitar email verification
- [ ] Mejorar responsive design en web (el nav se corta en algunos viewports)

---

## Comandos Git Útiles
```bash
# Ver estado
git status

# Commit y push
git add -A
git commit -m "descripción"
git push origin main

# Si Railway/Vercel no deployaron automáticamente
# → ir al dashboard y hacer deploy manual
```

---

*Última actualización: Marzo 2026*
