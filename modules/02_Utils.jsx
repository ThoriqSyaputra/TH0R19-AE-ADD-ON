if (typeof TH0R19 === "undefined") var TH0R19 = {};

TH0R19.Utils = (function () {

    function padZero(value, length) {
        var s = String(value);
        while (s.length < length) {
            s = "0" + s;
        }
        return s;
    }

    function nowTimestamp() {
        var d = new Date();
        var h = padZero(d.getHours(), 2);
        var m = padZero(d.getMinutes(), 2);
        var s = padZero(d.getSeconds(), 2);
        return "[" + h + ":" + m + ":" + s + "]";
    }

    function roundNumber(value, decimals) {
        if (typeof value !== "number" || isNaN(value)) return 0;
        var factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    }

    function isFolderValid(path) {
        if (!path || path === "") return false;
        var f = new Folder(path);
        return f.exists;
    }

    function safeGetPropertyByMatchName(group, matchName) {
        if (!group || !matchName) return null;
        try {
            var prop = group.property(matchName);
            return prop ? prop : null;
        } catch (e) {
            return null;
        }
    }

    function isShapeLayer(layer) {
        try {
            return (layer instanceof ShapeLayer);
        } catch (e) {
            return false;
        }
    }

    function vec2(x, y) {
        return [roundNumber(x, 6), roundNumber(y, 6)];
    }

    function vecN(arr) {
        var out = [];
        for (var i = 0; i < arr.length; i++) {
            out.push(roundNumber(arr[i], 6));
        }
        return out;
    }

    return {
        padZero: padZero,
        nowTimestamp: nowTimestamp,
        roundNumber: roundNumber,
        isFolderValid: isFolderValid,
        safeGetPropertyByMatchName: safeGetPropertyByMatchName,
        isShapeLayer: isShapeLayer,
        vec2: vec2,
        vecN: vecN
    };

})();
