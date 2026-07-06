# =============================================================
# TH0R19 AE - Blender Add-on
# animation_builder.py
# Animation Builder: two responsibilities.
#
#   1) evaluate_property() - a generic evaluator that reads the
#      {animated, value, keyframes:[...]} structure produced by
#      every parser on the After Effects side (Transform,
#      Path/Bezier, Shape Group transform) and returns the value
#      at an arbitrary point in time, linearly interpolating
#      between keyframes (or holding, for HOLD interpolation).
#      This is reused by grease_pencil_builder.py to bake dense
#      per-frame Path Animation.
#
#   2) apply_layer_animation() - keys the Shape Layer's OWN
#      transform (Position/Rotation/Scale/Opacity) as native
#      Blender keyframes on the Grease Pencil object, at the
#      exact AE keyframe frames/interpolation types. Nested
#      Shape Group transforms are NOT handled here - since a
#      whole Shape Layer collapses into a single Grease Pencil
#      object, group-level transforms are baked directly into
#      point positions instead (see grease_pencil_builder.py).
# =============================================================

import math

from . import utils
from . import coordinate_converter


# -------------------------------------------------------------
# Generic keyframe evaluation
# -------------------------------------------------------------

def evaluate_property(prop, time_seconds):
    """
    Evaluates an AE-exported property structure
    ({animated, value, keyframes:[{time, value, inInterpolation,
    outInterpolation}, ...]}) at `time_seconds`. Returns the
    static value if not animated, the held/interpolated value
    otherwise. Returns None if `prop` itself is falsy/missing.
    """
    if not prop:
        return None

    if not prop.get("animated"):
        return prop.get("value")

    keyframes = prop.get("keyframes") or []
    if not keyframes:
        return prop.get("value")

    if time_seconds <= keyframes[0]["time"]:
        return keyframes[0]["value"]

    if time_seconds >= keyframes[-1]["time"]:
        return keyframes[-1]["value"]

    for i in range(len(keyframes) - 1):
        k0 = keyframes[i]
        k1 = keyframes[i + 1]

        if k0["time"] <= time_seconds <= k1["time"]:
            span = k1["time"] - k0["time"]
            t = 0.0 if span <= 0 else (time_seconds - k0["time"]) / span

            out_interp = k0.get("outInterpolation", "LINEAR")
            if out_interp == "HOLD":
                return k0["value"]

            return _lerp_value(k0["value"], k1["value"], t)

    return keyframes[-1]["value"]


def _lerp_value(a, b, t):
    if isinstance(a, bool) or isinstance(b, bool):
        return a
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        return utils.lerp_number(a, b, t)
    if isinstance(a, list) and isinstance(b, list):
        return utils.lerp_vector(a, b, t)
    if isinstance(a, dict) and isinstance(b, dict) and "points" in a and "points" in b:
        return _lerp_shape(a, b, t)
    # unsupported / mismatched type combination: hold the first value
    return a


def _lerp_shape(a, b, t):
    pts_a = a.get("points", [])
    pts_b = b.get("points", [])

    if len(pts_a) != len(pts_b):
        # Point count changed between keyframes (path morphing with a
        # differing vertex count). True morphing between different
        # topologies is undefined without additional AE data, so we
        # hold the earlier keyframe's shape to avoid producing broken
        # geometry.
        return a

    points = []
    for pa, pb in zip(pts_a, pts_b):
        points.append({
            "vertex": utils.lerp_vector(pa["vertex"], pb["vertex"], t),
            "inTangent": utils.lerp_vector(pa["inTangent"], pb["inTangent"], t),
            "outTangent": utils.lerp_vector(pa["outTangent"], pb["outTangent"], t),
        })

    return {
        "closed": a.get("closed", False),
        "pointCount": len(points),
        "points": points
    }


# -------------------------------------------------------------
# Native object-level transform keyframing
# -------------------------------------------------------------

def _map_interpolation(interp_str):
    if interp_str == "HOLD":
        return 'CONSTANT'
    if interp_str == "LINEAR":
        return 'LINEAR'
    return 'BEZIER'


def _set_fcurve_interpolation(obj, data_path, indices, frame, interp_str):
    if obj.animation_data is None or obj.animation_data.action is None:
        return

    action = obj.animation_data.action
    blender_interp = _map_interpolation(interp_str)

    for index in indices:
        fcurve = action.fcurves.find(data_path, index=index)
        if fcurve is None:
            continue
        for kp in fcurve.keyframe_points:
            if abs(kp.co.x - frame) < 0.5:
                kp.interpolation = blender_interp
                break


def _apply_position(obj, position_prop, comp_width, comp_height, pixel_scale, fps, frame_offset, log):
    def to_blender(raw):
        x = raw[0] if len(raw) > 0 else comp_width / 2.0
        y = raw[1] if len(raw) > 1 else comp_height / 2.0
        z = raw[2] if len(raw) > 2 else 0.0
        return coordinate_converter.ae_point_to_blender(x, y, z, comp_width, comp_height, pixel_scale)

    if not position_prop or not position_prop.get("animated"):
        raw = utils.safe_get(position_prop, "value", [comp_width / 2.0, comp_height / 2.0, 0.0])
        obj.location = to_blender(raw)
        return

    for kf in position_prop.get("keyframes", []):
        frame = utils.time_to_frame(kf["time"], fps, frame_offset)
        obj.location = to_blender(kf["value"])
        obj.keyframe_insert(data_path="location", frame=frame)
        interp = kf.get("outInterpolation", "LINEAR")
        _set_fcurve_interpolation(obj, "location", (0, 1, 2), frame, interp)


def _apply_rotation(obj, rotation_prop, fps, frame_offset, log):
    def to_blender(deg):
        # Sign flip: object-level rotation is applied AFTER the
        # geometry has already been converted into Blender's
        # Y-up space, so the standard AE->3D-app sign flip applies
        # here (see coordinate_converter.py header for the proof).
        return -math.radians(deg or 0.0)

    if not rotation_prop or not rotation_prop.get("animated"):
        deg = utils.safe_get(rotation_prop, "value", 0.0)
        obj.rotation_euler.z = to_blender(deg)
        return

    for kf in rotation_prop.get("keyframes", []):
        frame = utils.time_to_frame(kf["time"], fps, frame_offset)
        obj.rotation_euler.z = to_blender(kf["value"])
        obj.keyframe_insert(data_path="rotation_euler", index=2, frame=frame)
        interp = kf.get("outInterpolation", "LINEAR")
        _set_fcurve_interpolation(obj, "rotation_euler", (2,), frame, interp)


def _apply_scale(obj, scale_prop, fps, frame_offset, log):
    def to_blender(raw):
        sx = (raw[0] if len(raw) > 0 else 100.0) / 100.0
        sy = (raw[1] if len(raw) > 1 else 100.0) / 100.0
        sz = (raw[2] if len(raw) > 2 else 100.0) / 100.0
        return (sx, sy, sz)

    if not scale_prop or not scale_prop.get("animated"):
        raw = utils.safe_get(scale_prop, "value", [100.0, 100.0, 100.0])
        obj.scale = to_blender(raw)
        return

    for kf in scale_prop.get("keyframes", []):
        frame = utils.time_to_frame(kf["time"], fps, frame_offset)
        obj.scale = to_blender(kf["value"])
        obj.keyframe_insert(data_path="scale", frame=frame)
        interp = kf.get("outInterpolation", "LINEAR")
        _set_fcurve_interpolation(obj, "scale", (0, 1, 2), frame, interp)


def _apply_opacity(obj, opacity_prop, fps, frame_offset, log):
    prop_path = '["th0r19_opacity"]'

    if not opacity_prop or not opacity_prop.get("animated"):
        value = utils.safe_get(opacity_prop, "value", 100.0)
        obj["th0r19_opacity"] = float(value)
        return

    for kf in opacity_prop.get("keyframes", []):
        frame = utils.time_to_frame(kf["time"], fps, frame_offset)
        obj["th0r19_opacity"] = float(kf["value"])
        obj.keyframe_insert(data_path=prop_path, frame=frame)
        interp = kf.get("outInterpolation", "LINEAR")
        _set_fcurve_interpolation(obj, prop_path, (0,), frame, interp)


def apply_layer_animation(obj, layer, comp, pixel_scale, fps, frame_offset, log):
    """
    Applies the Shape Layer's own Transform (Position, Rotation,
    Scale, Opacity) to `obj` as native Blender properties and, if
    animated, native Blender keyframes with matching interpolation.
    """
    transform = layer.get("transform", {}) or {}
    comp_width = float(comp.get("width", 1920))
    comp_height = float(comp.get("height", 1080))

    _apply_position(obj, transform.get("position"), comp_width, comp_height, pixel_scale, fps, frame_offset, log)
    _apply_rotation(obj, transform.get("rotation"), fps, frame_offset, log)
    _apply_scale(obj, transform.get("scale"), fps, frame_offset, log)
    _apply_opacity(obj, transform.get("opacity"), fps, frame_offset, log)

    if transform.get("position", {}).get("animated") or \
       transform.get("rotation", {}).get("animated") or \
       transform.get("scale", {}).get("animated") or \
       transform.get("opacity", {}).get("animated"):
        log.info("Animation Imported (transform): " + layer.get("name", obj.name))
