if (typeof TH0R19 === "undefined") var TH0R19 = {};

TH0R19.ExportEngine = (function () {

    function run(outputFolder, onProgress) {
        var log = onProgress || function () {};

        log("Reading Project...");

        if (!outputFolder || !TH0R19.Utils.isFolderValid(outputFolder)) {
            return { success: false, error: "Output folder tidak valid: " + outputFolder };
        }

        var comp = TH0R19.ProjectParser.getActiveComposition();
        if (!comp) {
            return { success: false, error: "Tidak ada composition aktif ditemukan." };
        }

        log("Composition Found: " + comp.name);
        log("Reading Layers...");

        var compositionData = TH0R19.CompositionParser.parseComposition(comp, log);

        if (compositionData.shapeLayerCount === 0) {
            log("Warning: Tidak ada Shape Layer pada composition ini.");
        }

        log("Building Scene Object...");

        var scene = {
            meta: TH0R19.ProjectParser.getProjectInfo(),
            composition: compositionData
        };

        log("Writing JSON...");

        var jsonText = TH0R19.JSONSerializer.stringify(scene, TH0R19.Constants.JSON_INDENT);

        var writeResult = TH0R19.FileWriter.writeTextFile(
            outputFolder,
            TH0R19.Constants.EXPORT_FILENAME,
            jsonText
        );

        if (!writeResult.success) {
            return { success: false, error: writeResult.error };
        }

        return {
            success: true,
            path: writeResult.path,
            shapeLayerCount: compositionData.shapeLayerCount
        };
    }

    return {
        run: run
    };

})();
