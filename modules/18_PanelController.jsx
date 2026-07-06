if (typeof TH0R19 === "undefined") var TH0R19 = {};

TH0R19.PanelController = (function () {

    function init(ui) {
        TH0R19.Logger.init(ui.statusText);
        TH0R19.Logger.info("Plugin Loaded - TH0R19 AE v" + TH0R19.Constants.VERSION);

        var savedFolder = TH0R19.SettingsManager.loadFolder();
        if (savedFolder && TH0R19.Utils.isFolderValid(savedFolder)) {
            ui.folderText.text = savedFolder;
            TH0R19.Logger.info("Restored last output folder.");
        }

        ui.autoExportCheckbox.value = TH0R19.SettingsManager.loadAutoExport();

        ui.browseButton.onClick = function () {
            _onBrowse(ui);
        };

        ui.folderText.onChange = function () {
            _onFolderChange(ui);
        };

        ui.autoExportCheckbox.onClick = function () {
            TH0R19.SettingsManager.saveAutoExport(ui.autoExportCheckbox.value);
            TH0R19.Logger.info("Auto Export set to " + (ui.autoExportCheckbox.value ? "ON" : "OFF"));
        };

        ui.exportButton.onClick = function () {
            _onExport(ui);
        };

        if (ui.autoExportCheckbox.value === true) {
            _tryAutoExportOnLoad(ui);
        }
    }

    function _onBrowse(ui) {
        var selected = Folder.selectDialog("Pilih Output Folder");
        if (selected) {
            ui.folderText.text = selected.fsName;
            TH0R19.SettingsManager.saveFolder(selected.fsName);
            TH0R19.Logger.info("Output folder set: " + selected.fsName);
        }
    }

    function _onFolderChange(ui) {
        var path = ui.folderText.text;
        if (TH0R19.Utils.isFolderValid(path)) {
            TH0R19.SettingsManager.saveFolder(path);
            TH0R19.Logger.info("Output folder saved: " + path);
        } else {
            TH0R19.Logger.warn("Folder tidak valid: " + path);
        }
    }

    function _tryAutoExportOnLoad(ui) {
        var folder = ui.folderText.text;
        if (folder && TH0R19.Utils.isFolderValid(folder)) {
            TH0R19.Logger.info("Auto Export aktif, memulai export otomatis...");
            _runExport(ui, folder);
        }
    }

    function _onExport(ui) {
        var folder = ui.folderText.text;

        if (!folder || folder === "") {
            TH0R19.Logger.error("Output folder belum dipilih.");
            Window.alert("Silakan pilih Output Folder terlebih dahulu.");
            return;
        }

        if (!TH0R19.Utils.isFolderValid(folder)) {
            TH0R19.Logger.error("Output folder tidak valid: " + folder);
            Window.alert("Output folder tidak valid atau tidak ditemukan.");
            return;
        }

        _runExport(ui, folder);
    }

    function _runExport(ui, folder) {
        ui.exportButton.enabled = false;
        ui.progressBar.visible = true;
        ui.progressBar.value = 10;

        var result;
        try {
            result = TH0R19.ExportEngine.run(folder, function (msg) {
                TH0R19.Logger.info(msg);
                if (ui.progressBar.value < 90) {
                    ui.progressBar.value += 5;
                }
            });
        } catch (e) {
            result = { success: false, error: e.toString() };
        }

        ui.progressBar.value = 100;

        if (result.success) {
            TH0R19.Logger.success("Export Complete: " + result.path);
            TH0R19.Logger.success("Shape Layers exported: " + result.shapeLayerCount);
        } else {
            TH0R19.Logger.error("Error: " + result.error);
            Window.alert("Export Gagal:\n" + result.error);
        }

        ui.exportButton.enabled = true;
        ui.progressBar.visible = false;
        ui.progressBar.value = 0;
    }

    return {
        init: init
    };

})();
