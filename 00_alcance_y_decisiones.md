# Alcance de la PoC local de OCI Speech realtime

Ejemplo de dictado con resultados parciales y finales. Su propósito es explorar el servicio con texto ficticio y permitir que cada participante use su propia identidad OCI. No acredita precisión para un sector ni uso en producción.

## Arquitectura

La interfaz y el backend Node se ejecutan en el equipo del participante. Al iniciar el dictado, el navegador solicita un token temporal mediante `POST /api/speech/session`; el backend lo obtiene con la API signing key personal. La privada permanece en el backend. El navegador transmite audio directamente a OCI por WSS y recibe texto. No se despliega un servicio de audio propio en la nube.

## Configuración de esta edición

| Parámetro | Valor |
| --- | --- |
| Región | Bogotá, `sa-bogota-1` |
| Modelo y dominio | Oracle ASR, general |
| Idioma | Español, `es-ES` |
| Puntuación | Automática, `AUTO` |
| Silencio parcial/final | 0 / 1.000 ms |
| Estabilidad parcial | `MEDIUM` |
| Duración local máxima | Cinco minutos por sesión |
| Compartimento | OCID autorizado que configura cada participante |

Estos valores son decisiones del ejemplo, no garantías de latencia, disponibilidad regional o precisión. Los permisos efectivos dependen de IAM.

## Configuración personal

Desde la raíz de la app, `.env` selecciona explícitamente `.secrets/oci/config` y el perfil completo `[SPEECH_POC]`. La privada personal se guarda en `.secrets/oci/`; `key_file` contiene su ruta absoluta sin comillas. La app rechaza herencia de DEFAULT, campos desconocidos y passphrases guardadas. Cada participante prepara estos archivos siguiendo la [guía](docs/01_credenciales.md).

## Comportamiento y límites

El servidor escucha solo en loopback y valida Host/Origin para emitir tokens. La interfaz sustituye parciales y consolida finales sin repetir cada actualización. Al detener vacía el último bloque de audio y espera hasta cinco segundos por resultados; si no confirma un final adicional lo advierte. Ese plazo no garantiza recepción completa.

No se guardan automáticamente audio ni texto. Los eventos visibles contienen el texto dictado: revisarlos antes de compartir. No hay reconexión o reenvío automático de audio, servicio multiusuario, despliegue público ni almacenamiento duradero.

## Criterios de revisión

La entrega debe poder instalarse con el lockfile, compilar y pasar pruebas sintéticas sin credenciales. Debe excluir material personal y contener ejemplos coherentes con el parser. La [validación](docs/04_fuentes_y_validacion.md) distingue evidencia local y pruebas reales del participante. Publicación, licencia y controles públicos se revisan antes de distribuir el candidato.
