//@target aftereffects
//@targetengine "TH0R19AE"

#include "modules/01_Constants.jsx"
#include "modules/02_Utils.jsx"
#include "modules/03_UUIDGenerator.jsx"
#include "modules/04_JSONSerializer.jsx"
#include "modules/05_Logger.jsx"
#include "modules/06_SettingsManager.jsx"
#include "modules/07_FileWriter.jsx"
#include "modules/08_BezierParser.jsx"
#include "modules/09_PathParser.jsx"
#include "modules/10_AnimationParser.jsx"
#include "modules/11_TransformParser.jsx"
#include "modules/12_ShapeParser.jsx"
#include "modules/13_LayerParser.jsx"
#include "modules/14_CompositionParser.jsx"
#include "modules/15_ProjectParser.jsx"
#include "modules/16_ExportEngine.jsx"
#include "modules/17_UIBuilder.jsx"
#include "modules/18_PanelController.jsx"

function buildTH0R19Panel(thisObj) {
    var win;

    if (thisObj instanceof Panel) {
        win = thisObj;
    } else {
        win = new Window("palette", TH0R19.Constants.PANEL_NAME, undefined, { resizeable: true });
    }

    var ui = TH0R19.UIBuilder.build(win);
    TH0R19.PanelController.init(ui);

    win.onResizing = win.onResize = function () {
        this.layout.resize();
    };

    win.layout.layout(true);

    if (win instanceof Window) {
        win.center();
        win.show();
    }

    return win;
}

buildTH0R19Panel(this);
