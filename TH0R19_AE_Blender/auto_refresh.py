# =============================================================
# TH0R19 AE - Blender Add-on
# auto_refresh.py
# Auto Refresh: a bpy.app.timers loop that, when the Auto
# Refresh checkbox is enabled, polls the JSON file's modified
# time every few seconds and automatically runs Reload Scene
# whenever the file on disk has changed - without ever creating
# duplicate objects (uuid_manager guarantees that).
# =============================================================

import bpy

from . import json_loader
from . import logger as th0r19_logger

_INTERVAL_SECONDS = 2.0


def _tick():
    try:
        for scene in bpy.data.scenes:
            props = getattr(scene, "th0r19_ae", None)
            if props is None:
                continue
            if not props.auto_refresh or not props.json_path:
                continue

            mtime = json_loader.get_mtime(props.json_path)
            if mtime is None:
                continue

            if props.last_mtime and abs(mtime - props.last_mtime) < 1e-6:
                continue

            th0r19_logger.info("Perubahan file JSON terdeteksi, menjalankan Reload Scene...")

            try:
                bpy.ops.th0r19.refresh_scene()
            except Exception as e:
                th0r19_logger.error("Auto Refresh gagal: " + str(e))

    except Exception as e:
        # The timer loop must never raise, or Blender will silently
        # stop calling it again.
        print("TH0R19 AE auto refresh error:", e)

    return _INTERVAL_SECONDS


def register():
    if not bpy.app.timers.is_registered(_tick):
        bpy.app.timers.register(_tick, first_interval=_INTERVAL_SECONDS, persistent=True)


def unregister():
    if bpy.app.timers.is_registered(_tick):
        bpy.app.timers.unregister(_tick)
