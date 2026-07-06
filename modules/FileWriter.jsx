// =============================================================
// TH0R19 AE - modules/FileWriter.jsx
// File Writer: validates the output folder and writes the
// final JSON string to disk as UTF-8.
// =============================================================

var TH0R19_FileWriter = (function () {

    function writeJSON(folderPath, fileName, jsonString) {
        var folder = new Folder(folderPath);

        if (!folder.exists) {
            var created = folder.create();
            if (!created) {
                throw new Error("Tidak dapat membuat folder output: " + folderPath);
            }
        }

        var filePath = TH0R19_Utils.ensureTrailingSlash(folder.fsName) + fileName;
        var file = new File(filePath);
        file.encoding = "UTF-8";
        file.lineFeed = "Unix";

        var opened = file.open("w");
        if (!opened) {
            throw new Error("Tidak dapat membuka file untuk ditulis: " + filePath);
        }

        var writeOk = file.write(jsonString);
        file.close();

        if (!writeOk) {
            throw new Error("Gagal menulis konten ke file: " + filePath);
        }

        return filePath;
    }

    return {
        writeJSON: writeJSON
    };

})();
