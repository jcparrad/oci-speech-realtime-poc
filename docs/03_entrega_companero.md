# Instalación para otro participante

La distribución contiene código y plantillas. Cada participante instala en su equipo y usa sus propias credenciales. No necesita acceso al computador del autor. La explicación del servicio está en [Cómo funciona OCI Speech, con diagramas](08_endpoint_sesiones_y_token.md).

## Instalar desde una copia aprobada

Clona [el repositorio público](https://github.com/jcparrad/oci-speech-realtime-poc) y entra a `oci-speech-realtime-poc/`. También puedes extraer un paquete generado por la herramienta del proyecto. Ambos diseños sitúan `package.json` directamente en la raíz de la app.

Con Node 24.x y npm, ejecuta desde esa raíz:

```sh
npm ci
npm run check
npm run build
npm test
```

`npm ci` usa el bloqueo e instala dependencias públicas; reemplaza las instaladas en esa copia. No requiere config OCI. No necesitas Python para ejecutar la app.

## Probar con tu micrófono

Para dictar, prepara tus archivos siguiendo [credenciales](01_credenciales.md), ejecuta `npm start` y sigue la [prueba manual](02_prueba_manual.md). La puntuación automática está configurada. Usa un texto ficticio y revisa el último fragmento al detener.

## Compartir código y errores

No compartas `.env`, `.secrets/`, `api_keys/`, claves, tokens, capturas de red, grabaciones ni transcripciones personales. No comprimas toda tu carpeta de trabajo. Para generar un paquete selectivo revisable, el mantenedor puede usar Python 3.9 o superior con `python3 scripts/empaquetar.py`; la lista permitida está en `config/archivos_distribucion.json`.

El ZIP y sus hashes se generan en `distribucion_local/`, ignorada. Verifica el SHA-256 contra una referencia recibida por un canal confiable; un hash junto al archivo por sí solo no autentica al remitente. El empaquetador no sustituye la revisión y el escáner previos a publicar.

Si necesitas ayuda, comunica OS, Node, navegador, paso y error saneado. El visor de eventos omite autenticación pero contiene el texto dictado. No pegues resultados personales en issues públicos.
