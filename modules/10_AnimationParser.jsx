if (typeof TH0R19 === "undefined") var TH0R19 = {};

TH0R19.AnimationParser = (function () {

    function _normalizeValue(val) {
        if (val === null || val === undefined) return null;
        if (typeof val === "number") {
            return TH0R19.Utils.roundNumber(val, 6);
        }
        if (Object.prototype.toString.call(val) === "[object Array]") {
            return TH0R19.Utils.vecN(val);
        }
        return val;
    }

    function _interpTypeToString(t) {
        try {
            if (t === KeyframeInterpolationType.LINEAR) return "linear";
            if (t === KeyframeInterpolationType.BEZIER) return "bezier";
            if (t === KeyframeInterpolationType.HOLD) return "hold";
        } catch (e) {}
        return "linear";
    }

    function extractProperty(prop) {
        var result = {
            animated: false,
            value: null,
            keyframes: []
        };

        if (!prop) return result;

        var numKeys = 0;
        try {
            numKeys = prop.numKeys;
        } catch (e) {
            numKeys = 0;
        }

        if (numKeys > 0) {
            result.animated = true;
            for (var i = 1; i <= numKeys; i++) {
                var t = prop.keyTime(i);
                var v = prop.keyValue(i);
                var interpIn = "linear";
                var interpOut = "linear";
                try {
                    interpIn = _interpTypeToString(prop.keyInInterpolationType(i));
                    interpOut = _interpTypeToString(prop.keyOutInterpolationType(i));
                } catch (e2) {}

                result.keyframes.push({
                    time: TH0R19.Utils.roundNumber(t, 6),
                    value: _normalizeValue(v),
                    interpolationIn: interpIn,
                    interpolationOut: interpOut
                });
            }
        } else {
            try {
                result.value = _normalizeValue(prop.value);
            } catch (e3) {
                result.value = null;
            }
        }

        return result;
    }

    return {
        extractProperty: extractProperty
    };

})();
