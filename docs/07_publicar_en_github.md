# Publicar y compartir el repositorio

Esta guía corresponde al propietario. Publica únicamente el proyecto genérico ya revisado. Cada participante ejecutará su copia local y usará sus propias credenciales OCI. Publicar el código no despliega el backend ni crea un servicio compartido.

## 1. Comprobar raíz y contenido local

Abre una terminal dentro de `oci-speech-realtime-poc/`. Esta carpeta debe tener su propio `.git`. Antes de añadir archivos, crear un remote o hacer push:

```sh
pwd
git rev-parse --show-toplevel
git status --short
git remote -v
```

La raíz mostrada por Git debe coincidir con esta carpeta, y no con un proyecto padre. Si no coincide o no existe `.git` propio, detente y revisa la ubicación. No copies el `.git` de otro proyecto ni publiques ramas o historial ajenos.

Revisa los archivos versionados con `git ls-files` y confirma que no contienen `.env` personal, `.secrets/`, `api_keys/`, privadas, tokens, grabaciones, logs o transcripciones personales. Las plantillas `.env.example` y `config/oci-config.example` deben conservar placeholders. Revisa el índice con `git diff --cached --stat` y `git diff --cached`; ejecuta `git diff --cached --check` antes del commit.

## 2. Confirmar identidad y primer commit

El autor previsto es Juan Parra y el código propio usa [MIT](../LICENSE). El email de los commits será visible en el historial: configura localmente tu dirección noreply exacta de GitHub si quieres conservar privado tu correo personal. Está en Settings → Emails; no publiques contraseñas ni tokens.

No copies una dirección de ejemplo ni asumas que nombre de usuario y email noreply tienen siempre el mismo formato. Configura `user.name` y `user.email` solo en este repositorio y revisa sus valores antes del primer commit. No cambies la identidad global del equipo para este proyecto.

Cuando contenido e identidad estén aprobados, el primer commit puede llamarse `feat: add local OCI Speech realtime PoC`. Comprueba después que el historial pertenece únicamente a esta copia y ejecuta el escaneo dedicado del historial nuevo. No uses force-push para resolver una publicación inicial mal preparada.

## 3. Crear el repositorio vacío en GitHub

Desde tu cuenta personal, crea un repositorio llamado `oci-speech-realtime-poc`. Comprueba propietario y visibilidad. Para cargar esta copia existente, no añadas desde GitHub README, licencia ni `.gitignore`: ya existen localmente.

Puedes mantener el remoto privado durante la comprobación final y cambiarlo a público después de aceptar el contenido. Una vez público, otros pueden conservar clones o forks. El cambio posterior a privado no retira esas copias.

## 4. Conectar y publicar

Copia la URL HTTPS o SSH exacta de tu repositorio nuevo. No incluyas contraseñas, PAT ni otros secretos en la URL. Confirma que `origin` no existe todavía; después, desde la raíz verificada:

```sh
git remote add origin URL_CONFIRMADA_DEL_REPOSITORIO
git remote -v
git log --oneline --all
git status --short
```

`URL_CONFIRMADA_DEL_REPOSITORIO` es un marcador que debes sustituir. Verifica dueño, nombre y único historial previsto. Solo después ejecuta:

```sh
git push -u origin main
```

Autentícate mediante el mecanismo habitual de GitHub en tu equipo; no adjuntes sus credenciales al proyecto. Si el remote ya existía, no lo sobrescribas sin revisar por qué. Si GitHub rechaza el push por secretos, detente y resuelve el hallazgo; no eludas la protección.

## 5. Revisar GitHub antes de compartir

Confirma que el repositorio muestra README, MIT, ejemplos y guías correctos. Comprueba que la CI termina correctamente; no confundas la validación local con una ejecución real de Actions. La CI no necesita secretos OCI ni tokens personales de acceso.

Configura reportes privados de vulnerabilidades y revisa sus destinatarios, protección/detección de secretos y alertas de dependencias según disponibilidad. Sigue [colaboración y CI](06_colaboracion_y_ci.md) para proteger la rama principal sin bloquear a un mantenedor único. No actives GitHub Pages como sustituto del backend Node de esta aplicación.

## 6. Entregar al compañero

Comparte la URL pública y el commit o versión revisada. El compañero clona, entra a la raíz y sigue el [README](../README.md) y la [guía de instalación](03_entrega_companero.md). Puede usar la demo sin credenciales o preparar su identidad siguiendo [credenciales](01_credenciales.md). Nunca necesita recibir las claves o `.env` del autor.

## Fuentes

- [GitHub: añadir código local](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github).
- [GitHub: crear un repositorio](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository).
- [GitHub: email de commits](https://docs.github.com/en/account-and-profile/how-tos/email-preferences/setting-your-commit-email-address).

Consultadas el 24 de noviembre de 2026. Esta guía no acredita que se haya creado o publicado un repositorio remoto.
