if (typeof TH0R19 === "undefined") var TH0R19 = {};

TH0R19.BezierParser = (function () {

    function parseShapeValue(shapeVal) {
        if (!shapeVal) {
            return { closed: false, points: [] };
        }

        var vertices = shapeVal.vertices || [];
        var inTangents = shapeVal.inTangents || [];
        var outTangents = shapeVal.outTangents || [];
        var closed = !!shapeVal.closed;

        var points = [];
        for (var i = 0; i < vertices.length; i++) {
            var v = vertices[i];
            var it = inTangents[i] || [0, 0];
            var ot = outTangents[i] || [0, 0];

            points.push({
                vertex: TH0R19.Utils.vec2(v[0], v[1]),
                inTangent: TH0R19.Utils.vec2(it[0], it[1]),
                outTangent: TH0R19.Utils.vec2(ot[0], ot[1])
            });
        }

        return {
            closed: closed,
            points: points
        };
    }

    return {
        parseShapeValue: parseShapeValue
    };

})();
