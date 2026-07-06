// =============================================================
// TH0R19 AE - modules/CompositionParser.jsx
// Composition Parser: reads composition-level metadata (frame
// rate, duration, resolution, pixel aspect, display start time)
// and iterates every Shape Layer via ShapeLayerParser.
// =============================================================

var TH0R19_CompositionParser = (function () {

    function _parseLayer(layer) {
        TH0R19_Logger.info("Reading Shape Layer: " + layer.name);

        var transform = TH0R19_TransformParser.parse(layer);

        TH0R19_Logger.info("Reading Paths...");
        var content = TH0R19_ShapeLayerParser.parse(layer);

        return {
            uuid: TH0R19_UUID.generate(),
            name: layer.name,
            index: layer.index,
            enabled: layer.enabled,
            threeDLayer: !!layer.threeDLayer,
            startTime: TH0R19_Utils.round(layer.startTime, 5),
            inPoint: TH0R19_Utils.round(layer.inPoint, 5),
            outPoint: TH0R19_Utils.round(layer.outPoint, 5),
            transform: transform,
            shapes: content.shapes,
            groups: content.groups
        };
    }

    function parse(comp) {
        TH0R19_Logger.info("Composition Found: " + comp.name);
        TH0R19_Logger.info("Reading Layers...");

        var layers = [];
        var totalLayers = comp.numLayers;

        for (var i = 1; i <= totalLayers; i++) {
            var layer = comp.layer(i);

            if (!TH0R19_Utils.isShapeLayer(layer)) {
                continue;
            }

            layers.push(_parseLayer(layer));
        }

        TH0R19_Logger.info("Total Shape Layer terbaca: " + layers.length);

        return {
            uuid: TH0R19_UUID.generate(),
            name: comp.name,
            width: comp.width,
            height: comp.height,
            pixelAspect: comp.pixelAspect,
            frameRate: comp.frameRate,
            duration: TH0R19_Utils.round(comp.duration, 5),
            durationInFrames: Math.round(comp.duration * comp.frameRate),
            displayStartTime: comp.displayStartTime,
            workAreaStart: TH0R19_Utils.round(comp.workAreaStart, 5),
            workAreaDuration: TH0R19_Utils.round(comp.workAreaDuration, 5),
            layers: layers
        };
    }

    return {
        parse: parse
    };

})();
