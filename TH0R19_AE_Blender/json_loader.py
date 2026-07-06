# =============================================================
# TH0R19 AE - Blender Add-on
# json_loader.py
# JSON Loader: reads thor19_scene.json from disk, parses it with
# Python's standard json module, and validates the minimum
# schema produced by the TH0R19 AE After Effects exporter.
# The JSON structure itself is treated as fixed/authoritative -
# this module only reads it, it never rewrites or reshapes it.
# =============================================================

import bpy
import json
import os


class TH0R19JSONError(Exception):
    pass


def resolve_path(filepath):
    """Resolve a (possibly blend-relative '//') path to an absolute path."""
    if not filepath:
        return ""
    return bpy.path.abspath(filepath)


def get_mtime(filepath):
    """Return the file's modification time, or None if it doesn't exist."""
    abs_path = resolve_path(filepath)
    if not abs_path or not os.path.isfile(abs_path):
        return None
    try:
        return os.path.getmtime(abs_path)
    except OSError:
        return None


def load_scene_json(filepath, log):
    """
    Reads and validates thor19_scene.json.
    `log` is the logger module (duck-typed: info/warn/error/success).
    Raises TH0R19JSONError on any problem, with a message meant
    to be shown directly to the user.
    """
    if not filepath:
        raise TH0R19JSONError("Scene JSON path belum diset.")

    abs_path = resolve_path(filepath)

    if not os.path.isfile(abs_path):
        raise TH0R19JSONError("File JSON tidak ditemukan: " + abs_path)

    log.info("Reading JSON: " + abs_path)

    try:
        with open(abs_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (ValueError, OSError) as e:
        raise TH0R19JSONError("Gagal membaca / parsing JSON: " + str(e))

    _validate_schema(data)

    return data


def _validate_schema(data):
    if not isinstance(data, dict):
        raise TH0R19JSONError("Struktur JSON tidak valid: root harus berupa object.")

    if "composition" not in data:
        raise TH0R19JSONError("Struktur JSON tidak valid: field 'composition' tidak ditemukan.")

    comp = data["composition"]
    if not isinstance(comp, dict):
        raise TH0R19JSONError("Struktur JSON tidak valid: 'composition' harus berupa object.")

    required = ["width", "height", "frameRate", "layers"]
    for key in required:
        if key not in comp:
            raise TH0R19JSONError(
                "Struktur JSON tidak valid: composition tidak memiliki field '" + key + "'."
            )

    if not isinstance(comp["layers"], list):
        raise TH0R19JSONError("Struktur JSON tidak valid: 'composition.layers' harus berupa array.")
