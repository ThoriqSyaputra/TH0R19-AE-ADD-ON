if (typeof TH0R19 === "undefined") var TH0R19 = {};

TH0R19.UIBuilder = (function () {

    function build(container) {
        container.orientation = "column";
        container.alignChildren = ["fill", "top"];
        container.spacing = 8;
        container.margins = 12;

        var ui = {};

        var headerGroup = container.add("group");
        headerGroup.orientation = "column";
        headerGroup.alignChildren = ["left", "top"];
        headerGroup.spacing = 2;

        var titleText = headerGroup.add("statictext", undefined, TH0R19.Constants.PANEL_NAME);
        titleText.graphics.font = ScriptUI.newFont(titleText.graphics.font.name, "BOLD", 16);

        var subtitleText = headerGroup.add("statictext", undefined, TH0R19.Constants.PANEL_SUBTITLE);
        subtitleText.graphics.font = ScriptUI.newFont(subtitleText.graphics.font.name, "ITALIC", 11);

        var folderPanel = container.add("panel", undefined, "OUTPUT FOLDER");
        folderPanel.orientation = "row";
        folderPanel.alignChildren = ["fill", "center"];
        folderPanel.margins = 10;
        folderPanel.spacing = 6;

        ui.folderText = folderPanel.add("edittext", undefined, "");
        ui.folderText.alignment = ["fill", "center"];
        ui.folderText.preferredSize.width = 260;

        ui.browseButton = folderPanel.add("button", undefined, "Browse");
        ui.browseButton.preferredSize.width = 70;

        var autoExportGroup = container.add("group");
        autoExportGroup.orientation = "row";
        autoExportGroup.alignChildren = ["left", "center"];
        ui.autoExportCheckbox = autoExportGroup.add("checkbox", undefined, "Auto Export");

        ui.exportButton = container.add("button", undefined, "EXPORT SCENE");
        ui.exportButton.preferredSize.height = 34;

        ui.progressBar = container.add("progressbar", undefined, 0, 100);
        ui.progressBar.preferredSize.width = 300;
        ui.progressBar.visible = false;

        var statusPanel = container.add("panel", undefined, "STATUS");
        statusPanel.orientation = "column";
        statusPanel.alignChildren = ["fill", "fill"];
        statusPanel.margins = 8;
        statusPanel.alignment = ["fill", "fill"];

        ui.statusText = statusPanel.add(
            "edittext",
            undefined,
            "",
            { multiline: true, scrolling: true, readonly: true }
        );
        ui.statusText.preferredSize.height = 180;
        ui.statusText.preferredSize.width = 320;
        ui.statusText.alignment = ["fill", "fill"];

        var footerGroup = container.add("group");
        footerGroup.orientation = "row";
        footerGroup.alignChildren = ["left", "center"];
        var versionText = footerGroup.add("statictext", undefined, "v" + TH0R19.Constants.VERSION);
        versionText.graphics.font = ScriptUI.newFont(versionText.graphics.font.name, "REGULAR", 9);

        return ui;
    }

    return {
        build: build
    };

})();
