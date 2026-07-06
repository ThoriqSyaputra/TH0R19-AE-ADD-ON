// =============================================================
// TH0R19 AE - modules/JSONSerializer.jsx
// JSON Export System: converts plain ExtendScript objects into
// clean, human-readable, indented JSON text. ExtendScript does
// not reliably expose a native JSON global, so this is a
// self-contained serializer with no external dependency.
// =============================================================

var TH0R19_JSON = (function () {

    function _escape(str) {
        return String(str)
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"')
            .replace(/\n/g, "\\n")
            .replace(/\r/g, "\\r")
            .replace(/\t/g, "\\t");
    }

    function _indent(level) {
        var s = "";
        for (var i = 0; i < level; i++) s += "    ";
        return s;
    }

    function stringify(value, level) {
        level = level || 0;

        if (value === null || value === undefined) {
            return "null";
        }

        var type = typeof value;

        if (type === "number") {
            if (isNaN(value) || !isFinite(value)) return "0";
            return String(value);
        }

        if (type === "boolean") {
            return value ? "true" : "false";
        }

        if (type === "string") {
            return '"' + _escape(value) + '"';
        }

        if (value instanceof Array) {
            if (value.length === 0) return "[]";
            var itemsArr = [];
            for (var i = 0; i < value.length; i++) {
                itemsArr.push(_indent(level + 1) + stringify(value[i], level + 1));
            }
            return "[\n" + itemsArr.join(",\n") + "\n" + _indent(level) + "]";
        }

        if (type === "object") {
            var keys = [];
            for (var k in value) {
                if (value.hasOwnProperty(k)) keys.push(k);
            }
            if (keys.length === 0) return "{}";
            var itemsObj = [];
            for (var j = 0; j < keys.length; j++) {
                var key = keys[j];
                itemsObj.push(_indent(level + 1) + '"' + _escape(key) + '": ' + stringify(value[key], level + 1));
            }
            return "{\n" + itemsObj.join(",\n") + "\n" + _indent(level) + "}";
        }

        return "null";
    }

    return {
        stringify: stringify
    };

})();
