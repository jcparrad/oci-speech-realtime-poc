# Prueba manual de dictado con OCI Speech

Esta prueba la ejecuta el participante en su equipo y tenant. El agente no usa credenciales ni envía audio a OCI. Los resultados esperados de esta guía son criterios de observación, no resultados ya comprobados.

## Preparación

1. Sigue el [README](../README.md) para instalar y completa tu [configuración personal](01_credenciales.md), incluido el OCID del compartimento y los permisos de archivos.
2. Detén cualquier instancia anterior de esta app con `Ctrl+C` en su terminal. Desde la raíz del proyecto ejecuta `npm run build` y después `npm start`. Si la privada está cifrada, escribe su passphrase cuando la terminal la pida; no aparecerá en pantalla.
3. Abre o recarga `http://127.0.0.1:8000`. Comprueba que muestra **Dictado con OCI**, Bogotá, Oracle ASR, español y puntuación automática. La vista debe permanecer vacía hasta recibir resultados de lo que dictes. La configuración visible todavía no confirma una sesión conectada.
4. Si ves una interfaz antigua o texto prefabricado sin hablar, revisa la terminal, la carpeta y el puerto: no estás usando la instancia actualizada. No continúes esa prueba.

La app usa el compartimento de `.env`; no lo cambia desde la interfaz. El token se solicita al pulsar **Iniciar dictado**, no al abrir la página. Esta prueba consume servicios OCI; no se presupone gratuidad.

## Hablar por el micrófono

Pulsa **Iniciar dictado**, permite el micrófono y espera **Escuchando**. Di una frase nueva elegida por ti para comprobar que aparece lo que acabas de pronunciar. Después puedes leer a ritmo natural, con pausas, este texto de referencia ficticio:

> Buenos días. Vamos a organizar una reunión de trabajo. Será el martes, a las diez de la mañana, en la sala Central. Revisaremos tres propuestas y elegiremos la fecha de la próxima sesión. Deseo revisar el texto antes de terminar.

No dictes los nombres de los signos: la puntuación es automática. No se exige que produzca exactamente las comas o puntos del ejemplo. Compara lo reconocido con lo pronunciado; revisa con atención negaciones, fechas y números. El idioma inicial es `es-ES`; esta PoC no acredita precisión específica para español colombiano.

## Qué observar

| Paso | Resultado esperado |
| --- | --- |
| Hablar una frase | Aparece texto provisional mientras dictas |
| Continuar la misma frase | Se actualiza el provisional sin repetir cada versión en el consolidado |
| Hacer una pausa natural | Se recibe un segmento final y se conserva lo consolidado |
| Dictar varias frases | Se observan signos automáticos en los resultados que genere OCI |
| Pulsar **Detener** al acabar | Se libera la captura, se solicita final y la app espera resultados antes de cerrar |
| Revisar el final | Se conserva el último fragmento recibido; si no hay confirmación adicional, aparece una advertencia |
| Abrir eventos | Se ven los últimos 60 resultados saneados; no mensajes de autenticación |
| Pulsar **Limpiar** en espera | Se vacían texto y eventos de esta vista |

El silencio final se configura en 1.000 ms; no es una garantía de latencia. Después de **Detener**, la espera adicional de cinco segundos tampoco garantiza que todo el audio haya sido reconocido. Revisa el último fragmento. Si queda provisional sin confirmar, la app pide revisarlo y limpiar antes de iniciar otra prueba. No se guarda ni recupera audio.

## Comprobaciones manuales adicionales

Estas comprobaciones son opcionales y corresponden al participante:

- **Micrófono denegado:** deniega el permiso y comprueba que aparece un mensaje para habilitarlo. Después restáuralo en el navegador según sus controles normales.
- **Cancelación:** mientras se prepara una sesión, pulsa **Detener**. Si habías dejado un diálogo de micrófono abierto, ciérralo; al resolverlo la app debe liberar cualquier stream tardío.
- **Conexión interrumpida:** si ocurre un corte de red durante una prueba, comprueba que se detiene la captura y se conserva el texto recibido. No se reenvía audio automáticamente. No necesitas cambiar la red corporativa para provocar este caso.
- **Nueva sesión:** tras un cierre confirmado, vuelve a iniciar; debe conservar el texto final anterior y añadir los nuevos fragmentos una sola vez. La sesión tiene un límite local de cinco minutos.

## Errores frecuentes

| Mensaje o síntoma | Acción del participante |
| --- | --- |
| No se encuentra config o clave | Revisa rutas, nombres y extensión; sigue la guía de credenciales |
| Se requieren permisos 600 | Aplica los permisos de la guía en macOS/Linux; no envíes archivos al agente |
| Fingerprint no corresponde | Comprueba que config y privada pertenecen al mismo par registrado |
| No hay micrófono o no se permite | Revisa el dispositivo y permisos de navegador/OS |
| No admite 16 kHz o AudioWorklet | Prueba Chrome o Edge actuales; no envíes otro formato al mismo endpoint |
| OCI rechaza autorización | Revisa identidad, clave, compartimento y permisos con el administrador |
| Falla el WebSocket | Revisa proxy, firewall y acceso WSS a la región Bogotá; no desactives controles corporativos |
| Esperar cinco segundos para otra sesión | Espera el intervalo antes de pulsar de nuevo |
| Puerto local ocupado | Detén tu servidor anterior o arranca con `npm start -- --port=8001` y abre esa dirección |
| Cierre sin confirmación final | Revisa el último texto; no lo interpretes como garantía de pérdida ni de recepción completa |

Usa localhost o `127.0.0.1`, no un archivo `file://` ni una dirección HTTP remota para abrir la app. El micrófono necesita un contexto permitido por el navegador; consulta la [referencia de getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).

## Evidencia que puedes compartir

Indica modo, versión de Node, navegador/OS, paso que falló y mensaje saneado. Si comparas precisión, anota qué pronunciaste y qué apareció, usando el texto ficticio. No atribuyas un porcentaje de exactitud a los valores de confianza del modelo.

No compartas `.env`, config, privada, passphrase, token, headers de autenticación ni capturas de la pestaña de red. Si compartes eventos de transcripción, revisa antes su texto: el visor omite autenticación, pero contiene lo dictado. Al terminar, detén el servidor con `Ctrl+C`.

Los [resultados de validación local](04_fuentes_y_validacion.md) identifican las comprobaciones ya ejecutadas y los límites de revisión visual, Windows y acceso real.
