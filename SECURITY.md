# Seguridad

## Alcance

Esta PoC está diseñada para ejecutarse por una persona en su equipo, escuchando solo en `127.0.0.1`. No se ofrece un servicio público ni una garantía de soporte o de aptitud para producción. No hay versiones con mantenimiento de seguridad comprometido; revisa los avisos antes de usar una copia antigua.

## Reportar una vulnerabilidad

En el futuro repositorio publicado, utiliza **Security → Report a vulnerability** cuando el mantenedor haya habilitado los reportes privados. Antes de publicar se deberá verificar que ese canal funciona y tiene un responsable. Este archivo no activa la función en GitHub y esta copia todavía no tiene un canal operativo confirmado.

Si la opción no aparece, solicita al mantenedor un canal privado mediante un mensaje público que no contenga detalles técnicos sensibles. No publiques una explotación, credenciales, configuración ni datos personales para pedir contacto. Consulta la [guía de reportes privados de GitHub](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/configure-vulnerability-reporting/configure-for-a-repository).

En el reporte privado incluye versión/commit, entorno, pasos mínimos con datos sintéticos, impacto observado y solución propuesta si existe. No adjuntes material real ni pruebes contra tenants, servicios o datos de terceros. No se promete un plazo de respuesta hasta que el mantenedor defina su capacidad de atención.

## Credenciales y datos

Cada participante utiliza su propia API signing key y su config local. No subas `.env`, `.secrets/`, `api_keys/`, claves privadas, passphrases, tokens, firmas, headers de autenticación ni capturas de red. Tampoco subas grabaciones, logs o transcripciones personales. Las plantillas contienen placeholders; no las reemplaces por tus datos al contribuir.

Las exclusiones de Git ayudan a evitar incorporaciones accidentales; no protegen archivos ya versionados, ZIP manuales ni copias externas. El visor de resultados contiene lo dictado aunque omita autenticación.

Si se expone una credencial, detén su distribución y gestiona revocación/sustitución con el titular. Borrar el archivo o reescribir el historial no recupera clones y forks existentes. Sigue las [instrucciones de GitHub para datos sensibles](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository).

## Límites de ejecución

No expongas el backend local en una IP pública, túnel o runner propio conectado a tu tenant. No añadas credenciales OCI a GitHub Actions: la CI solo instala, compila y prueba con datos sintéticos. No desactives TLS, controles corporativos o validaciones de Host/Origin para resolver una conexión.

Antes de publicar una versión, revisar dependencias, ejecutar escáner dedicado de carpeta e historial, validar el paquete y comprobar los permisos del repositorio. Un escáner sin hallazgos no garantiza ausencia de vulnerabilidades.
