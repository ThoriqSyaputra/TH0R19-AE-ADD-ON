if (typeof TH0R19 === "undefined") var TH0R19 = {};

TH0R19.ShapeParser = (function () {

    function _getContentsGroup(vectorGroup) {
        var prop = TH0R19.Utils.safeGetPropertyByMatchName(vectorGroup, TH0R19.Constants.MATCHNAME_VECTORS_GROUP);
        if (prop) return prop;
        try {
            return vectorGroup.property("Contents");
        } catch (e) {
            return null;
        }
    }

    function _getGroupTransform(vectorGroup) {
        return TH0R19.Utils.safeGetPropertyByMatchName(vectorGroup, TH0R19.Constants.MATCHNAME_VECTOR_TRANSFORM_GROUP);
    }

    function _parseVectorGroup(vectorGroup) {
        var node = {
            type: "group",
            name: vectorGroup.name,
            transform: TH0R19.TransformParser.parseTransform(_getGroupTransform(vectorGroup), "group"),
            items: []
        };

        var contents = _getContentsGroup(vectorGroup);
        if (!contents) return node;

        var count = 0;
        try {
            count = contents.numProperties;
        } catch (e) {
            count = 0;
        }

        for (var i = 1; i <= count; i++) {
            var child;
            try {
                child = contents.property(i);
            } catch (e2) {
                continue;
            }
            if (!child) continue;

            var matchName = "";
            try {
                matchName = child.matchName;
            } catch (e3) {
                matchName = "";
            }

            if (matchName === TH0R19.Constants.MATCHNAME_VECTOR_GROUP) {
                node.items.push(_parseVectorGroup(child));
            } else if (matchName === TH0R19.Constants.MATCHNAME_VECTOR_SHAPE_GROUP) {
                node.items.push(TH0R19.PathParser.parsePathGroup(child));
            }
        }

        return node;
    }

    function parseShapeLayerContents(layer) {
        var root = {
            type: "group",
            name: "Contents",
            transform: null,
            items: []
        };

        var rootGroup = TH0R19.Utils.safeGetPropertyByMatchName(layer, TH0R19.Constants.MATCHNAME_ROOT_VECTORS_GROUP);
        if (!rootGroup) {
            try {
                rootGroup = layer.property("Contents");
            } catch (e) {
                rootGroup = null;
            }
        }

        if (!rootGroup) return root;

        var count = 0;
        try {
            count = rootGroup.numProperties;
        } catch (e2) {
            count = 0;
        }

        for (var i = 1; i <= count; i++) {
            var child;
            try {
                child = rootGroup.property(i);
            } catch (e3) {
                continue;
            }
            if (!child) continue;

            var matchName = "";
            try {
                matchName = child.matchName;
            } catch (e4) {
                matchName = "";
            }

            if (matchName === TH0R19.Constants.MATCHNAME_VECTOR_GROUP) {
                root.items.push(_parseVectorGroup(child));
            } else if (matchName === TH0R19.Constants.MATCHNAME_VECTOR_SHAPE_GROUP) {
                root.items.push(TH0R19.PathParser.parsePathGroup(child));
            }
        }

        return root;
    }

    return {
        parseShapeLayerContents: parseShapeLayerContents
    };

})();
