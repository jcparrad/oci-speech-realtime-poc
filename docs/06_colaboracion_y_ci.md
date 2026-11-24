# Colaboración y CI

## Validación automatizada preparada

El workflow [ci.yml](../.github/workflows/ci.yml) se ejecutará con push, pull request o activación manual en el repositorio que se publique. Usa un runner efímero de GitHub, Ubuntu 24.04 y Node 24. Instala mediante lockfile, comprueba tipos, compila, ejecuta pruebas sintéticas y comprueba que el empaquetador puede generar su entrega por lista explícita.

Este archivo describe configuración preparada; no afirma una ejecución exitosa en GitHub. La [validación limpia local y el escáner dedicado](04_fuentes_y_validacion.md) están registrados por separado. Las pruebas reales de micrófono y OCI corresponden al participante.

## Permisos y dependencias del workflow

El token integrado de GitHub tiene solo `contents: read`; checkout no persiste credenciales. No se configuran secretos OCI, OIDC, despliegues, publicación de paquetes, artefactos de usuario ni runners propios. No se interpola texto de issues o PR en comandos de shell. Las contribuciones se validan con `pull_request`, sin ejecutar su código en contextos privilegiados.

Se fijaron acciones oficiales a SHA completos, contrastados con sus tags públicos el 24 de noviembre de 2026:

| Acción | Referencia |
| --- | --- |
| actions/checkout v7 | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| actions/setup-node v7 | `949feb2413d6458794dcd2491c4babbbce0c15c1` |

Esta edición usa SHA explícitos. GitHub también documenta [workflow dependency lockfiles](https://docs.github.com/en/actions/concepts/security/workflow-dependency-lockfiles); si se adoptan después, deben generarse mediante la herramienta oficial, sin inventar o editar manualmente `actions.lock`. El bloqueo de acciones no fija la imagen del runner, la descarga de Node o todos los demás insumos de compilación.

No se usa caché de npm en este workflow. Se limita el tiempo de ejecución a 15 minutos y se cancelan ejecuciones anteriores del mismo grupo. El archivo [Dependabot](../.github/dependabot.yml) propone revisiones semanales de npm y Actions, sin fusionar cambios automáticamente. Revisar sus PR y repetir comprobaciones antes de aceptarlos.

## Preparación del repositorio público por el mantenedor

Antes del primer push, confirmar titular/licencia y revisar contenido e historial del nuevo repositorio. Después, activar reportes privados de vulnerabilidades y verificar destinatario; activar detección/protección de secretos según disponibilidad y revisar alertas de dependencias. No asumir que detectarán todos los formatos de credenciales OCI.

Configurar la rama principal para impedir force-push y eliminación, y exigir que pase `Node 24 / synthetic tests` cuando ese check exista en GitHub. Elegir revisiones compatibles con el número real de mantenedores; no exigir una aprobación que nadie pueda emitir. Limitar los permisos de Actions a lectura y no permitir que apruebe PR. Revisar y aprobar manualmente ejecuciones de contribuyentes externos según la configuración del repositorio.

Estas son actividades del propietario en GitHub, no cambios realizados por estos archivos. El primer push y la guía de destino/raíz Git se preparan por separado después de validar el candidato.

## Fuentes primarias

- [Uso seguro de Actions](https://docs.github.com/en/actions/reference/security/secure-use).
- [actions/checkout](https://github.com/actions/checkout) y [actions/setup-node](https://github.com/actions/setup-node).
- [Configuración de Dependabot](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference).
- [Habilitar reportes privados](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/configure-vulnerability-reporting/configure-for-a-repository).

Referencias consultadas el 24 de noviembre de 2026. Verificar opciones disponibles al configurar el repositorio.
