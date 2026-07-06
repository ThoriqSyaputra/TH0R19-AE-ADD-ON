// =============================================================
// TH0R19 AE - ui/PanelBuilder.jsx
// Panel Builder: constructs the ScriptUI panel/window, wires
// every control to its handler, and connects Logger/Settings/
// ExportEngine to the UI.
// =============================================================

var TH0R19_PanelBuilder = (function () {

    function build(thisObj) {
        var panel = (thisObj instanceof Panel)
            ? thisObj
            : new Window("palette", "TH0R19 AE", undefined, { resizeable: true });

        panel.orientation = "column";
        panel.alignChildren = ["fill", "top"];
        panel.spacing = 8;
        panel.margins = 12;
        panel.minimumSize = [340, 500];

        // ---------------------------------------------------
        // Header
        // ---------------------------------------------------
        var headerGroup = panel.add("group");
        headerGroup.orientation = "column";
        headerGroup.alignChildren = ["left", "top"];
        headerGroup.spacing = 2;

        var title = headerGroup.add("statictext", undefined, "TH0R19 AE");
        try {
            title.graphics.font = ScriptUI.newFont(title.graphics.font.name, "BOLD", 16);
        } catch (e) {}

        var subtitle = headerGroup.add("statictext", undefined, "Scene Reconstruction Engine");
        try {
            subtitle.graphics.foregroundColor = subtitle.graphics.newPen(
                subtitle.graphics.PenType.SOLID_COLOR, [0.55, 0.55, 0.55, 1], 1
            );
        } catch (e) {}

        var divider1 = panel.add("panel");
        divider1.alignment = ["fill", "top"];

        // ---------------------------------------------------
        // Output Folder
        // ---------------------------------------------------
        var folderGroup = panel.add("panel", undefined, "OUTPUT FOLDER");
        folderGroup.orientation = "row";
        folderGroup.alignChildren = ["fill", "center"];
        folderGroup.margins = 10;
        folderGroup.spacing = 6;

        var folderInput = folderGroup.add("edittext", undefined, "");
        folderInput.alignment = ["fill", "center"];
        folderInput.characters = 20;

        var browseBtn = folderGroup.add("button", undefined, "Browse");
        browseBtn.preferredSize.width = 70;

        // ---------------------------------------------------
        // Auto Export
        // ---------------------------------------------------
        var autoExportCheckbox = panel.add("checkbox", undefined, "Auto Export (saat project di-save)");

        // ---------------------------------------------------
        // Export Button
        // ---------------------------------------------------
        var exportBtn = panel.add("button", undefined, "EXPORT SCENE");
        exportBtn.preferredSize.height = 34;
        try {
            exportBtn.graphics.font = ScriptUI.newFont(exportBtn.graphics.font.name, "BOLD", 12);
        } catch (e) {}

        // ---------------------------------------------------
        // Progress bar
        // ---------------------------------------------------
        var progressBar = panel.add("progressbar", undefined, 0, 100);
        progressBar.alignment = ["fill", "top"];
        progressBar.visible = false;

        // ---------------------------------------------------
        // Status / Log area
        // ---------------------------------------------------
        var statusPanel = panel.add("panel", undefined, "STATUS");
        statusPanel.orientation = "column";
        statusPanel.alignChildren = ["fill", "fill"];
        statusPanel.margins = 8;

        var statusText = statusPanel.add("edittext", undefined, "", { multiline: true, scrolling: true, readonly: true });
        statusText.alignment = ["fill", "fill"];
        statusText.preferredSize.height = 190;

        var clearLogBtn = statusPanel.add("button", undefined, "Clear Log");
        clearLogBtn.alignment = ["right", "top"];
        clearLogBtn.preferredSize.width = 80;

        // ---------------------------------------------------
        // Status bar (footer)
        // ---------------------------------------------------
        var statusBarGroup = panel.add("group");
        statusBarGroup.orientation = "row";
        statusBarGroup.alignChildren = ["left", "center"];

        var statusBar = statusBarGroup.add("statictext", undefined, "Ready");
        statusBar.alignment = ["fill", "bottom"];

        // ---------------------------------------------------
        // Wire up Logger
        // ---------------------------------------------------
        TH0R19_Logger.init(statusText);

        // ---------------------------------------------------
        // Load persisted settings
        // ---------------------------------------------------
        var savedFolder = TH0R19_Settings.getOutputFolder();
        if (savedFolder) {
            folderInput.text = savedFolder;
        }
        autoExportCheckbox.value = TH0R19_Settings.getAutoExport();

        TH0R19_Logger.info("Plugin Loaded");

        if (!TH0R19_Utils.isValidFolder(folderInput.text)) {
            TH0R19_Logger.warn("Output folder belum diset / tidak valid.");
        }

        // ---------------------------------------------------
        // Event Handlers
        // ---------------------------------------------------
        browseBtn.onClick = function () {
            var startFolder = TH0R19_Utils.isValidFolder(folderInput.text)
                ? new Folder(folderInput.text)
                : Folder.myDocuments;

            var selected = Folder.selectDialog("Pilih Folder Output TH0R19 AE", startFolder);
            if (selected) {
                folderInput.text = selected.fsName;
                TH0R19_Settings.setOutputFolder(selected.fsName);
                TH0R19_Logger.info("Output folder diset: " + selected.fsName);
                statusBar.text = "Folder set: " + selected.fsName;
            }
        };

        folderInput.onChange = function () {
            TH0R19_Settings.setOutputFolder(folderInput.text);
        };

        autoExportCheckbox.onClick = function () {
            TH0R19_Settings.setAutoExport(autoExportCheckbox.value);
            TH0R19_Logger.info("Auto Export: " + (autoExportCheckbox.value ? "ON" : "OFF"));
        };

        clearLogBtn.onClick = function () {
            TH0R19_Logger.clear();
            TH0R19_Logger.info("Log dibersihkan.");
        };

        function runExport() {
            var folderPath = folderInput.text;

            if (!folderPath || folderPath === "") {
                TH0R19_Logger.error("Output folder belum dipilih.");
                statusBar.text = "Error: Output folder belum dipilih";
                Window.alert("Silakan pilih Output Folder terlebih dahulu.");
                return;
            }

            exportBtn.enabled = false;
            progressBar.visible = true;
            progressBar.value = 10;
            statusBar.text = "Exporting...";

            try {
                progressBar.value = 35;
                var resultPath = TH0R19_ExportEngine.exportActiveComposition(folderPath);
                progressBar.value = 100;
                statusBar.text = "Export Complete: " + resultPath;
            } catch (err) {
                TH0R19_Logger.error(err.toString());
                statusBar.text = "Error: " + err.toString();
                Window.alert("Export gagal:\n" + err.toString());
            } finally {
                exportBtn.enabled = true;
                progressBar.visible = false;
            }
        }

        exportBtn.onClick = runExport;

        // ---------------------------------------------------
        // Auto Export watcher: polls app.project.file.modified
        // via app.scheduleTask and triggers export automatically
        // whenever the project has just been saved.
        // ---------------------------------------------------
        function _startAutoExportWatcher() {
            $.global.TH0R19_lastSavedTime = null;
            $.global.TH0R19_checkAutoExport = function () {
                try {
                    if (!autoExportCheckbox.value) return;

                    var proj = app.project;
                    if (!proj || !proj.file) return;

                    var modified = proj.file.modified.getTime();

                    if ($.global.TH0R19_lastSavedTime === null) {
                        $.global.TH0R19_lastSavedTime = modified;
                        return;
                    }

                    if (modified !== $.global.TH0R19_lastSavedTime) {
                        $.global.TH0R19_lastSavedTime = modified;
                        TH0R19_Logger.info("Project save terdeteksi, menjalankan Auto Export...");
                        runExport();
                    }
                } catch (e) {
                    // silently ignore, watcher must never crash AE's idle loop
                }
            };

            app.scheduleTask("$.global.TH0R19_checkAutoExport()", 2000, true);
        }

        _startAutoExportWatcher();

        // ---------------------------------------------------
        // Layout
        // ---------------------------------------------------
        panel.onResizing = panel.onResize = function () {
            this.layout.resize();
        };

        if (panel instanceof Window) {
            panel.center();
            panel.show();
        } else {
            panel.layout.layout(true);
        }

        return panel;
    }

    return {
        build: build
    };

})();
