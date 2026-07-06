// =============================================================
// TH0R19 AE - modules/Utils.jsx
// Utility Module: helper functions shared across the plugin.
// =============================================================

var TH0R19_Utils = (function () {

    function pad(num, size) {
        var s = String(num);
        while (s.length < size) s = "0" + s;
        return s;
    }

    function timestamp() {
        var d = new Date();
        return pad(d.getHours(), 2) + ":" + pad(d.getMinutes(), 2) + ":" + pad(d.getSeconds(), 2);
    }

    function isValidFolder(path) {
        if (!path || path === "") return false;
        var f = new Folder(path);
        return f.exists;
    }

    function safeNumber(n, fallback) {
        if (n === undefined || n === null || isNaN(n)) return (fallback || 0);
        return n;
    }

    function round(value, decimals) {
        var factor = Math.pow(10, decimals || 4);
        return Math.round(value * factor) / factor;
    }

    function roundArray(arr, decimals) {
        var out = [];
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] instanceof Array) {
                out.push(roundArray(arr[i], decimals));
            } else {
                out.push(round(safeNumber(arr[i], 0), decimals));
            }
        }
        return out;
    }

    function isShapeLayer(layer) {
        return (layer instanceof ShapeLayer);
    }

    function ensureTrailingSlash(path) {
        if (!path) return path;
        var last = path.charAt(path.length - 1);
        if (last === "/" || last === "\\") return path;
        return path + "/";
    }

    return {
        pad: pad,
        timestamp: timestamp,
        isValidFolder: isValidFolder,
        safeNumber: safeNumber,
        round: round,
        roundArray: roundArray,
        isShapeLayer: isShapeLayer,
        ensureTrailingSlash: ensureTrailingSlash
    };

})();
