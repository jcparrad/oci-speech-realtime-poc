# PoC local de OCI Speech realtime

Aplicación local para convertir voz en texto con OCI Speech. Incluye dictado en español, resultados mientras hablas y puntuación automática, usando Oracle ASR en la región Bogotá.

**[Cómo funciona OCI Speech: explicación con diagramas](docs/08_endpoint_sesiones_y_token.md)**

Entiende el endpoint, el token temporal, el recorrido del audio y las sesiones simultáneas.

## Inicio rápido

Necesitas **Node.js 24.x**, npm, Git y un navegador con AudioWorklet, como Chrome o Edge. Para el dictado real también necesitas micrófono y acceso autorizado a OCI Speech.

```sh
git clone https://github.com/jcparrad/oci-speech-realtime-poc.git
cd oci-speech-realtime-poc
npm ci
npm run build
```

Después elige uno de los siguientes modos. Abre la interfaz en **http://127.0.0.1:8000** cuando el servidor esté iniciado. Para detenerlo o cambiar de modo, usa `Ctrl+C` en la terminal.

## Demo sin credenciales

```sh
npm run demo
```

Pulsa **Iniciar demostración**. Verás un texto ficticio; este modo no utiliza el micrófono ni conecta con OCI.

## Dictar con OCI

1. Sigue la [guía de credenciales](docs/01_credenciales.md) para preparar tu API key, config y `.env` personales.
2. Ejecuta `npm start` desde la carpeta del proyecto.
3. En la interfaz, pulsa **Iniciar dictado**, permite el micrófono y habla. Pulsa **Detener** al terminar y revisa el texto recibido.

Usa un texto ficticio para probar. En este modo el audio se envía a OCI para transcribirlo; la app no guarda automáticamente el audio ni el texto. El token temporal se solicita automáticamente al iniciar el dictado.

Cada participante usa sus propias credenciales. No compartas claves privadas, config personal, `.env` ni tokens.

## Ayuda

- [Prueba paso a paso y errores frecuentes](docs/02_prueba_manual.md).
- [Contribuir al proyecto](CONTRIBUTING.md).
- [Reportar un problema de seguridad](SECURITY.md).

Licencia [MIT](LICENSE) · Juan Parra. Las dependencias conservan sus [avisos de terceros](THIRD_PARTY_NOTICES.md).
