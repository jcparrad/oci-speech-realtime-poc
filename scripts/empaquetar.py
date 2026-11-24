#!/usr/bin/env python3
"""Empaqueta solo archivos expresamente permitidos. No recorre carpetas privadas."""

import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import re
import stat
import sys
import zipfile


APP_ROOT = Path(__file__).resolve().parent.parent
WRAPPER = "oci-speech-realtime-poc"
FORBIDDEN = {".secrets", "api_keys", ".git", "node_modules", "dist", "salidas_locales", "distribucion_local", "_plans"}
PRIVATE_KEY = re.compile(rb"-----BEGIN (?:[A-Z]+ )*PRIVATE KEY-----")
PERSONAL_OCID = re.compile(rb"ocid1\.(?:user|tenancy|compartment)\.oc\d+\.[a-z0-9-]*\.[a-z0-9]{20,}", re.I)
JWT = re.compile(rb"\beyJ[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{24,}\b")


def read_allowed(name):
    relative = PurePosixPath(name)
    if (relative.is_absolute() or ".." in relative.parts or "\\" in name
            or any(part in FORBIDDEN for part in relative.parts)
            or relative.name.startswith(".env") and relative.name != ".env.example"
            or relative.suffix.lower() in {".pem", ".key", ".p12", ".pfx", ".log", ".zip"}):
        raise ValueError("La lista permitida contiene una ruta excluida.")
    source = APP_ROOT.joinpath(*relative.parts)
    for part in [source, *source.parents]:
        if part == APP_ROOT:
            break
        if part.is_symlink():
            raise ValueError("No se admiten enlaces simbólicos en la entrega.")
    if not source.resolve().is_relative_to(APP_ROOT) or not source.is_file():
        raise ValueError("Falta un archivo de la lista permitida.")
    data = source.read_bytes()
    if PRIVATE_KEY.search(data) or PERSONAL_OCID.search(data) or JWT.search(data):
        # Do not echo the matching value or file contents.
        raise ValueError("Se detectó posible material privado en un archivo permitido; entrega cancelada.")
    return data


def build_package():
    names = json.loads(read_allowed("config/archivos_distribucion.json"))
    if not isinstance(names, list) or not names or not all(isinstance(x, str) for x in names) or len(names) != len(set(names)):
        raise ValueError("Lista de distribución inválida o duplicada.")
    # Read exactly this list, never a wildcard, Git's index or the whole project tree.
    payload = {name: read_allowed(name) for name in sorted(names)}
    payload[".gitignore"] = read_allowed("config/distribucion.gitignore")
    payload["LEEME.md"] = (
        "# PoC local de OCI Speech realtime\n\n"
        "Empieza por la [guía de instalación para el compañero](docs/03_entrega_companero.md).\n\n"
        "Requiere Node.js 24.x e Internet para instalar dependencias. "
        "El dictado requiere micrófono y acceso OCI; cada participante configura su propia API key.\n\n"
        "Crea `.secrets/oci/` dentro de la raíz de esta app únicamente cuando sigas la guía. "
        "No se incluyen claves, config real ni tokens. Las comprobaciones realizadas son locales con datos sintéticos; "
        "micrófono, apariencia en navegador y acceso OCI reales no están verificados.\n\n"
        "`MANIFIESTO_SHA256.json` identifica los archivos distribuidos y sus hashes. "
        "No incluye su propio hash; el hash del ZIP se entrega por separado.\n"
    ).encode("utf-8")
    manifest = {
        "schema": 1,
        "files": [{"path": name, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}
                  for name, data in sorted(payload.items())],
    }
    payload["MANIFIESTO_SHA256.json"] = (json.dumps(manifest, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name, data in sorted(payload.items()):
            entry = zipfile.ZipInfo(f"{WRAPPER}/{name}", date_time=(1980, 1, 1, 0, 0, 0))
            entry.compress_type = zipfile.ZIP_DEFLATED
            entry.create_system = 3
            entry.external_attr = (stat.S_IFREG | 0o644) << 16
            archive.writestr(entry, data)
    contents = buffer.getvalue()
    with zipfile.ZipFile(io.BytesIO(contents)) as archive:
        if archive.testzip() is not None or len(archive.namelist()) != len(payload):
            raise ValueError("El ZIP no superó la verificación de integridad.")
    # Version metadata is read from the allowlisted bytes already checked above.
    version = json.loads(payload["package.json"])["version"]
    if not re.fullmatch(r"[0-9]+\.[0-9]+\.[0-9]+", version):
        raise ValueError("Versión de paquete inválida.")
    output = APP_ROOT / "distribucion_local"
    if output.is_symlink():
        raise ValueError("La carpeta de salida no puede ser un enlace simbólico.")
    output.mkdir(exist_ok=True)
    filename = f"{WRAPPER}-{version}.zip"
    destination = output / filename
    checksum = output / f"{filename}.sha256"
    inventory = output / "inventario.json"
    for path in [destination, checksum, inventory]:
        if path.is_symlink():
            raise ValueError("La salida no puede ser un enlace simbólico.")
    digest = hashlib.sha256(contents).hexdigest()
    destination.write_bytes(contents)
    checksum.write_text(f"{digest}  {filename}\n", encoding="utf-8")
    inventory.write_text(json.dumps({"archive": filename, "sha256": digest,
                                    "entries": len(payload), "bytes": len(contents),
                                    "manifest": manifest}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Paquete: distribucion_local/{filename}")
    print(f"Archivos: {len(payload)}; bytes: {len(contents)}; SHA-256: {digest}")
    print("Lista explícita verificada. No se recorrieron carpetas privadas ni se conectó a OCI.")


if __name__ == "__main__":
    try:
        build_package()
    except (OSError, ValueError, TypeError, KeyError, zipfile.BadZipFile):
        print("No se generó un paquete válido. Revisa la lista permitida, archivos y posibles datos privados; no compartas la salida existente.", file=sys.stderr)
        sys.exit(1)
