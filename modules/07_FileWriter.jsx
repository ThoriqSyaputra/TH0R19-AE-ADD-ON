if (typeof TH0R19 === "undefined") var TH0R19 = {};

TH0R19.FileWriter = (function () {

    function writeTextFile(folderPath, fileName, content) {
        var folder = new Folder(folderPath);
        if (!folder.exists) {
            var created = folder.create();
            if (!created) {
                return { success: false, error: "Tidak dapat membuat folder: " + folderPath };
            }
        }

        var normalized = folderPath.replace(/[\/\\]+$/, "");
        var filePath = normalized + "/" + fileName;

        var file = new File(filePath);
        file.encoding = "UTF8";
        file.lineFeed = "Unix";

        var opened = file.open("w");
        if (!opened) {
            return { success: false, error: "Tidak dapat membuka file untuk ditulis: " + filePath };
        }

        var written = file.write(content);
        file.close();

        if (!written) {
            return { success: false, error: "Gagal menulis konten ke file: " + filePath };
        }

        return { success: true, path: filePath };
    }

    return {
        writeTextFile: writeTextFile
    };

})();
