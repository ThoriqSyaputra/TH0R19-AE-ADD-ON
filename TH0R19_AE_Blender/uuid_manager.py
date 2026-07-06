# =============================================================
# TH0R19 AE - Blender Add-on
# uuid_manager.py
# UUID Manager: tracks the identity of every Blender object this
# add-on creates via a custom property (th0r19_uuid), so a
# Reload Scene can update existing objects, create new ones, and
# delete ones that no longer exist in the JSON - without ever
# creating duplicates.
# =============================================================

import bpy

from . import utils

UUID_PROP = "th0r19_uuid"
MANAGED_PROP = "th0r19_managed"


def tag_object(obj, uuid):
    obj[UUID_PROP] = uuid
    obj[MANAGED_PROP] = True


def get_uuid(obj):
    return obj.get(UUID_PROP)


def find_object_by_uuid(collection, uuid):
    for obj in collection.objects:
        if obj.get(UUID_PROP) == uuid:
            return obj
    return None


def collect_managed_uuids(collection):
    result = {}
    for obj in collection.objects:
        u = obj.get(UUID_PROP)
        if u and obj.get(MANAGED_PROP):
            result[u] = obj
    return result


def remove_stale_objects(collection, valid_uuids, log):
    """
    Removes every managed object whose UUID is no longer present
    in `valid_uuids` (i.e. it was deleted from the AE composition).
    Returns the number of objects removed.
    """
    existing = collect_managed_uuids(collection)
    removed = 0

    for uuid, obj in existing.items():
        if uuid in valid_uuids:
            continue

        log.info("Menghapus object yang sudah tidak ada di JSON: " + obj.name)

        data_block = obj.data
        obj_type = obj.type

        try:
            bpy.data.objects.remove(obj, do_unlink=True)
        except Exception as e:
            log.warn("Gagal menghapus object '" + obj.name + "': " + str(e))
            continue

        _remove_orphan_data(data_block, obj_type)
        removed += 1

    return removed


def _remove_orphan_data(data_block, obj_type):
    if data_block is None:
        return
    try:
        if data_block.users > 0:
            return
        if obj_type == 'GREASEPENCIL':
            utils.remove_grease_pencil_data(data_block)
        elif obj_type == 'CAMERA':
            bpy.data.cameras.remove(data_block)
    except Exception:
        # non-critical: an orphan data-block left behind does not
        # affect scene correctness, only file cleanliness.
        pass
