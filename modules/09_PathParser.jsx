if (typeof TH0R19 === "undefined") var TH0R19 = {};

TH0R19.PathParser = (function () {

    function _getShapeProperty(pathGroup) {
        var prop = TH0R19.Utils.safeGetPropertyByMatchName(pathGroup, TH0R19.Constants.MATCHNAME_VECTOR_SHAPE);
        if (prop) return prop;
        try {
            return pathGroup.property("Path");
        } catch (e) {
            return null;
        }
    }

    function parsePathGroup(pathGroup) {
        var result = {
            type: "path",
            name: pathGroup.name,
            animated: false,
            closed: false,
            points: [],
            keyframes: []
        };

        var shapeProp = _getShapeProperty(pathGroup);
        if (!shapeProp) {
            return result;
        }

        var numKeys = 0;
        try {
            numKeys = shapeProp.numKeys;
        } catch (e) {
            numKeys = 0;
        }

        if (numKeys > 0) {
            result.animated = true;
            for (var i = 1; i <= numKeys; i++) {
                var keyTime = shapeProp.keyTime(i);
                var keyVal = shapeProp.keyValue(i);
                var parsed = TH0R19.BezierParser.parseShapeValue(keyVal);
                result.keyframes.push({
                    time: TH0R19.Utils.roundNumber(keyTime, 6),
                    closed: parsed.closed,
                    points: parsed.points
                });
            }
            if (result.keyframes.length > 0) {
                result.closed = result.keyframes[0].closed;
            }
        } else {
            var staticVal = shapeProp.value;
            var parsedStatic = TH0R19.BezierParser.parseShapeValue(staticVal);
            result.closed = parsedStatic.closed;
            result.points = parsedStatic.points;
        }

        return result;
    }

    return {
        parsePathGroup: parsePathGroup
    };

})();
