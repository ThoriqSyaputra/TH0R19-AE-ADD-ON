# =============================================================
# TH0R19 AE - Blender Add-on
# utils.py
# Utility Module: generic helpers shared across the add-on.
# =============================================================

import math
import bpy


def safe_get(d, key, default=None):
    """Safely read a key from a dict, treating None as missing."""
    if not isinstance(d, dict):
        return default
    value = d.get(key, default)
    return default if value is None else value


def time_to_frame(time_seconds, fps, frame_offset=0):
    """Convert an AE time (seconds) into a Blender frame number."""
    if fps <= 0:
        fps = 30.0
    return int(round(time_seconds * fps)) + int(frame_offset)


def frame_to_time(frame, fps, frame_offset=0):
    """Convert a Blender frame number back into AE time (seconds)."""
    if fps <= 0:
        fps = 30.0
    return (frame - int(frame_offset)) / float(fps)


def clamp(value, lo, hi):
    return max(lo, min(hi, value))


def lerp_number(a, b, t):
    return a + (b - a) * t


def lerp_vector(a, b, t):
    length = min(len(a), len(b))
    result = [lerp_number(a[i], b[i], t) for i in range(length)]
    # keep any extra trailing components from `a` untouched (defensive)
    if len(a) > length:
        result.extend(a[length:])
    return result


def degrees_to_radians(deg):
    return math.radians(deg)


def get_grease_pencil_data_collection():
    """
    In Blender 4.3-4.x, the NEW Grease Pencil 3.0 data type lives
    in bpy.data.grease_pencils_v3 - bpy.data.grease_pencils is
    reserved for the legacy annotation-only GreasePencil type,
    which is NOT valid as an object's data (creating an object
    with it raises "ID type 'GREASEPENCIL' is not valid for an
    object"). This was renamed for Blender 5.0
    (grease_pencils_v3 -> grease_pencils), so this helper picks
    whichever collection is the *new* type on the running
    Blender version, keeping the add-on working on both.
    """
    if hasattr(bpy.data, "grease_pencils_v3"):
        return bpy.data.grease_pencils_v3
    return bpy.data.grease_pencils


def new_grease_pencil_data(name):
    return get_grease_pencil_data_collection().new(name)


def remove_grease_pencil_data(data_block):
    get_grease_pencil_data_collection().remove(data_block)
