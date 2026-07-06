// =============================================================
// TH0R19 AE - modules/TransformParser.jsx
// Transform Parser: reads a layer's Transform group (Anchor
// Point, Position, Scale, Rotation, Opacity), static or animated.
// =============================================================

var TH0R19_TransformParser = (function () {

    function _numberMapper(v) {
        return TH0R19_Utils.round(TH0R19_Utils.safeNumber(v, 0), 4);
    }

    function _arrayMapper(v) {
        if (v instanceof Array) {
            return TH0R19_Utils.roundArray(v, 4);
        }
        return [TH0R19_Utils.round(TH0R19_Utils.safeNumber(v, 0), 4)];
    }

    function _getProp(group, matchName) {
        try {
            return group.property(matchName);
        } catch (e) {
            return null;
        }
    }

    function parse(layer) {
        var transformGroup;
        try {
            transformGroup = layer.property("ADBE Transform Group");
        } catch (e) {
            transformGroup = null;
        }

        var transform = {
            anchorPoint: { animated: false, value: [0, 0, 0], keyframes: [] },
            position: { animated: false, value: [0, 0, 0], keyframes: [] },
            scale: { animated: false, value: [100, 100, 100], keyframes: [] },
            rotation: { animated: false, value: 0, keyframes: [] },
            opacity: { animated: false, value: 100, keyframes: [] }
        };

        if (!transformGroup) return transform;

        var anchorProp = _getProp(transformGroup, "ADBE Anchor Point");
        var positionProp = _getProp(transformGroup, "ADBE Position");
        var scaleProp = _getProp(transformGroup, "ADBE Scale");
        var rotationProp = _getProp(transformGroup, "ADBE Rotate Z");
        var opacityProp = _getProp(transformGroup, "ADBE Opacity");

        if (anchorProp) transform.anchorPoint = TH0R19_AnimationParser.extractProperty(anchorProp, _arrayMapper);
        if (positionProp) transform.position = TH0R19_AnimationParser.extractProperty(positionProp, _arrayMapper);
        if (scaleProp) transform.scale = TH0R19_AnimationParser.extractProperty(scaleProp, _arrayMapper);
        if (rotationProp) transform.rotation = TH0R19_AnimationParser.extractProperty(rotationProp, _numberMapper);
        if (opacityProp) transform.opacity = TH0R19_AnimationParser.extractProperty(opacityProp, _numberMapper);

        return transform;
    }

    return {
        parse: parse
    };

})();
