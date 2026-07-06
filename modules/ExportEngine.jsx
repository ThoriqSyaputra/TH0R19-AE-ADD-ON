// =============================================================
// TH0R19 AE - modules/ExportEngine.jsx
// Export Engine: orchestrates project validation, composition
// parsing, JSON serialization and file writing. This is the
// single entry point PanelBuilder calls when EXPORT SCENE is
// pressed (or when Auto Export triggers).
// =============================================================

var TH0R19_ExportEngine = (function () {

    var SCHEMA_VERSION = "1.0.0";
    var FILE_NAME = "thor19_scene.json";

    function getActiveComposition() {
        var proj = app.project;
        if (!proj) {
            throw new Error("Tidak ada project After Effects yang terbuka.");
        }

        var activeItem = proj.activeItem;
        if (!activeItem || !(activeItem instanceof CompItem)) {
            throw new Error("Tidak ada Composition aktif. Buka / pilih composition terlebih dahulu.");
        }

        return activeItem;
    }

    function buildScene(comp) {
        var compData = TH0R19_CompositionParser.parse(comp);

        return {
            meta: {
                generator: "TH0R19 AE",
                schemaVersion: SCHEMA_VERSION,
                exportedAt: new Date().toString(),
                projectName: (app.project.file ? app.project.file.name : "Untitled Project")
            },
            composition: compData
        };
    }

    function exportActiveComposition(outputFolder) {
        if (!outputFolder || outputFolder === "") {
            throw new Error("Output folder belum diset.");
        }

        var folder = new Folder(outputFolder);
        if (!folder.exists) {
            if (!folder.create()) {
                throw new Error("Folder output tidak valid dan gagal dibuat: " + outputFolder);
            }
        }

        TH0R19_Logger.info("Membaca project aktif...");
        var comp = getActiveComposition();

        var scene = buildScene(comp);

        if (scene.composition.layers.length === 0) {
            TH0R19_Logger.warn("Tidak ada Shape Layer pada composition ini.");
        }

        TH0R19_Logger.info("Writing JSON...");
        var jsonString = TH0R19_JSON.stringify(scene, 0);

        var filePath = TH0R19_FileWriter.writeJSON(outputFolder, FILE_NAME, jsonString);

        TH0R19_Logger.success("Export Complete: " + filePath);

        return filePath;
    }

    return {
        exportActiveComposition: exportActiveComposition,
        getActiveComposition: getActiveComposition,
        FILE_NAME: FILE_NAME
    };

})();
