if (typeof TH0R19 === "undefined") var TH0R19 = {};

TH0R19.TransformParser = (function () {

    var LAYER_KEYS = {
        anchorPoint: "ADBE Anchor Point",
        position: "ADBE Position",
        scale: "ADBE Scale",
        rotation: "ADBE Rotate Z",
        opacity: "ADBE Opacity"
    };

    var GROUP_KEYS = {
        anchorPoint: "ADBE Vector Anchor",
        position: "ADBE Vector Position",
        scale: "ADBE Vector Scale",
        rotation: "ADBE Vector Rotation",
        opacity: "ADBE Vector Group Opacity"
    };

    function _emptyTransform() {
        return {
            anchorPoint: { animated: false, value: [0, 0], keyframes: [] },
            position: { animated: false, value: [0, 0], keyframes: [] },
            scale: { animated: false, value: [100, 100], keyframes: [] },
            rotation: { animated: false, value: 0, keyframes: [] },
            opacity: { animated: false, value: 100, keyframes: [] }
        };
    }

    function parseTransform(transformGroup, mode) {
        if (!transformGroup) {
            return _emptyTransform();
        }

        var keys = (mode === "group") ? GROUP_KEYS : LAYER_KEYS;
        var result = {};

        var anchorProp = TH0R19.Utils.safeGetPropertyByMatchName(transformGroup, keys.anchorPoint);
        var positionProp = TH0R19.Utils.safeGetPropertyByMatchName(transformGroup, keys.position);
        var scaleProp = TH0R19.Utils.safeGetPropertyByMatchName(transformGroup, keys.scale);
        var rotationProp = TH0R19.Utils.safeGetPropertyByMatchName(transformGroup, keys.rotation);
        var opacityProp = TH0R19.Utils.safeGetPropertyByMatchName(transformGroup, keys.opacity);

        result.anchorPoint = TH0R19.AnimationParser.extractProperty(anchorProp);
        result.position = TH0R19.AnimationParser.extractProperty(positionProp);
        result.scale = TH0R19.AnimationParser.extractProperty(scaleProp);
        result.rotation = TH0R19.AnimationParser.extractProperty(rotationProp);
        result.opacity = TH0R19.AnimationParser.extractProperty(opacityProp);

        return result;
    }

    return {
        parseTransform: parseTransform
    };

})();
