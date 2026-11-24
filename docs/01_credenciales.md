# Credenciales personales para la PoC

Cada participante usa su propia identidad OCI. No recibirá claves del autor ni debe enviar su config al compañero. La demostración funciona sin credenciales. La preparación de material real y las operaciones OCI las realiza el participante.

## 1. Preparar la carpeta local

Desde la raíz `oci-speech-realtime-poc/`, crea personalmente esta estructura:

```text
oci-speech-realtime-poc/
  .gitignore
  .env.example
  .env                      # personal, no versionar
  .secrets/oci/              # personal, no versionar
    config
    api_key.pem
  config/oci-config.example  # plantilla compartible
```

Antes de introducir material privado, confirma que la raíz Git es esta carpeta y comprueba sus reglas:

```sh
git rev-parse --show-toplevel
git check-ignore -v .env .secrets/oci/config .secrets/oci/api_key.pem
```

En una descarga sin `.git`, no inicialices Git desde otra carpeta ni subas todo el directorio. Mantén las exclusiones. `.gitignore` no impide que un ZIP manual incluya secretos ni elimina archivos que ya estaban versionados.

## 2. Registrar la clave pública

Necesitas acceso OCI y autorización para registrar una API signing key. Sigue las [instrucciones oficiales de Oracle](https://docs.oracle.com/en-us/iaas/Content/API/Concepts/apisigningkey.htm) para registrar la pública y obtener el snippet de configuración. Conserva la privada en tu equipo como `.secrets/oci/api_key.pem`; revisa personalmente las copias de descargas. No uses un Auth Token ni una clave SSH como sustituto.

## 3. Completar el config

Copia [oci-config.example](../config/oci-config.example) a `.secrets/oci/config`, sin sobrescribir otro archivo. Conserva un único perfil `[SPEECH_POC]` y completa tus valores:

| Campo | Valor personal |
| --- | --- |
| `user` | OCID del usuario |
| `tenancy` | OCID del tenant |
| `fingerprint` | Fingerprint de la pública correspondiente a la privada |
| `region` | `sa-bogota-1` |
| `key_file` | Ruta absoluta a tu privada PEM, sin comillas |

Ejemplos ilustrativos de ruta: `/RUTA/PRIVADA/api_key.pem` o `C:/RUTA/PRIVADA/api_key.pem`. Sustitúyelos por tu ruta; no uses variables ni `~`. No añadas DEFAULT, perfiles adicionales, `security_token_file` o `pass_phrase`. La app exige configuración explícita sin heredar otra identidad.

Oracle documenta los [campos y perfiles](https://docs.oracle.com/en-us/iaas/Content/API/Concepts/sdkconfig.htm). El perfil único y las restricciones adicionales son decisiones de esta app. Si la privada está cifrada, la app solicita la passphrase de forma oculta al arrancar y la mantiene solo en memoria; no la guardes en archivos o argumentos.

## 4. Completar .env y permisos locales

Copia [`.env.example`](../.env.example) a `.env`, sin sobrescribir un archivo existente. Conserva estos cuatro campos y completa el OCID:

```dotenv
OCI_CONFIG_FILE=.secrets/oci/config
OCI_CONFIG_PROFILE=SPEECH_POC
OCI_REGION=sa-bogota-1
OCI_COMPARTMENT_ID=REEMPLAZAR_CON_OCID_DEL_COMPARTIMENTO
```

El compartimento se identifica por OCID, no por nombre. Elige uno autorizado para tu identidad. Las rutas relativas se resuelven desde la raíz de la app, no desde la terminal. Config y `.env` deben coincidir en región.

En macOS/Linux, una vez creados los archivos, aplica personalmente:

```sh
chmod 700 .secrets .secrets/oci
chmod 600 .secrets/oci/config .secrets/oci/api_key.pem .env
```

En Windows revisa las ACL en Propiedades → Seguridad según tu organización. No sustituyas sus controles con `chmod`.

## 5. Ejecutar y revisar acceso

Sigue el [README](../README.md) y la [prueba manual](02_prueba_manual.md). No descargas tokens de Speech: el backend los obtiene al iniciar el dictado. Las pruebas reales consumen servicios de tu tenant.

Carpeta, clave nueva y nombre de perfil no reducen permisos IAM. Revisa con tu administrador el alcance de la identidad y del compartimento; no copies políticas amplias como si fueran el mínimo necesario. La app no configura IAM ni requiere un bucket para transmitir audio en tiempo real.

Si falla, comparte únicamente versión, paso y mensaje saneado. No publiques `.env`, config, privada, passphrase, tokens, firmas ni capturas de red. Ante una clave expuesta, gestiona su revocación/sustitución por el procedimiento de tu organización; añadirla a `.gitignore` no corrige una filtración.
