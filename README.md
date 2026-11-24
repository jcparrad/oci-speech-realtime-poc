# PoC local de OCI Speech realtime

Aplicación local para convertir tu voz en texto con OCI Speech: micrófono, resultados mientras hablas y puntuación automática, usando Oracle ASR en la región Bogotá.

**[Cómo funciona OCI Speech: explicación con diagramas](docs/08_endpoint_sesiones_y_token.md)**

Entiende el endpoint, el token temporal, el recorrido del audio y las sesiones simultáneas.

## Inicio rápido

Necesitas **Node.js 24.x**, npm, Git, micrófono, un navegador con AudioWorklet como Chrome o Edge y acceso autorizado a OCI Speech.

```sh
git clone https://github.com/jcparrad/oci-speech-realtime-poc.git
cd oci-speech-realtime-poc
npm ci
```

1. Prepara tu config y `.env` siguiendo la [guía de credenciales](docs/01_credenciales.md). Si ya tienes una configuración dedicada a esta PoC, indica su ruta y perfil en el `.env` local.
2. Compila e inicia desde la raíz del proyecto:

   ```sh
   npm run build
   npm start
   ```

3. Abre **http://127.0.0.1:8000**, pulsa **Iniciar dictado**, permite el micrófono y espera **Escuchando** para hablar.
4. Pulsa **Detener** al terminar y revisa el texto recibido. Cierra el servidor con `Ctrl+C` en la terminal.

El audio se envía a OCI para transcribirlo; la app no guarda automáticamente audio ni texto. El token temporal se solicita al iniciar el dictado. La página vacía o la configuración visible no confirman una conexión activa con OCI.

Cada participante usa sus propias credenciales. No compartas claves privadas, config personal, `.env` ni tokens. Usa contenido ficticio al hablar durante la prueba.

## Ayuda

- [Prueba paso a paso y errores frecuentes](docs/02_prueba_manual.md).
- [Instalación para otro participante](docs/03_entrega_companero.md).
- [Contribuir al proyecto](CONTRIBUTING.md).
- [Reportar un problema de seguridad](SECURITY.md).

Licencia [MIT](LICENSE) · Juan Parra. Las dependencias conservan sus [avisos de terceros](THIRD_PARTY_NOTICES.md).
