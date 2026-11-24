# Contribuir

## Preparación

Lee el [README](README.md), el [alcance](00_alcance_y_decisiones.md), la [licencia MIT](LICENSE) y la [política de seguridad](SECURITY.md). Contribuye únicamente con material que tengas derecho a aportar bajo esa licencia y conserva los avisos de terceros. Consulta el [estado de validación](docs/04_fuentes_y_validacion.md) y repite las comprobaciones pertinentes al cambiar código o dependencias.

## Cambios de código

Trabaja en una rama de tu copia con Node 24.x. Mantén `package-lock.json` coherente con `package.json`; explica cualquier cambio de dependencias o scripts de instalación. Para verificar:

```sh
npm ci
npm run check
npm run build
npm test
python3 scripts/empaquetar.py
git diff --check
```

Python 3.9 o superior se necesita solo para generar el paquete. No ejecutes `npm start` en CI ni añadas pruebas que contacten OCI. Las pruebas automatizadas deben ser sintéticas; las claves de prueba se generan en memoria. Un test manual real es responsabilidad de quien tenga autorización sobre su tenant.

## Contenido permitido

No incluyas claves, config personal, `.env`, tokens, audio, capturas de red, transcripciones personales o información de clientes en commits, issues, PR ni logs. Usa placeholders en ejemplos y datos evidentemente sintéticos en pruebas. Antes de enviar, revisa el diff y los archivos que vas a versionar. No uses `git add -f` para incorporar material excluido.

Si añades archivos necesarios para ejecutar o documentar la app, actualiza `config/archivos_distribucion.json`. El empaquetador solo distribuye esa lista: no recorre toda la carpeta. Mantén coherentes `.gitignore` y `config/distribucion.gitignore`. No subas `node_modules/`, `dist/` ni el ZIP generado.

## Pull requests e incidencias

Explica el problema, el comportamiento resultante, cómo lo verificaste y cualquier límite. Para errores de conexión basta con OS, navegador, versión de Node, paso y mensaje saneado; no publiques tokens o configuración para demostrar el problema.

Reporta vulnerabilidades siguiendo [SECURITY.md](SECURITY.md), por un canal privado. Los cambios de CI y dependencias requieren revisión: no hay auto-merge. No introduzcas `pull_request_target`, secretos OCI, permisos de escritura o runners propios para ejecutar código de contribuciones.
