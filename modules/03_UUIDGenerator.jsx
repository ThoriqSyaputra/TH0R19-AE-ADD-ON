if (typeof TH0R19 === "undefined") var TH0R19 = {};

TH0R19.UUIDGenerator = (function () {

    function randomHex(len) {
        var chars = "0123456789abcdef";
        var out = "";
        for (var i = 0; i < len; i++) {
            out += chars.charAt(Math.floor(Math.random() * 16));
        }
        return out;
    }

    function generate() {
        var p1 = randomHex(8);
        var p2 = randomHex(4);
        var p3 = "4" + randomHex(3);
        var variantChars = "89ab";
        var variant = variantChars.charAt(Math.floor(Math.random() * 4));
        var p4 = variant + randomHex(3);
        var p5 = randomHex(12);
        return p1 + "-" + p2 + "-" + p3 + "-" + p4 + "-" + p5;
    }

    return {
        generate: generate
    };

})();
