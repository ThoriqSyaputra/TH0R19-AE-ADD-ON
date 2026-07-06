# =============================================================
# TH0R19 AE - Blender Add-on
# logger.py
# Logger: writes timestamped log lines into the STATUS box of
# the N-Panel (backed by a Scene string property) and to the
# system console.
# =============================================================

import bpy
import datetime

_MAX_CHARS = 20000

LOG_TEXT_NAME = "TH0R19_AE_Log"


def _get_scene():
    try:
        return bpy.context.scene
    except Exception:
        return None


def _timestamp():
    return datetime.datetime.now().strftime("%H:%M:%S")


def get_or_create_text_block():
    """
    Returns the bpy.data.texts datablock that mirrors the full log,
    creating it if it doesn't exist yet. This datablock has no file
    on disk (filepath is empty) - it only lives inside the .blend -
    so it must be opened via space_data.text, never via text.open()
    or wm.text_open (which do not apply to in-memory text blocks).
    """
    text_block = bpy.data.texts.get(LOG_TEXT_NAME)
    if text_block is None:
        text_block = bpy.data.texts.new(LOG_TEXT_NAME)
    return text_block


def _mirror_to_text_block(full_text):
    try:
        text_block = get_or_create_text_block()
        text_block.clear()
        text_block.write(full_text)
    except Exception as e:
        # Never let the log mirror break the actual operation being logged.
        print("TH0R19 AE: gagal menulis ke Text block log:", e)


def _write(level, message):
    line = "[{0}] [{1}] {2}".format(_timestamp(), level, message)
    print("TH0R19 AE:", line)

    scene = _get_scene()
    if scene is None:
        return

    props = getattr(scene, "th0r19_ae", None)
    if props is None:
        return

    text = props.status_log
    text = (text + "\n" + line) if text else line

    if len(text) > _MAX_CHARS:
        text = text[-_MAX_CHARS:]

    props.status_log = text
    _mirror_to_text_block(text)


def info(message):
    _write("INFO", message)


def warn(message):
    _write("WARN", message)


def error(message):
    _write("ERROR", message)


def success(message):
    _write("OK", message)


def clear():
    scene = _get_scene()
    if scene is not None:
        props = getattr(scene, "th0r19_ae", None)
        if props is not None:
            props.status_log = ""

    text_block = bpy.data.texts.get(LOG_TEXT_NAME)
    if text_block is not None:
        try:
            text_block.clear()
        except Exception:
            pass
