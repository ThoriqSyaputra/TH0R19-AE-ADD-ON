# =============================================================
# TH0R19 AE - Blender Add-on
# panel.py
# Panel: the View3D > Sidebar (N-Panel) > "TH0R19 AE" tab.
# =============================================================

import bpy

_LOG_LINES_SHOWN = 16


class TH0R19_PT_main_panel(bpy.types.Panel):
    bl_label = "TH0R19 AE"
    bl_idname = "TH0R19_PT_main_panel"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = "TH0R19 AE"

    def draw(self, context):
        layout = self.layout
        props = context.scene.th0r19_ae

        header = layout.column(align=True)
        header.label(text="Scene Reconstruction Engine", icon='FILE_3D')

        json_box = layout.box()
        json_box.label(text="SCENE JSON")
        row = json_box.row(align=True)
        row.prop(props, "json_path", text="")
        row.operator("th0r19.browse_json", text="", icon='FILEBROWSER')

        reload_row = json_box.row(align=True)
        reload_row.scale_y = 1.4
        reload_row.operator("th0r19.refresh_scene", text="Reload Scene", icon='FILE_REFRESH')

        json_box.prop(props, "auto_refresh")

        settings_box = layout.box()
        settings_box.label(text="SETTINGS")
        settings_box.prop(props, "pixel_scale")

        status_box = layout.box()
        status_header = status_box.row()
        status_header.label(text="STATUS")
        status_header.operator("th0r19.view_log", text="", icon='TEXT')
        status_header.operator("th0r19.clear_log", text="", icon='TRASH')

        log_col = status_box.column(align=True)
        log_text = props.status_log

        if log_text:
            lines = log_text.split("\n")
            for line in lines[-_LOG_LINES_SHOWN:]:
                log_col.label(text=line)
        else:
            log_col.label(text="Ready")


classes = (
    TH0R19_PT_main_panel,
)


def register():
    for cls in classes:
        bpy.utils.register_class(cls)


def unregister():
    for cls in reversed(classes):
        bpy.utils.unregister_class(cls)
