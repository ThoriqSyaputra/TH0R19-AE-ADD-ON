# =============================================================
# TH0R19 AE - Blender Add-on
# camera_builder.py
# Camera Builder: creates/updates a single Orthographic camera
# sized so its view exactly frames the AE composition (width,
# height, pixel aspect), so what is visible from this camera
# matches what is visible in the After Effects composition.
# =============================================================

import bpy

CAMERA_NAME = "TH0R19_Camera"


def build_or_update_camera(comp, collection, pixel_scale, log):
    width = float(comp.get("width", 1920))
    height = float(comp.get("height", 1080))
    pixel_aspect = comp.get("pixelAspect", 1.0) or 1.0

    cam_data = bpy.data.cameras.get(CAMERA_NAME)
    if cam_data is None:
        cam_data = bpy.data.cameras.new(CAMERA_NAME)

    cam_data.type = 'ORTHO'
    cam_data.clip_start = 0.001
    cam_data.clip_end = 100000.0

    effective_width = width * pixel_aspect
    world_width = effective_width * pixel_scale
    world_height = height * pixel_scale

    # Blender's ortho_scale always represents the LARGER of the
    # camera's view dimensions when sensor_fit is AUTO; since we
    # also drive the render resolution from the same width/height
    # in scene_builder.py, AUTO sensor fit keeps the aspect correct.
    cam_data.ortho_scale = max(world_width, world_height)
    cam_data.sensor_fit = 'AUTO'

    obj = bpy.data.objects.get(CAMERA_NAME)
    if obj is None:
        obj = bpy.data.objects.new(CAMERA_NAME, cam_data)

    if obj.data is not cam_data:
        obj.data = cam_data

    if collection.objects.get(CAMERA_NAME) is None:
        collection.objects.link(obj)

    # Camera sits above the composition on +Z, looking straight
    # down toward -Z (rotation_euler = 0,0,0 means the camera's
    # local -Z is world -Z, local +Y is world +Y == "up" on screen).
    distance = max(world_width, world_height) * 2.0 + 10.0
    obj.location = (0.0, 0.0, distance)
    obj.rotation_euler = (0.0, 0.0, 0.0)

    log.info("Camera Orthographic siap: {0}x{1} (pixelAspect {2})".format(
        int(width), int(height), pixel_aspect
    ))

    return obj
