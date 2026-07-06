// =============================================================
// TH0R19 AE - modules/UUIDGenerator.jsx
// UUID Generator: produces RFC4122-like v4 UUIDs.
// (ExtendScript has no crypto API, so Math.random is used.)
// =============================================================

var TH0R19_UUID = (function () {

    function generate() {
        var chars = "0123456789abcdef";
        var uuid = "";

        for (var i = 0; i < 36; i++) {
            if (i === 8 || i === 13 || i === 18 || i === 23) {
                uuid += "-";
            } else if (i === 14) {
                uuid += "4";
            } else if (i === 19) {
                var r = Math.floor(Math.random() * 4) + 8; // 8, 9, a, b
                uuid += chars.charAt(r);
            } else {
                uuid += chars.charAt(Math.floor(Math.random() * 16));
            }
        }

        return uuid;
    }

    return {
        generate: generate
    };

})();
