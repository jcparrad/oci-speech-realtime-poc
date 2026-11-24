# PoC local de OCI Speech realtime

Interfaz local de dictado en español, Oracle ASR, región Bogotá y puntuación automática. El navegador envía audio directamente a OCI por WebSocket; el backend local obtiene el token usando la API key personal.

## Estado

Copia genérica validada localmente: instalación limpia, tipos, compilación y 15 pruebas sintéticas correctos; auditorías npm sin vulnerabilidades reportadas y escaneo Gitleaks sin hallazgos. Consulta [fecha, alcance y límites](docs/04_fuentes_y_validacion.md). La prueba real con micrófono y OCI corresponde a cada participante.

Las guías de colaboración y la configuración de CI están preparadas. Falta preparar el historial Git independiente, revisar el contenido del primer commit y confirmar el destino antes de publicar. Esta PoC no es un producto oficial ni una evaluación de precisión.

## Instalar y compilar

Requiere Node.js **24.x**, npm y un navegador actual con AudioWorklet, preferiblemente Chrome o Edge. La validación local se ejecutó con Node 24.7.0 y npm 11.6.2 en macOS arm64. Usa una actualización mantenida de Node 24. No se declara compatibilidad comprobada con Windows.

Desde `oci-speech-realtime-poc/`:

```sh
npm ci
npm run check
npm run build
```

La instalación descarga dependencias públicas de npm; la compilación y el control de tipos no leen `.env`, config ni claves y no llaman a OCI. `package-lock.json` fija las dependencias. Si npm informa un problema de permisos en su caché, puedes elegir una carpeta de caché local escribible mediante `npm ci --cache <ruta-de-cache>`; no cambies permisos globales sin revisar el error.

## Ver la demostración sin credenciales

```sh
npm run demo
```

Abre `http://127.0.0.1:8000` y pulsa **Iniciar demostración**. Se reproducirá una secuencia de texto ficticio para comprobar la vista. No se abre el micrófono, no se leen credenciales y no se emiten tokens. El modo queda identificado en pantalla. Detén el servidor con `Ctrl+C`.

## Ejecutar tu prueba con OCI

1. Prepara tus archivos siguiendo la [guía de credenciales](docs/01_credenciales.md): `.env`, config y privada, con permisos de archivo según tu plataforma.
2. Ejecuta `npm start`. Si la privada está cifrada, escribe la passphrase en la terminal: no se muestra ni se guarda. Un config incompleto o inválido impide iniciar.
3. Abre `http://127.0.0.1:8000`, pulsa **Iniciar dictado** y autoriza el micrófono. La llamada a OCI se realiza al iniciar el dictado, no al abrir la página.
4. Dicta texto ficticio y pulsa **Detener**. La captura se detiene, se envía el último bloque y se solicita el resultado final. La app espera cinco segundos antes de cerrar; si no recibe un final adicional o quedan parciales, lo advierte.
5. Revisa el texto consolidado y cualquier provisional. **Limpiar** elimina ambos de la vista; no hay guardado automático. Usa `Ctrl+C` para cerrar el servidor.

**Iniciar dictado** conserva los finales de las pruebas previas en la vista. Si quedaron parciales sin confirmar, primero debes revisarlos y limpiar. El contador de segmentos corresponde a la sesión actual. Cada sesión se limita a cinco minutos; no se reconecta ni reenvía audio automáticamente.

Si el puerto está ocupado puedes usar, por ejemplo, `npm run demo -- --port=8001` o `npm start -- --port=8001`. El servidor sigue escuchando solo en `127.0.0.1`. No abras el HTML mediante `file://` ni cambies el host a una dirección de red para compartir esta PoC.

## Validar localmente

```sh
npm test
```

Las pruebas usan datos sintéticos y servidores efímeros en loopback. Cubren formato de audio, configuración, desbloqueo de una clave de prueba generada solo en memoria, consolidación de parciales/finales, contrato WebSocket simulado y controles del emisor. No leen tus archivos privados ni solicitan tokens reales.

## Documentación

- [Alcance y criterios de aceptación](00_alcance_y_decisiones.md).
- [Guía de API key y config por participante](docs/01_credenciales.md).
- [Prueba manual con OCI y resultados esperados](docs/02_prueba_manual.md).
- [Instalación y entrega al compañero](docs/03_entrega_companero.md).
- [Fuentes y validaciones locales](docs/04_fuentes_y_validacion.md).
- [Colaboración y CI](docs/06_colaboracion_y_ci.md).
- [Publicación en GitHub y entrega](docs/07_publicar_en_github.md).
- [Endpoint, sesiones simultáneas y token temporal](docs/08_endpoint_sesiones_y_token.md).
- [Seguridad y reporte privado](SECURITY.md), [contribuciones](CONTRIBUTING.md) y [avisos de terceros](THIRD_PARTY_NOTICES.md).
- [Ejemplo de configuración de la app](.env.example) y [ejemplo de config OCI](config/oci-config.example).

## Generar el paquete para compartir

El autor puede regenerarlo con Python 3.9 o superior; el compañero solo necesita Node 24 para ejecutar la app:

```sh
python3 scripts/empaquetar.py
```

El ZIP, su SHA-256 y un inventario se escriben en `distribucion_local/`, ignorada por Git. El script usa la [lista permitida](config/archivos_distribucion.json), no recorre carpetas privadas y excluye dependencias instaladas, build, config real y resultados. Revisa las [instrucciones de entrega](docs/03_entrega_companero.md) antes de compartir.

## Credenciales

Cada participante prepara su propio `config` y clave privada en `.secrets/oci/`, excluidos del repositorio y del paquete compartido. La app usa el perfil `SPEECH_POC`. No hay que descargar ni copiar tokens de Speech: el backend los solicita al iniciar el dictado.

La creación de credenciales, revisión de permisos y prueba real son actividad del usuario. El agente solo prepara archivos y realiza validaciones locales sin acceder al tenant.

## Colaboración, licencia y publicación

El código propio se distribuye bajo la [licencia MIT](LICENSE), con aviso `Copyright (c) 2026 Juan Parra`. Las dependencias conservan sus licencias y [avisos de terceros](THIRD_PARTY_NOTICES.md). La validación local está registrada; la revisión del historial nuevo se realiza antes de publicar.

La [CI preparada](.github/workflows/ci.yml) comprueba fuentes y pruebas sintéticas, sin credenciales OCI. [Dependabot](.github/dependabot.yml) propone actualizaciones revisables; no hay auto-merge ni despliegues. Su ejecución real en GitHub no se ha verificado.

Antes de publicar, completar la revisión de secretos de carpeta e historial independiente y habilitar el canal privado descrito en [SECURITY.md](SECURITY.md). No adjuntar config, tokens o transcripciones personales a issues públicos. El campo `private: true` de `package.json` evita publicar accidentalmente en npm; no controla la visibilidad de GitHub.
