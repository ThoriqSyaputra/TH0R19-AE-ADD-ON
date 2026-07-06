if (typeof TH0R19 === "undefined") var TH0R19 = {};

TH0R19.CompositionParser = (function () {

    function parseComposition(comp, onProgress) {
        var data = {
            name: comp.name,
            width: comp.width,
            height: comp.height,
            pixelAspect: comp.pixelAspect,
            frameRate: TH0R19.Utils.roundNumber(comp.frameRate, 6),
            duration: TH0R19.Utils.roundNumber(comp.duration, 6),
            displayStartTime: TH0R19.Utils.roundNumber(comp.displayStartTime, 6),
            layerCount: comp.numLayers,
            shapeLayerCount: 0,
            layers: []
        };

        TH0R19.LayerParser.resetUUIDCache();

        var shapeLayerCount = 0;

        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            if (!TH0R19.Utils.isShapeLayer(layer)) {
                continue;
            }
            shapeLayerCount++;
            if (onProgress) {
                onProgress("Reading Shape Layer: " + layer.name);
            }
            var layerData = TH0R19.LayerParser.parseLayer(layer);
            data.layers.push(layerData);
        }

        data.shapeLayerCount = shapeLayerCount;

        return data;
    }

    return {
        parseComposition: parseComposition
    };

})();
