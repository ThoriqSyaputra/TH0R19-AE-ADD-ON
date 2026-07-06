if (typeof TH0R19 === "undefined") var TH0R19 = {};

TH0R19.ProjectParser = (function () {

    function getActiveComposition() {
        var item = app.project.activeItem;
        if (item && (item instanceof CompItem)) {
            return item;
        }
        for (var i = 1; i <= app.project.numItems; i++) {
            var candidate = app.project.item(i);
            if (candidate instanceof CompItem) {
                return candidate;
            }
        }
        return null;
    }

    function getProjectInfo() {
        var projFile = app.project.file;
        return {
            projectName: projFile ? projFile.name : "Untitled Project",
            projectPath: projFile ? projFile.fsName : "",
            exportedAt: new Date().toString(),
            exporterVersion: TH0R19.Constants.VERSION
        };
    }

    return {
        getActiveComposition: getActiveComposition,
        getProjectInfo: getProjectInfo
    };

})();
