# =============================================================
# TH0R19 AE - Blender Add-on
# coordinate_converter.py
# Coordinate Converter: converts After Effects pixel-space
# coordinates (X right, Y down, origin top-left) into Blender
# world-space coordinates (X right, Y up, Z toward camera),
# and builds the 2D affine matrices used to compose nested
# Shape Group transforms (Anchor -> Scale -> Skew -> Rotate ->
# Position), exactly mirroring After Effects' own evaluation
# order.
#
# Design notes (see README for the full derivation):
#   - A single Y axis flip is applied only once, at the very
#     final step of converting a fully-composed AE-space point
#     into Blender-space. This is NOT a mirror: because the
#     camera's "up" direction is flipped too (Blender view is
#     Y-up, AE view is Y-down), the rendered image keeps the
#     same left-right / up-down orientation as After Effects.
#   - Because the axis flip is applied only once, at the end,
#     every rotation composed *before* that point (i.e. every
#     Shape Group's own rotation, baked directly into vertex
#     positions) uses the plain, unmodified 2D rotation matrix
#     with After Effects' own numbers - no sign flip needed.
#   - The *object-level* rotation (the Shape Layer's own
#     rotation, applied natively by Blender AFTER conversion to
#     Blender space) does need a sign flip, because at that
#     point the data already lives in Blender's Y-up space.
#     See animation_builder.py for that specific case.
# =============================================================

import math
from mathutils import Vector, Matrix


def ae_point_to_blender(x, y, z, comp_width, comp_height, pixel_scale):
    """
    Convert an ABSOLUTE AE composition-space point (pixels,
    origin top-left) into an absolute Blender world-space Vector.
    Origin is re-centered to the middle of the composition.
    """
    bx = (x - (comp_width / 2.0)) * pixel_scale
    by = ((comp_height / 2.0) - y) * pixel_scale
    bz = -z * pixel_scale
    return Vector((bx, by, bz))


def ae_delta_to_blender(dx, dy, dz, pixel_scale):
    """
    Convert a RELATIVE / local AE-space vector (already relative
    to some local origin, e.g. a layer's own anchor point) into
    a Blender-space Vector. No composition-center offset is
    applied here, only the axis flip + scale.
    """
    return Vector((
        dx * pixel_scale,
        -dy * pixel_scale,
        -dz * pixel_scale
    ))


def build_local_matrix_2d(anchor, position, scale, rotation_deg, skew=0.0, skew_axis=0.0):
    """
    Builds the local 2D affine transform for one Shape Group
    level, expressed entirely in AE's own coordinate numbers
    (X right, Y down, degrees clockwise-positive), following
    After Effects' own evaluation order:

        point -> translate(-anchor) -> scale -> skew -> rotate -> translate(+position)

    Returns a mathutils.Matrix (4x4) that maps a point defined
    in this group's local space into its PARENT's local space.
    """
    ax = anchor[0] if len(anchor) > 0 else 0.0
    ay = anchor[1] if len(anchor) > 1 else 0.0

    px = position[0] if len(position) > 0 else 0.0
    py = position[1] if len(position) > 1 else 0.0

    sx = (scale[0] if len(scale) > 0 else 100.0) / 100.0
    sy = (scale[1] if len(scale) > 1 else 100.0) / 100.0

    theta = math.radians(rotation_deg or 0.0)

    skew_rad = math.radians(skew or 0.0)
    skew_axis_rad = math.radians(skew_axis or 0.0)
    tan_skew = math.tan(skew_rad)

    t1 = Matrix.Translation((-ax, -ay, 0.0))

    s = Matrix.Identity(4)
    s[0][0] = sx
    s[1][1] = sy

    # Shear along an axis rotated by skew_axis: rotate the shear
    # axis onto local X, apply a plain X/Y shear, rotate back.
    shear = Matrix.Identity(4)
    shear[0][1] = tan_skew

    rs = Matrix.Rotation(-skew_axis_rad, 4, 'Z')
    rs_inv = Matrix.Rotation(skew_axis_rad, 4, 'Z')
    skew_matrix = rs_inv @ shear @ rs

    r = Matrix.Rotation(theta, 4, 'Z')

    t2 = Matrix.Translation((px, py, 0.0))

    return t2 @ r @ skew_matrix @ s @ t1


def transform_point(matrix, x, y, z=0.0):
    """Transform an absolute point (w=1) through `matrix`."""
    v = Vector((x, y, z, 1.0))
    result = matrix @ v
    return Vector((result.x, result.y, result.z))


def transform_vector(matrix, x, y, z=0.0):
    """
    Transform a RELATIVE vector (w=0) through `matrix`, i.e. only
    the rotation/scale/skew part applies, translation is ignored.
    Used for Bezier tangent offsets, which are relative to their
    vertex, not absolute positions.
    """
    v = Vector((x, y, z, 0.0))
    result = matrix @ v
    return Vector((result.x, result.y, result.z))
