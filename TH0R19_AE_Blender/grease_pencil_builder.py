# =============================================================
# TH0R19 AE - Blender Add-on
# grease_pencil_builder.py
# Grease Pencil Builder: turns one AE Shape Layer (its nested
# Shape Group tree + Path shapes) into a single Grease Pencil
# object, using Blender 4.5's Grease Pencil 3.0 data model.
#
# One Shape Layer  -> one Grease Pencil OBJECT
# One Path shape   -> one Bezier STROKE (points, closed flag,
#                      handle_left / handle_right all preserved,
#                      point count never changed)
# Nested Shape Groups are walked recursively and their own
# Anchor/Position/Scale/Rotation/Skew are BAKED directly into
# every point's position (there is no separate Blender object
# per group, since the whole layer is one Grease Pencil object).
#
# Path Animation (the shape's own Bezier keyframes, or any
# ancestor Shape Group's transform being animated) is handled by
# building ONE Grease Pencil frame/drawing PER AE FRAME across
# the animated range, each one evaluated independently - exactly
# as requested, so Blender's own interpolation is never involved
# in reproducing the path shape over time.
# =============================================================

import bpy
from mathutils import Matrix, Vector

from . import animation_builder
from . import coordinate_converter
from . import utils

MATERIAL_NAME = "TH0R19_GP_Stroke"
LAYER_NAME = "AE"
Z_STACK_EPSILON = 0.0005  # tiny per-layer-index depth separation, avoids z-fighting between coplanar strokes


# -------------------------------------------------------------
# Public entry point
# -------------------------------------------------------------

def build_or_update_layer_object(layer, collection, existing_obj, comp, pixel_scale, fps, frame_offset, log):
    name = layer.get("name", "Shape Layer")

    if existing_obj is not None:
        obj = existing_obj
        obj.name = name
        gp_data = obj.data
        _clear_frames(gp_data)
    else:
        gp_data = utils.new_grease_pencil_data(name)
        obj = bpy.data.objects.new(name, gp_data)
        collection.objects.link(obj)

    gp_data.name = name

    try:
        gp_data.stroke_depth_order = '2D'
    except Exception:
        pass

    _ensure_material(gp_data, log)

    gp_layer = gp_data.layers.new(LAYER_NAME, set_active=True)

    z_offset = -(layer.get("index", 0) or 0) * Z_STACK_EPSILON

    frames_to_bake = _determine_bake_frames(layer, fps, frame_offset)

    if frames_to_bake is None:
        base_frame = frame_offset if frame_offset else 1
        frame_entry = gp_layer.frames.new(base_frame)
        strokes = _flatten_layer_at_time(layer, comp, pixel_scale, 0.0, z_offset)
        _write_drawing(frame_entry.drawing, strokes, pixel_scale, log)
        log.info("Path statis dibangun untuk: " + name)
    else:
        log.info(
            "Path Animation terdeteksi pada '" + name + "', baking " +
            str(len(frames_to_bake)) + " frame..."
        )
        for frame in frames_to_bake:
            time_seconds = utils.frame_to_time(frame, fps, frame_offset)
            frame_entry = gp_layer.frames.new(frame)
            strokes = _flatten_layer_at_time(layer, comp, pixel_scale, time_seconds, z_offset)
            _write_drawing(frame_entry.drawing, strokes, pixel_scale, log)
        log.success("Animation Imported (path): " + name)

    return obj


# -------------------------------------------------------------
# Frame range detection for Path Animation baking
# -------------------------------------------------------------

def _collect_animated_times(shapes, groups, times_set):
    for shape in shapes:
        path_prop = shape.get("path") or {}
        if path_prop.get("animated"):
            for kf in path_prop.get("keyframes", []):
                times_set.add(kf["time"])

    for group in groups:
        transform = group.get("transform", {}) or {}
        for key in ("anchorPoint", "position", "scale", "rotation", "skew", "skewAxis"):
            prop = transform.get(key)
            if prop and prop.get("animated"):
                for kf in prop.get("keyframes", []):
                    times_set.add(kf["time"])

        _collect_animated_times(group.get("shapes", []), group.get("groups", []), times_set)


def _determine_bake_frames(layer, fps, frame_offset):
    times = set()
    _collect_animated_times(layer.get("shapes", []), layer.get("groups", []), times)

    if not times:
        return None

    min_frame = utils.time_to_frame(min(times), fps, frame_offset)
    max_frame = utils.time_to_frame(max(times), fps, frame_offset)

    if max_frame < min_frame:
        min_frame, max_frame = max_frame, min_frame

    return list(range(min_frame, max_frame + 1))


# -------------------------------------------------------------
# Shape tree flattening (recursive), fully baked at one instant
# -------------------------------------------------------------

def _eval_vec(prop, time_seconds, default):
    if not prop:
        return list(default)
    value = animation_builder.evaluate_property(prop, time_seconds)
    return value if value is not None else list(default)


def _eval_num(prop, time_seconds, default):
    if not prop:
        return default
    value = animation_builder.evaluate_property(prop, time_seconds)
    return value if value is not None else default


def _flatten_shapes(shapes, groups, parent_matrix, time_seconds):
    strokes = []

    for shape in shapes:
        path_prop = shape.get("path") or {}
        shape_value = animation_builder.evaluate_property(path_prop, time_seconds)
        if not shape_value:
            continue

        points_out = []
        for pt in shape_value.get("points", []):
            vertex = pt["vertex"]
            in_tangent = pt["inTangent"]
            out_tangent = pt["outTangent"]

            vx = vertex[0] if len(vertex) > 0 else 0.0
            vy = vertex[1] if len(vertex) > 1 else 0.0

            itx = in_tangent[0] if len(in_tangent) > 0 else 0.0
            ity = in_tangent[1] if len(in_tangent) > 1 else 0.0

            otx = out_tangent[0] if len(out_tangent) > 0 else 0.0
            oty = out_tangent[1] if len(out_tangent) > 1 else 0.0

            world_v = coordinate_converter.transform_point(parent_matrix, vx, vy, 0.0)
            world_it = coordinate_converter.transform_vector(parent_matrix, itx, ity, 0.0)
            world_ot = coordinate_converter.transform_vector(parent_matrix, otx, oty, 0.0)

            points_out.append({
                "position": world_v,
                "handle_left": world_v + world_it,
                "handle_right": world_v + world_ot,
            })

        strokes.append({
            "closed": bool(shape_value.get("closed", False)),
            "points": points_out,
        })

    for group in groups:
        transform = group.get("transform", {}) or {}

        anchor = _eval_vec(transform.get("anchorPoint"), time_seconds, [0.0, 0.0])
        position = _eval_vec(transform.get("position"), time_seconds, [0.0, 0.0])
        scale = _eval_vec(transform.get("scale"), time_seconds, [100.0, 100.0])
        rotation = _eval_num(transform.get("rotation"), time_seconds, 0.0)
        skew = _eval_num(transform.get("skew"), time_seconds, 0.0)
        skew_axis = _eval_num(transform.get("skewAxis"), time_seconds, 0.0)

        local_matrix = coordinate_converter.build_local_matrix_2d(
            anchor, position, scale, rotation, skew, skew_axis
        )
        combined = parent_matrix @ local_matrix

        strokes.extend(
            _flatten_shapes(group.get("shapes", []), group.get("groups", []), combined, time_seconds)
        )

    return strokes


def _flatten_layer_at_time(layer, comp, pixel_scale, time_seconds, z_offset):
    transform = layer.get("transform", {}) or {}
    anchor = _eval_vec(transform.get("anchorPoint"), time_seconds, [0.0, 0.0, 0.0])

    # Root matrix only re-centers content around the layer's own
    # anchor point; the layer's own Position/Scale/Rotation are
    # applied natively by Blender on the object itself (see
    # animation_builder.apply_layer_animation), NOT baked here.
    root_matrix = Matrix.Translation((-anchor[0], -anchor[1], 0.0))

    raw_strokes = _flatten_shapes(
        layer.get("shapes", []), layer.get("groups", []), root_matrix, time_seconds
    )

    strokes = []
    for s in raw_strokes:
        points = []
        for p in s["points"]:
            pos = coordinate_converter.ae_delta_to_blender(p["position"].x, p["position"].y, p["position"].z, pixel_scale)
            pos.z += z_offset

            hl = coordinate_converter.ae_delta_to_blender(p["handle_left"].x, p["handle_left"].y, p["handle_left"].z, pixel_scale)
            hl.z += z_offset

            hr = coordinate_converter.ae_delta_to_blender(p["handle_right"].x, p["handle_right"].y, p["handle_right"].z, pixel_scale)
            hr.z += z_offset

            points.append({"position": pos, "handle_left": hl, "handle_right": hr})

        strokes.append({"closed": s["closed"], "points": points})

    return strokes


# -------------------------------------------------------------
# Grease Pencil 3.0 low-level writing
# -------------------------------------------------------------

def _clear_frames(gp_data):
    for layer in list(gp_data.layers):
        try:
            gp_data.layers.remove(layer)
        except Exception:
            pass


def _ensure_material(gp_data, log):
    material = bpy.data.materials.get(MATERIAL_NAME)
    if material is None:
        material = bpy.data.materials.new(MATERIAL_NAME)

    if not material.is_grease_pencil:
        try:
            bpy.data.materials.create_gpencil_data(material)
        except Exception as e:
            log.warn("Gagal membuat data material Grease Pencil: " + str(e))

    try:
        material.grease_pencil.show_stroke = True
        material.grease_pencil.show_fill = False
        material.grease_pencil.color = (1.0, 1.0, 1.0, 1.0)
    except Exception:
        pass

    existing_names = [m.name for m in gp_data.materials if m is not None]
    if material.name not in existing_names:
        gp_data.materials.append(material)

    return material


def _write_drawing(drawing, strokes, pixel_scale, log):
    if not strokes:
        return

    sizes = [max(1, len(s["points"])) for s in strokes]

    try:
        drawing.add_strokes(sizes)
    except Exception as e:
        log.error("Gagal membuat stroke pada drawing: " + str(e))
        return

    radius = max(0.0005, 1.5 * pixel_scale)

    stroke_indices = list(range(len(strokes)))
    try:
        drawing.set_types(type="BEZIER", indices=stroke_indices)
    except Exception as e:
        log.error("Gagal set curve type BEZIER: " + str(e))

    for i, stroke_data in enumerate(strokes):
        try:
            stroke = drawing.strokes[i]
        except Exception as e:
            log.error("Gagal mengakses stroke #" + str(i) + ": " + str(e))
            continue

        try:
            stroke.cyclic = stroke_data["closed"]
        except Exception:
            pass

        points = stroke_data["points"]

        for j, point in enumerate(stroke.points):
            src = points[j] if j < len(points) else points[-1]

            try:
                point.position = src["position"]
                point.radius = radius
                point.opacity = 1.0
            except Exception as e:
                log.error("Gagal menulis titik #" + str(j) + " pada stroke #" + str(i) + ": " + str(e))

            try:
                point.handle_left.position = src["handle_left"]
                point.handle_right.position = src["handle_right"]
            except Exception as e:
                log.warn("Handle Left/Right tidak dapat ditulis pada titik #" + str(j) + ": " + str(e))

            try:
                point.handle_left.type = 'FREE'
                point.handle_right.type = 'FREE'
            except Exception:
                pass

    try:
        drawing.tag_positions_changed()
    except Exception as e:
        log.warn("tag_positions_changed() gagal: " + str(e))