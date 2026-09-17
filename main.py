import os, json, dropbox, requests, sys
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

load_dotenv()

dbx = dropbox.Dropbox(
    app_key=os.environ["DBX_APP_KEY"],
    app_secret=os.environ["DBX_APP_SECRET"],
    oauth2_refresh_token=os.environ["DBX_REFRESH_TOKEN"],
)
SB, KEY = os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"]
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}"}
JSON_H = {**H, "Content-Type": "application/json"}
SUF = ".meta.json"

def enlace(ruta):
    try:
        return dbx.sharing_create_shared_link_with_settings(ruta).url.replace("?dl=0", "?dl=1")
    except dropbox.exceptions.ApiError:
        ls = dbx.sharing_list_shared_links(path=ruta, direct_only=True).links
        return ls[0].url.replace("?dl=0", "?dl=1") if ls else None

archivos = [e for e in dbx.files_list_folder("/sp_binarios").entries
            if isinstance(e, dropbox.files.FileMetadata)]

sidecars = [f for f in archivos if f.name.endswith(SUF)]
binarios = [f for f in archivos if not f.name.endswith(SUF)]

if sidecars == [] and binarios != []:
    print("AVISO: hay binarios sin ningún sidecar — revisa el sufijo")
    sys.exit(1)

if sidecars == [] and binarios == []:
    print("AVISO: no hay nada por procesar")
    sys.exit(1)

# ── PASADA 1: sidecars → tabla filas ────────────────────────────
for f in sidecars:
    try:
        _, r = dbx.files_download(f.path_lower)
        meta = json.loads(r.content)
        sp_id = int(f.name[:-len(SUF)].split("__", 1)[1])

        resp = requests.post(f"{SB}/rest/v1/filas",
            headers={**JSON_H,
                     "Prefer": "resolution=merge-duplicates,return=representation"},
            json={"sp_id": sp_id,
                  "programa":       meta.get("Title"),
                  "creado_por":     (meta.get("Author") or {}).get("DisplayName"),
                  "modificado_por": (meta.get("Editor") or {}).get("DisplayName"),
                  "creado_en":      meta.get("Created"),
                  "actualizado_en": meta.get("Modified")},
        )
        print(resp.status_code, resp.text[:300])
        resp.raise_for_status()

        if not resp.json():                      
            raise RuntimeError("insert vacío, no borro el sidecar")

        dbx.files_delete_v2(f.path_lower)
        print(f"fila {sp_id} ok")
    except Exception as e:
        print(f"sidecar omitido {f.name}: {e}")

# ── PASADA 2: binarios → contenidos + documentos_vistos ─────────
for f in binarios:
    try:
        ts, sp_id, nombre = f.name.split("__", 2)
        h = f.content_hash

        # la FK exige que la fila exista; si su sidecar se perdió, la creamos vacía
        requests.post(f"{SB}/rest/v1/filas",
            headers={**JSON_H, "Prefer": "resolution=ignore-duplicates"},
            json={"sp_id": int(sp_id)},
        ).raise_for_status()

        existe = requests.get(f"{SB}/rest/v1/contenidos", headers=H,
            params={"content_hash": f"eq.{h}", "select": "content_hash"}).json()

        if existe:
            dbx.files_delete_v2(f.path_lower)
        else:
            destino = f"/sp_docs/{f.name}"
            dbx.files_move_v2(f.path_lower, destino)
            requests.post(f"{SB}/rest/v1/contenidos", headers=JSON_H,
                json={"content_hash": h, "url": enlace(destino), "bytes": f.size}
            ).raise_for_status()

        requests.post(f"{SB}/rest/v1/documentos_vistos",
            headers={**JSON_H, "Prefer": "resolution=ignore-duplicates"},
            json={"sp_id": int(sp_id), "nombre": nombre,
                  "content_hash": h, "visto_en": f.client_modified.isoformat()},
        ).raise_for_status()

        print(f"doc {nombre} (fila {sp_id}) ok")
    except Exception as e:
        print(f"binario omitido {f.name}: {e}")