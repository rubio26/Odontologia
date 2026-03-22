# Guía de Publicación en Play Store (Bubblewrap)

Esta guía te ayudará a generar tu aplicación de Android para **Lumini Studio** sin necesidad de usar Android Studio.

### Requisitos Previos
1. Tener **Node.js** instalado.
2. Tener **Java (JDK 17)** instalado.

### Pasos para Generar la App

1. **Instalar Bubblewrap**:
   Abre una terminal y ejecuta:
   ```bash
   npm install -g @bubblewrap/cli
   ```

2. **Generar el Proyecto Android**:
   En la carpeta de tu proyecto (`Odontologia`), ejecuta:
   ```bash
   bubblewrap init --manifest https://odontologia-eight.vercel.app/manifest.webmanifest
   ```
   *Nota: Como ya te dejé el archivo `twa-manifest.json` configurado, solo tendrás que confirmar los datos.*

## 🔑 Signing Configuration (IMPORTANT)

I've generated a signing key for you. You will need these details to build the app again if you make changes in the future:

- **Keystore Location**: `C:\keys\android.keystore`
- **Key Alias**: `android`
- **Keystore/Key Password**: `lumini123`

> [!IMPORTANT]
> Keep the `C:\keys\android.keystore` file safe! If you lose it, you won't be able to update your app on the Play Store.

## 📦 Generated Assets

The following files are ready for you:

1. **App Bundle (.aab)**: `c:\Users\carlo\.antigravity\Sofware Odonto\Odontologia\app-release-bundle.aab`
   - Use this file to upload to the Google Play Console.
2. **APK (.apk)**: `c:\Users\carlo\.antigravity\Sofware Odonto\Odontologia\app-release-signed.apk`
   - Use this to test the app on your Android device manually.

## 🔗 Digital Asset Links (Verification)

Google requires a verification file on your website to "prove" you own the domain.
I have created the following file:

- **Location**: `public/.well-known/assetlinks.json`
- **SHA256 Fingerprint**: `62:C8:45:C4:B3:A3:05:D5:5E:DE:0B:EC:5F:E5:8B:E7:22:74:4C:37:0B:EA:55:34:CD:46:83:98:8C:C5:EF:A9`

**Action Required**:
Deploy your PWA to Vercel/GitHub. The file must be accessible at:
`https://odontologia-eight.vercel.app/.well-known/assetlinks.json`

¡Y listo! Con esto tu app se verá profesional y sin la barra del navegador. ✨🚀
