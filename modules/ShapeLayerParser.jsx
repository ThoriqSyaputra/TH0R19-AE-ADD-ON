// =============================================================
// TH0R19 AE - modules/ShapeLayerParser.jsx
// Shape Layer Parser / Shape Group Parser: recursively walks a
// Shape Layer's "Contents" tree, extracting Vector Groups and
// Vector Path shapes. Fill / Stroke / Gradient / Trim Path /
// Merge Path / Repeater and parametric primitives (Rect/Ellipse/
// Star) are intentionally skipped for this phase (Bezier Path
// shapes only), per project scope.
// =============================================================

var TH0R19_ShapeLayerParser = (function () {

    var MATCH_VECTOR_GROUP = "ADBE Vector Group";
    var MATCH_GROUP_CONTENTS = "ADBE Vectors Group";
    var MATCH_GROUP_TRANSFORM = "ADBE Vector Transform Group";
    var MATCH_PATH_SHAPE = "ADBE Vector Shape - Group";
    var MATCH_PATH_VALUE = "ADBE Vector Shape";

    function _numberMapper(v) {
        return TH0R19_Utils.round(TH0R19_Utils.safeNumber(v, 0), 4);
    }

    function _arrayMapper(v) {
        if (v instanceof Array) return TH0R19_Utils.roundArray(v, 4);
        return [TH0R19_Utils.round(TH0R19_Utils.safeNumber(v, 0), 4)];
    }

    // Per-group (subgroup) transform. Vector Group transform uses
    // different matchNames than the layer-level Transform Group.
    function _parseGroupTransform(groupItem) {
        var transform = {
            anchorPoint: { animated: false, value: [0, 0], keyframes: [] },
            position: { animated: false, value: [0, 0], keyframes: [] },
            scale: { animated: false, value: [100, 100], keyframes: [] },
            rotation: { animated: false, value: 0, keyframes: [] },
            opacity: { animated: false, value: 100, keyframes: [] },
            skew: { animated: false, value: 0, keyframes: [] },
            skewAxis: { animated: false, value: 0, keyframes: [] }
        };

        var transformGroup;
        try {
            transformGroup = groupItem.property(MATCH_GROUP_TRANSFORM);
        } catch (e) {
            return transform;
        }
        if (!transformGroup) return transform;

        var propertyMap = {
            anchorPoint: "ADBE Vector Anchor",
            position: "ADBE Vector Position",
            scale: "ADBE Vector Scale",
            rotation: "ADBE Vector Rotation",
            opacity: "ADBE Vector Group Opacity",
            skew: "ADBE Vector Skew",
            skewAxis: "ADBE Vector Skew Axis"
        };

        for (var key in propertyMap) {
            if (!propertyMap.hasOwnProperty(key)) continue;

            var prop = null;
            try {
                prop = transformGroup.property(propertyMap[key]);
            } catch (e) {
                prop = null;
            }
            if (!prop) continue;

            var isScalar = (key === "rotation" || key === "opacity" || key === "skew" || key === "skewAxis");
            var mapper = isScalar ? _numberMapper : _arrayMapper;

            transform[key] = TH0R19_AnimationParser.extractProperty(prop, mapper);
        }

        return transform;
    }

    // _parseContents: iterates one "Contents" PropertyGroup level,
    // routing each child to either a path shape or a nested group.
    function _parseContents(contentsGroup, depthLabel) {
        var shapes = [];
        var groups = [];

        var count = contentsGroup.numProperties;
        for (var i = 1; i <= count; i++) {
            var item;
            try {
                item = contentsGroup.property(i);
            } catch (e) {
                continue;
            }
            if (!item) continue;

            var matchName = item.matchName;

            if (matchName === MATCH_VECTOR_GROUP) {
                groups.push(_parseGroup(item));
            } else if (matchName === MATCH_PATH_SHAPE) {
                var pathValueProp = null;
                try {
                    pathValueProp = item.property(MATCH_PATH_VALUE);
                } catch (e) {
                    pathValueProp = null;
                }

                if (pathValueProp) {
                    var pathData = TH0R19_PathParser.parsePathProperty(pathValueProp);
                    shapes.push({
                        uuid: TH0R19_UUID.generate(),
                        type: "path",
                        name: item.name,
                        path: pathData
                    });
                    TH0R19_Logger.info(depthLabel + "Path ditemukan: " + item.name);
                }
            } else {
                TH0R19_Logger.warn(depthLabel + "Melewati shape non-path (di luar scope Phase 1): " + item.name + " [" + matchName + "]");
            }
        }

        return { shapes: shapes, groups: groups };
    }

    function _parseGroup(groupItem) {
        var vectorsGroup = null;
        try {
            vectorsGroup = groupItem.property(MATCH_GROUP_CONTENTS);
        } catch (e) {
            vectorsGroup = null;
        }

        var content = { shapes: [], groups: [] };
        if (vectorsGroup) {
            content = _parseContents(vectorsGroup, "    - ");
        }

        return {
            uuid: TH0R19_UUID.generate(),
            name: groupItem.name,
            transform: _parseGroupTransform(groupItem),
            shapes: content.shapes,
            groups: content.groups
        };
    }

    // parse: entry point for a whole Shape Layer's "Root Vectors Group".
    function parse(layer) {
        var rootVectors = null;
        try {
            rootVectors = layer.property("ADBE Root Vectors Group");
        } catch (e) {
            rootVectors = null;
        }

        if (!rootVectors) {
            TH0R19_Logger.warn("Layer '" + layer.name + "' tidak memiliki Root Vectors Group.");
            return { shapes: [], groups: [] };
        }

        return _parseContents(rootVectors, "  ");
    }

    return {
        parse: parse
    };

})();
