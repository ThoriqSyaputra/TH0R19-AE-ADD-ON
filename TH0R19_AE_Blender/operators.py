# =============================================================
# TH0R19 AE - Blender Add-on
# operators.py
# Operators: Browse JSON (opens the real file browser), Reload
# Scene (runs the full json_loader -> scene_builder pipeline
# with error handling), and Clear Log.
# =============================================================

import bpy

from . import json_loader
from . import scene_builder
from . import logger as th0r19_logger


class TH0R19_OT_browse_json(bpy.types.Operator):
    bl_idname = "th0r19.browse_json"
    bl_label = "Browse JSON"
    bl_description = "Pilih file thor19_scene.json hasil export TH0R19 AE"
    bl_options = {'REGISTER'}

    filepath: bpy.props.StringProperty(subtype='FILE_PATH')
    filter_glob: bpy.props.StringProperty(default="*.json", options={'HIDDEN'})

    def invoke(self, context, event):
        props = context.scene.th0r19_ae
        if props.json_path:
            self.filepath = bpy.path.abspath(props.json_path)
        context.window_manager.fileselect_add(self)
        return {'RUNNING_MODAL'}

    def execute(self, context):
        context.scene.th0r19_ae.json_path = self.filepath
        th0r19_logger.info("Scene JSON diset: " + self.filepath)
        return {'FINISHED'}


class TH0R19_OT_refresh_scene(bpy.types.Operator):
    bl_idname = "th0r19.refresh_scene"
    bl_label = "Reload Scene"
    bl_description = "Baca ulang thor19_scene.json dan bangun / perbarui scene Blender"
    bl_options = {'REGISTER', 'UNDO'}

    def execute(self, context):
        props = context.scene.th0r19_ae

        try:
            data = json_loader.load_scene_json(props.json_path, th0r19_logger)
            result = scene_builder.build_scene(data, props.pixel_scale, th0r19_logger)

            props.last_import_ok = True

            mtime = json_loader.get_mtime(props.json_path)
            if mtime is not None:
                props.last_mtime = mtime

            self.report(
                {'INFO'},
                "TH0R19 AE: Import Complete ({0} Shape Layer)".format(result["layer_count"])
            )

        except json_loader.TH0R19JSONError as e:
            props.last_import_ok = False
            th0r19_logger.error(str(e))
            self.report({'ERROR'}, str(e))
            return {'CANCELLED'}

        except Exception as e:
            props.last_import_ok = False
            th0r19_logger.error("Unexpected error: " + str(e))
            self.report({'ERROR'}, "TH0R19 AE gagal: " + str(e))
            return {'CANCELLED'}

        return {'FINISHED'}


class TH0R19_OT_view_log(bpy.types.Operator):
    bl_idname = "th0r19.view_log"
    bl_label = "View Log"
    bl_description = "Buka full log TH0R19 AE di window Text Editor terpisah"
    bl_options = {'REGISTER'}

    def execute(self, context):
        text_block = th0r19_logger.get_or_create_text_block()

        if not text_block.lines or (len(text_block.lines) == 1 and text_block.lines[0].body == ""):
            self.report({'INFO'}, "Log masih kosong.")

        # The log lives only in memory (bpy.data.texts), it has no
        # file on disk - so it must be shown by pointing a Text
        # Editor area's space_data.text at it directly. Using
        # text.open() or a "wm.text_open" operator would be wrong
        # here: those read a *file path* from disk, which this
        # datablock does not have.
        bpy.ops.wm.window_new()
        new_window = context.window_manager.windows[-1]
        area = new_window.screen.areas[0]
        area.type = 'TEXT_EDITOR'
        area.spaces[0].text = text_block

        return {'FINISHED'}


class TH0R19_OT_clear_log(bpy.types.Operator):
    bl_idname = "th0r19.clear_log"
    bl_label = "Clear Log"
    bl_description = "Bersihkan STATUS log"
    bl_options = {'REGISTER'}

    def execute(self, context):
        th0r19_logger.clear()
        return {'FINISHED'}


classes = (
    TH0R19_OT_browse_json,
    TH0R19_OT_refresh_scene,
    TH0R19_OT_view_log,
    TH0R19_OT_clear_log,
)


def register():
    for cls in classes:
        bpy.utils.register_class(cls)


def unregister():
    for cls in reversed(classes):
        bpy.utils.unregister_class(cls)
