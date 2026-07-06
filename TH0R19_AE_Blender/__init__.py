# =============================================================
# TH0R19 AE - Blender Add-on
# __init__.py
# Entry point: bl_info + register()/unregister() wiring every
# module together. Install as a normal Blender Add-on (zip this
# folder, or place it directly inside Blender's addons folder).
# =============================================================

bl_info = {
    "name": "TH0R19 AE - Scene Reconstruction Engine",
    "author": "TH0R19",
    "version": (1, 0, 0),
    "blender": (4, 5, 0),
    "location": "View3D > Sidebar (N) > TH0R19 AE",
    "description": (
        "Import thor19_scene.json hasil export TH0R19 AE (After Effects) "
        "menjadi scene Grease Pencil di Blender: kamera, Shape Layer, "
        "transform dan animasi Bezier path."
    ),
    "category": "Import-Export",
}

from . import settings
from . import logger
from . import utils
from . import coordinate_converter
from . import uuid_manager
from . import json_loader
from . import camera_builder
from . import animation_builder
from . import grease_pencil_builder
from . import scene_builder
from . import operators
from . import auto_refresh
from . import panel


def register():
    settings.register()
    operators.register()
    panel.register()
    auto_refresh.register()


def unregister():
    auto_refresh.unregister()
    panel.unregister()
    operators.unregister()
    settings.unregister()


if __name__ == "__main__":
    register()
