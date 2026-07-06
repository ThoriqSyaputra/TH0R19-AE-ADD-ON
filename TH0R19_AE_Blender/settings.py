# =============================================================
# TH0R19 AE - Blender Add-on
# settings.py
# Settings: PropertyGroup registered on bpy.types.Scene holding
# every piece of state the N-Panel needs (persisted inside the
# .blend file itself).
# =============================================================

import bpy


class TH0R19_Settings(bpy.types.PropertyGroup):
    json_path: bpy.props.StringProperty(
        name="Scene JSON",
        description="Path ke file thor19_scene.json hasil export TH0R19 AE (After Effects)",
        subtype='FILE_PATH',
        default=""
    )

    auto_refresh: bpy.props.BoolProperty(
        name="Auto Refresh",
        description="Perbarui scene Blender otomatis setiap kali file JSON berubah di disk",
        default=False
    )

    pixel_scale: bpy.props.FloatProperty(
        name="Pixel Scale",
        description="Skala konversi 1 pixel After Effects menjadi berapa unit Blender",
        default=0.01,
        min=0.0001,
        soft_min=0.001,
        soft_max=1.0,
        precision=5
    )

    status_log: bpy.props.StringProperty(
        name="Status Log",
        default=""
    )

    last_mtime: bpy.props.FloatProperty(
        name="Last Modified Time",
        default=0.0,
        options={'HIDDEN'}
    )

    last_import_ok: bpy.props.BoolProperty(
        name="Last Import OK",
        default=False,
        options={'HIDDEN'}
    )


classes = (
    TH0R19_Settings,
)


def register():
    for cls in classes:
        bpy.utils.register_class(cls)
    bpy.types.Scene.th0r19_ae = bpy.props.PointerProperty(type=TH0R19_Settings)


def unregister():
    del bpy.types.Scene.th0r19_ae
    for cls in reversed(classes):
        bpy.utils.unregister_class(cls)
