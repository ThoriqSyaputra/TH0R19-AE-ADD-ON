// =============================================================
// TH0R19 AE - modules/Settings.jsx
// Settings: persists plugin preferences via app.settings so
// they survive an After Effects restart.
// =============================================================

var TH0R19_Settings = (function () {

    var SECTION = "TH0R19_AE";
    var KEY_OUTPUT_FOLDER = "outputFolder";
    var KEY_AUTO_EXPORT = "autoExport";

    function getOutputFolder() {
        if (app.settings.haveSetting(SECTION, KEY_OUTPUT_FOLDER)) {
            return app.settings.getSetting(SECTION, KEY_OUTPUT_FOLDER);
        }
        return "";
    }

    function setOutputFolder(path) {
        app.settings.saveSetting(SECTION, KEY_OUTPUT_FOLDER, path || "");
    }

    function getAutoExport() {
        if (app.settings.haveSetting(SECTION, KEY_AUTO_EXPORT)) {
            return (app.settings.getSetting(SECTION, KEY_AUTO_EXPORT) === "true");
        }
        return false;
    }

    function setAutoExport(value) {
        app.settings.saveSetting(SECTION, KEY_AUTO_EXPORT, value ? "true" : "false");
    }

    return {
        getOutputFolder: getOutputFolder,
        setOutputFolder: setOutputFolder,
        getAutoExport: getAutoExport,
        setAutoExport: setAutoExport
    };

})();
