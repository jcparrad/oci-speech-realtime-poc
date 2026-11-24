# Fuentes y estado de validación

Actualización del 24 de noviembre de 2026: se ha retirado la simulación del flujo de uso y el perfil se selecciona explícitamente desde el `.env` local. La corrección superó las comprobaciones locales indicadas abajo; la evidencia histórica se conserva en una sección separada. El agente no utilizó credenciales ni audio reales; la confirmación funcional del participante se registra por separado.

## Estado de preparación

El proyecto tiene [repositorio público](https://github.com/jcparrad/oci-speech-realtime-poc), licencia [MIT](../LICENSE) y Juan Parra como titular del código propio. No se ha comprobado aquí el estado actual de las ejecuciones de CI ni de la configuración de seguridad de GitHub.

Los avisos originales de las seis dependencias directas se preservaron desde paquetes instalados de las mismas versiones del lockfile. El inventario incluye 79 entradas, contando variantes opcionales. Los metadatos no certifican por sí solos el cumplimiento de licencias; véase [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md).

La preparación inicial verificó estructura, enlaces, ejemplos, exclusiones con rutas ficticias y aceptación/rechazo del perfil mediante datos sintéticos. Esas comprobaciones acotadas no sustituyen la validación completa ni acreditan conexión real.

## Fuentes primarias

- [Oracle: claves y OCIDs](https://docs.oracle.com/en-us/iaas/Content/API/Concepts/apisigningkey.htm): registro de pública y configuración por participante.
- [Oracle: configuración SDK/CLI](https://docs.oracle.com/en-us/iaas/Content/API/Concepts/sdkconfig.htm): campos, perfiles y passphrase en ejecución. La exigencia de perfil completo único es propia de esta PoC.
- [SDK web de Speech](https://github.com/oracle/oci-ai-speech-realtime-web-sdk): contrato y ejemplo de flujo con token y WebSocket.
- [GitHub: exclusiones](https://docs.github.com/en/get-started/git-basics/ignoring-files): reglas compartidas; no retiran archivos ya versionados.
- [npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci/): instalación mediante bloqueo.
- [Python zipfile](https://docs.python.org/3/library/zipfile.html): creación y verificación de ZIP.
- [GitHub: seguridad de Actions](https://docs.github.com/en/actions/reference/security/secure-use): permisos mínimos y ejecución de contribuciones sin privilegios.
- [GitHub: Dependabot](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference): actualizaciones programadas de npm y Actions.
- [GitHub: reporte privado](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/configure-vulnerability-reporting/configure-for-a-repository): activación por el administrador antes de publicar.
- [GitHub: licenciar un repositorio](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository): separar visibilidad pública y licencia de reutilización.

Las versiones efectivas están en `package.json` y `package-lock.json`. Antes de distribuir se revalidarán las fuentes que afecten decisiones o funciones que puedan cambiar.

## Decisiones técnicas

El navegador usa WebSocket nativo y AudioWorklet con tipos/enums públicos del SDK. El audio es PCM16 little endian, mono, 16 kHz, sin cabecera WAV, con bloques de 100 ms. La app verifica frecuencia efectiva y vacía la fracción final antes de solicitar resultado final. Espera cinco segundos al detener y advierte cuando no confirma cierre adicional.

El backend exige un perfil completo único cuyo nombre coincida con `OCI_CONFIG_PROFILE`, y rutas explícitas; no hereda DEFAULT ni guarda passphrases. Escucha en loopback y protege la emisión de tokens con Host/Origin. El token es temporal y se entrega al navegador para la conexión directa. No se guardan automáticamente audio ni texto.

## Validación local de la corrección

El 24 de noviembre de 2026 se creó una copia temporal exclusivamente con los 62 archivos de la lista de distribución, sin credenciales personales. En macOS arm64, Node 24.7.0 y npm 11.6.2:

- Instalación limpia desde el lockfile, tipos y compilación correctos; **20 tests automatizados aprobados**. Se verifican el orden micrófono–token–conexión, el rechazo de configuración incompatible, errores de autorización y micrófono, selección explícita del perfil, PCM y resultados parciales/finales. Los dobles se limitan a los tests; no existe un modo simulado de la app.
- La CLI compilada rechaza argumentos obsoletos o desconocidos antes de cargar configuración. La compilación local se regeneró también en la copia de trabajo.
- Gitleaks con redacción completa: sin hallazgos en los archivos seleccionados y en los cuatro commits existentes del historial público independiente. Las reglas incluyen identificadores OCI personales y fingerprints literales. No se abrieron archivos privados ni se verificaron credenciales contra proveedores.
- Auditorías npm completa y de producción: cero vulnerabilidades reportadas. Este resultado depende de los avisos conocidos por el registro en ese momento.
- Doce documentos propios con un H1 y 58 enlaces locales resueltos; inventario sin archivos ausentes ni duplicados. Los avisos de terceros se conservan sin imponerles el formato de los documentos propios.

Esta validación es local. No acredita el permiso real del micrófono, la autenticación de una identidad ni una transcripción obtenida de OCI; esas comprobaciones corresponden al participante siguiendo la [prueba manual](02_prueba_manual.md). No se presenta como una demostración real realizada por el agente.

## Prueba manual reportada por el participante

El 24 de noviembre de 2026 el participante confirmó que el dictado real funciona en su equipo, después de ajustar su configuración local y el perfil seleccionado. Esta es una confirmación funcional reportada; no es una medición de precisión o latencia ni una certificación para otros entornos. No se incorporan credenciales, identificadores personales, grabaciones ni transcripciones de esa sesión.

## Evidencia histórica anterior a esta corrección

La siguiente validación se realizó sobre la edición inicial, anterior a la retirada de la simulación. No acredita las modificaciones actuales.

Validación del 24 de noviembre de 2026 en macOS arm64, Node 24.7.0 y npm 11.6.2, sobre una copia temporal nueva con espacios en la ruta, creada exclusivamente desde la lista permitida. Sin `.env`, config real ni clave privada; la configuración npm de la prueba fue vacía y el registro público explícito.

- `npm ci`: 54 paquetes instalados desde el lockfile; tipos y compilación correctos.
- `npm test`: 15 pruebas sintéticas correctas. Cubren PCM, parciales/finales, cancelación, perfil y clave efímera en memoria, modo demo y restricciones del emisor local.
- `npm audit --json` y `npm audit --json --omit=dev`: cero vulnerabilidades reportadas en ambas consultas. La auditoría consulta metadatos de paquetes al registro público; no certifica el código propio ni descarta vulnerabilidades desconocidas.
- Gitleaks CLI 8.30.1: sin hallazgos sobre las fuentes seleccionadas, con reglas estándar extendidas para OCIDs personales largos y fingerprints literales; informes con redacción total. Escaneo local sin validar credenciales contra proveedores. No se escanearon archivos personales del equipo.
- Los 11 textos de licencia/avisos de dependencias directas coinciden byte a byte con los de la instalación limpia. El inventario de versiones y licencias declaradas concuerda con el lockfile.
- La demo compilada sirve HTML, configuración y assets en loopback. No inicializa un emisor OCI; las pruebas verifican que rechaza emitir tokens y servir rutas privadas. Esto no es una revisión visual en navegador.
- El empaquetador genera la raíz genérica por lista explícita; se verifican CRC, hashes del manifiesto y ausencia de material/contexto privado. El hash externo del ZIP aporta integridad respecto de una referencia confiable, no autenticidad por sí solo.

En la preparación inicial no se había creado el historial independiente. Esa observación histórica no describe el estado actual del repositorio público ni acredita el escaneo de los cambios actuales. El historial del proyecto privado no forma parte de la entrega.

La [prueba real](02_prueba_manual.md) corresponde al participante. No se afirma precisión, latencia, compatibilidad Windows, funcionamiento visual ni acceso de una identidad OCI hasta obtener evidencia apropiada. La corrección cuenta con validación local y confirmación funcional del participante, con los alcances descritos arriba.

Referencias de herramientas: [Gitleaks](https://github.com/gitleaks/gitleaks) y [npm audit](https://docs.npmjs.com/cli/v11/commands/npm-audit/), consultadas el 24 de noviembre de 2026. Un resultado sin hallazgos no garantiza ausencia absoluta de secretos o vulnerabilidades.
