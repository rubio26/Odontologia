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

3. **Compilar la App**:
   Ejecuta:
   ```bash
   bubblewrap build
   ```
   Esto generará un archivo `.aab` (para la Play Store) y un archivo `.apk` (para probar en tu teléfono).

4. **Vincular con el Dominio (Asset Links)**:
   Bubblewrap generará un archivo llamado `assetlinks.json`. Debes subirlo a tu servidor en esta ruta:
   `https://odontologia-eight.vercel.app/.well-known/assetlinks.json`

¡Y listo! Con esto tu app se verá profesional y sin la barra del navegador. ✨🚀
