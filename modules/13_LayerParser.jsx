if (typeof TH0R19 === "undefined") var TH0R19 = {};

TH0R19.LayerParser = (function () {

    var _uuidCache = {};

    function _getLayerUUID(layer) {
        var cacheKey = String(layer.index) + "_" + layer.name;
        if (_uuidCache[cacheKey]) {
            return _uuidCache[cacheKey];
        }
        var uuid = TH0R19.UUIDGenerator.generate();
        _uuidCache[cacheKey] = uuid;
        return uuid;
    }

    function _getLayerTransformGroup(layer) {
        var group = TH0R19.Utils.safeGetPropertyByMatchName(layer, TH0R19.Constants.MATCHNAME_TRANSFORM_GROUP);
        if (group) return group;
        try {
            return layer.property("Transform");
        } catch (e) {
            return null;
        }
    }

    function parseLayer(layer) {
        var isShape = TH0R19.Utils.isShapeLayer(layer);

        var data = {
            uuid: _getLayerUUID(layer),
            name: layer.name,
            index: layer.index,
            enabled: layer.enabled,
            isShapeLayer: isShape,
            inPoint: TH0R19.Utils.roundNumber(layer.inPoint, 6),
            outPoint: TH0R19.Utils.roundNumber(layer.outPoint, 6),
            startTime: TH0R19.Utils.roundNumber(layer.startTime, 6),
            transform: TH0R19.TransformParser.parseTransform(_getLayerTransformGroup(layer), "layer"),
            shapes: null
        };

        if (isShape) {
            data.shapes = TH0R19.ShapeParser.parseShapeLayerContents(layer);
        }

        return data;
    }

    function resetUUIDCache() {
        _uuidCache = {};
    }

    return {
        parseLayer: parseLayer,
        resetUUIDCache: resetUUIDCache
    };

})();
