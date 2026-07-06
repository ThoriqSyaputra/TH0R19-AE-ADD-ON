// =============================================================
// TH0R19 AE - modules/PathParser.jsx
// Path Parser / Bezier Parser: converts an AE Shape value
// (vertices, inTangents, outTangents, closed) into a clean,
// Blender-friendly structure, static or animated.
// =============================================================

var TH0R19_PathParser = (function () {

    // shapeToStruct: converts a single AE Shape object (as
    // returned by property.value or property.keyValue(i)) into
    // a plain array of { vertex, inTangent, outTangent } points.
    function shapeToStruct(shapeValue) {
        var vertices = shapeValue.vertices || [];
        var inTangents = shapeValue.inTangents || [];
        var outTangents = shapeValue.outTangents || [];
        var closed = !!shapeValue.closed;

        var points = [];
        for (var i = 0; i < vertices.length; i++) {
            points.push({
                vertex: TH0R19_Utils.roundArray(vertices[i], 4),
                inTangent: inTangents[i] ? TH0R19_Utils.roundArray(inTangents[i], 4) : [0, 0],
                outTangent: outTangents[i] ? TH0R19_Utils.roundArray(outTangents[i], 4) : [0, 0]
            });
        }

        return {
            closed: closed,
            pointCount: points.length,
            points: points
        };
    }

    // parsePathProperty: reads the "ADBE Vector Shape" property
    // (static or animated) and returns { animated, value, keyframes }
    // where each value/keyframe.value is a shapeToStruct() result.
    function parsePathProperty(pathProperty) {
        return TH0R19_AnimationParser.extractProperty(pathProperty, shapeToStruct);
    }

    return {
        shapeToStruct: shapeToStruct,
        parsePathProperty: parsePathProperty
    };

})();
