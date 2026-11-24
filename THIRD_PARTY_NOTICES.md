# Avisos de software de terceros

Esta PoC depende de software de terceros fijado mediante `package-lock.json`. Las licencias que siguen corresponden a esas dependencias. El código propio está bajo la [licencia MIT](LICENSE), con aviso `Copyright (c) 2026 Juan Parra`; esa elección no reemplaza las licencias ni los avisos de las dependencias.

## Dependencias directas

Se conservaron sin cambios los textos de licencia y avisos que acompañan a las versiones indicadas. Los metadatos `license` del lockfile son declaraciones del paquete; se contrastaron con los textos de las dependencias directas instaladas de las mismas versiones. `UPL` en el SDK web identifica el texto UPL versión 1.0 incluido por su autor.

| Paquete | Versión | Licencia declarada | Textos originales |
| --- | --- | --- | --- |
| `@oracle/oci-ai-speech-realtime-web` | 2.2.0 | `UPL` | [LICENSE.txt](third_party/oracle__oci-ai-speech-realtime-web/LICENSE.txt) |
| `oci-aispeech` | 2.147.0 | `(UPL-1.0 OR Apache-2.0)` | [LICENSE.txt](third_party/oci-aispeech/LICENSE.txt), [NOTICE.txt](third_party/oci-aispeech/NOTICE.txt), [THIRD_PARTY_LICENSES.txt](third_party/oci-aispeech/THIRD_PARTY_LICENSES.txt) |
| `oci-common` | 2.147.0 | `(UPL-1.0 OR Apache-2.0)` | [LICENSE.txt](third_party/oci-common/LICENSE.txt), [NOTICE.txt](third_party/oci-common/NOTICE.txt), [THIRD_PARTY_LICENSES.txt](third_party/oci-common/THIRD_PARTY_LICENSES.txt) |
| `@types/node` | 24.0.0 | `MIT` | [LICENSE](third_party/types__node/LICENSE) |
| `esbuild` | 0.28.2 | `MIT` | [LICENSE.md](third_party/esbuild/LICENSE.md) |
| `typescript` | 5.9.3 | `Apache-2.0` | [LICENSE.txt](third_party/typescript/LICENSE.txt), [ThirdPartyNoticeText.txt](third_party/typescript/ThirdPartyNoticeText.txt) |

## Dependencias transitivas y distribución

El [inventario de licencias](config/dependencias_licencias.json) enumera todas las entradas de paquetes del lockfile, incluidas variantes opcionales por plataforma, junto con sus versiones, origen y licencia declarada. También registra hashes de los avisos directos conservados. No equivale a una auditoría legal ni a un SBOM completo; no todas las variantes opcionales se instalan en cada equipo.

`npm ci` obtiene los paquetes originales con sus avisos. Esta distribución comparte fuentes, plantillas y avisos; excluye `node_modules/` y `dist/`. Antes de redistribuir una compilación o dependencias vendorizadas, revisar las licencias y avisos de todo el contenido efectivamente incluido, además de conservar las atribuciones y comentarios legales del bundler. No asumir que el presente inventario cubre otra versión o un binario distinto.

Los SDK OCI incluyen sus propios avisos de terceros en los archivos enlazados. El paquete TypeScript incluye también su `ThirdPartyNoticeText.txt`. Los nombres de productos se usan como referencia técnica y no implican respaldo oficial.

## Actualizaciones

Al cambiar dependencias, revisar los nuevos textos y regenerar el inventario a partir del lockfile aceptado, sin eliminar avisos originales. La validación del candidato debe comprobar versiones, hashes y correspondencia con la instalación limpia. Mantener los archivos de `third_party/` en la lista de distribución.

Las reglas de `.gitattributes` conservan los bytes originales de `third_party/`, incluidos saltos de línea y espacios de sus autores. Solo esos textos originales quedan fuera del control de espacios de Git; el código y la documentación propios mantienen la revisión normal.
