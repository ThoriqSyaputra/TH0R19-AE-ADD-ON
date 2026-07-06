if (typeof TH0R19 === "undefined") var TH0R19 = {};

TH0R19.SettingsManager = (function () {

    var SECTION = TH0R19.Constants.SETTINGS_SECTION;

    function saveFolder(path) {
        try {
            app.settings.saveSetting(SECTION, TH0R19.Constants.SETTINGS_KEY_FOLDER, path);
            return true;
        } catch (e) {
            return false;
        }
    }

    function loadFolder() {
        try {
            if (app.settings.haveSetting(SECTION, TH0R19.Constants.SETTINGS_KEY_FOLDER)) {
                return app.settings.getSetting(SECTION, TH0R19.Constants.SETTINGS_KEY_FOLDER);
            }
        } catch (e) {}
        return "";
    }

    function saveAutoExport(flag) {
        try {
            app.settings.saveSetting(SECTION, TH0R19.Constants.SETTINGS_KEY_AUTOEXPORT, flag ? "1" : "0");
            return true;
        } catch (e) {
            return false;
        }
    }

    function loadAutoExport() {
        try {
            if (app.settings.haveSetting(SECTION, TH0R19.Constants.SETTINGS_KEY_AUTOEXPORT)) {
                return app.settings.getSetting(SECTION, TH0R19.Constants.SETTINGS_KEY_AUTOEXPORT) === "1";
            }
        } catch (e) {}
        return false;
    }

    return {
        saveFolder: saveFolder,
        loadFolder: loadFolder,
        saveAutoExport: saveAutoExport,
        loadAutoExport: loadAutoExport
    };

})();
