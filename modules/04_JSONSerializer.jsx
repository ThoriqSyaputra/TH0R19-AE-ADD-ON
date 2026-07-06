if (typeof TH0R19 === "undefined") var TH0R19 = {};

TH0R19.JSONSerializer = (function () {

    function escapeString(str) {
        var out = "";
        for (var i = 0; i < str.length; i++) {
            var c = str.charAt(i);
            var code = str.charCodeAt(i);
            if (c === "\\") out += "\\\\";
            else if (c === "\"") out += "\\\"";
            else if (c === "\n") out += "\\n";
            else if (c === "\r") out += "\\r";
            else if (c === "\t") out += "\\t";
            else if (code < 0x20) out += "\\u" + TH0R19.Utils.padZero(code.toString(16), 4);
            else out += c;
        }
        return out;
    }

    function isArray(val) {
        return Object.prototype.toString.call(val) === "[object Array]";
    }

    function repeatIndent(indentStr, level) {
        var out = "";
        for (var i = 0; i < level; i++) out += indentStr;
        return out;
    }

    function stringifyArray(arr, indentLevel, indentStr) {
        if (arr.length === 0) return "[]";
        var childIndent = repeatIndent(indentStr, indentLevel + 1);
        var closeIndent = repeatIndent(indentStr, indentLevel);
        var parts = [];
        for (var i = 0; i < arr.length; i++) {
            parts.push(childIndent + stringifyValue(arr[i], indentLevel + 1, indentStr));
        }
        return "[\n" + parts.join(",\n") + "\n" + closeIndent + "]";
    }

    function stringifyObject(obj, indentLevel, indentStr) {
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) keys.push(k);
        }
        if (keys.length === 0) return "{}";
        var childIndent = repeatIndent(indentStr, indentLevel + 1);
        var closeIndent = repeatIndent(indentStr, indentLevel);
        var parts = [];
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var valStr = stringifyValue(obj[key], indentLevel + 1, indentStr);
            parts.push(childIndent + "\"" + escapeString(key) + "\": " + valStr);
        }
        return "{\n" + parts.join(",\n") + "\n" + closeIndent + "}";
    }

    function stringifyValue(val, indentLevel, indentStr) {
        if (val === null || val === undefined) {
            return "null";
        }
        var t = typeof val;
        if (t === "number") {
            if (isNaN(val) || !isFinite(val)) return "0";
            return String(val);
        }
        if (t === "boolean") {
            return val ? "true" : "false";
        }
        if (t === "string") {
            return "\"" + escapeString(val) + "\"";
        }
        if (isArray(val)) {
            return stringifyArray(val, indentLevel, indentStr);
        }
        if (t === "object") {
            return stringifyObject(val, indentLevel, indentStr);
        }
        return "null";
    }

    function stringify(obj, indentStr) {
        indentStr = indentStr || "  ";
        return stringifyValue(obj, 0, indentStr);
    }

    return {
        stringify: stringify
    };

})();
