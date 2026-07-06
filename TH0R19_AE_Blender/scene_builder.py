# =============================================================
# TH0R19 AE - Blender Add-on
# scene_builder.py
# Scene Builder: top-level orchestrator. Given the parsed JSON
# dict, this module sets up the managed collection, scene/render
# settings (fps, resolution, pixel aspect, frame range), the
# Orthographic camera, and iterates every Shape Layer, building
# or updating one Grease Pencil object per layer (matched by
# UUID so re-running never duplicates objects), then removes any
# managed object whose UUID no longer exists in the JSON.
# =============================================================

import bpy

from . import camera_builder
from . import grease_pencil_builder
from . import animation_builder
from . import uuid_manager

COLLECTION_NAME = "TH0R19_AE_Scene"


def _get_or_create_collection(scene, log):
    collection = bpy.data.collections.get(COLLECTION_NAME)
    if collection is None:
        collection = bpy.data.collections.new(COLLECTION_NAME)
        log.info("Membuat collection: " + COLLECTION_NAME)

    if collection.name not in scene.collection.children:
        scene.collection.children.link(collection)

    return collection


def _apply_scene_settings(scene, comp, log):
    fps = float(comp.get("frameRate", 30.0) or 30.0)
    scene.render.fps = int(round(fps))

    scene.render.resolution_x = max(1, int(comp.get("width", 1920)))
    scene.render.resolution_y = max(1, int(comp.get("height", 1080)))
    scene.render.resolution_percentage = 100

    pixel_aspect = comp.get("pixelAspect", 1.0) or 1.0
    scene.render.pixel_aspect_x = pixel_aspect
    scene.render.pixel_aspect_y = 1.0

    display_start_time = comp.get("displayStartTime", 0.0) or 0.0
    frame_offset = int(round(display_start_time * fps))

    duration_frames = comp.get("durationInFrames")
    if not duration_frames:
        duration_frames = int(round(comp.get("duration", 0.0) * fps))

    scene.frame_start = frame_offset
    scene.frame_end = max(frame_offset, frame_offset + int(duration_frames) - 1)
    scene.frame_current = scene.frame_start

    log.info(
        "Composition: {0}x{1} @ {2}fps, {3} frame".format(
            scene.render.resolution_x, scene.render.resolution_y, fps, duration_frames
        )
    )

    return fps, frame_offset


def build_scene(data, pixel_scale, log):
    scene = bpy.context.scene
    comp = data["composition"]

    collection = _get_or_create_collection(scene, log)
    fps, frame_offset = _apply_scene_settings(scene, comp, log)

    camera_builder.build_or_update_camera(comp, collection, pixel_scale, log)

    layers = comp.get("layers", [])
    log.info("Reading Layers... (" + str(len(layers)) + " Shape Layer)")

    valid_uuids = set()

    for layer in layers:
        layer_uuid = layer.get("uuid")
        layer_name = layer.get("name", layer_uuid or "Shape Layer")

        if not layer_uuid:
            log.warn("Layer tanpa UUID dilewati: " + str(layer_name))
            continue

        valid_uuids.add(layer_uuid)

        log.info("Reading Shape Layer: " + layer_name)

        existing_obj = uuid_manager.find_object_by_uuid(collection, layer_uuid)
        if existing_obj is not None:
            log.info("Updating Existing Object: " + layer_name)
        else:
            log.info("Building Grease Pencil: " + layer_name)

        obj = grease_pencil_builder.build_or_update_layer_object(
            layer, collection, existing_obj, comp, pixel_scale, fps, frame_offset, log
        )

        animation_builder.apply_layer_animation(obj, layer, comp, pixel_scale, fps, frame_offset, log)

        uuid_manager.tag_object(obj, layer_uuid)

    removed = uuid_manager.remove_stale_objects(collection, valid_uuids, log)
    if removed:
        log.info("Object dihapus (tidak ada lagi di JSON): " + str(removed))

    log.success("Scene Updated.")
    log.success("Import Complete.")

    return {
        "layer_count": len(layers),
        "removed_count": removed,
    }
