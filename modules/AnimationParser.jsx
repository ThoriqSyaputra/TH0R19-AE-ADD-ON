// =============================================================
// TH0R19 AE - modules/AnimationParser.jsx
// Animation Parser: generic keyframe extraction reused by
// TransformParser, PathParser and ShapeLayerParser so keyframe
// logic is written once (no duplicate code / DRY / SOLID).
//
// NOTE: for animated properties, values are now BAKED using
// property.valueAtTime() at every composition frame between the
// first and last keyframe, instead of exporting only the raw
// keyframe values. This is because After Effects has already
// evaluated Easy Ease / Custom Graph / Speed Graph / expressions
// into the actual per-frame value, so reading it directly avoids
// having to reconstruct AE's interpolation math on the Blender
// side (which was causing imported animation to look flat).
// =============================================================

var TH0R19_AnimationParser = (function () {

    var BAKE_INTERPOLATION = "LINEAR";

    function isAnimated(property) {
        try {
            return (property.numKeys > 0);
        } catch (e) {
            return false;
        }
    }

    function _interpToString(interp) {
        try {
            switch (interp) {
                case KeyframeInterpolationType.LINEAR: return "LINEAR";
                case KeyframeInterpolationType.BEZIER: return "BEZIER";
                case KeyframeInterpolationType.HOLD: return "HOLD";
                default: return "LINEAR";
            }
        } catch (e) {
            return "LINEAR";
        }
    }

    // _findContainingComp: walks up the property tree (parentProperty)
    // until an object exposing containingComp is found (the owning
    // Layer). Needed so we know the composition frameRate to bake at.
    function _findContainingComp(property) {
        try {
            var p = property;
            var guard = 0;
            while (p && guard < 64) {
                if (p.containingComp) return p.containingComp;
                p = p.parentProperty;
                guard++;
            }
        } catch (e) {
            // fall through
        }
        return null;
    }

    // _extractRawKeyframes: original behaviour, one entry per real
    // AE keyframe. Used as a fallback when baking isn't possible
    // (e.g. fewer than 2 keyframes, or comp/frameRate unavailable).
    function _extractRawKeyframes(property, mapper) {
        var keyframes = [];

        for (var i = 1; i <= property.numKeys; i++) {
            var time = property.keyTime(i);
            var rawValue = property.keyValue(i);
            var value = mapper(rawValue);

            var keyframe = {
                index: i,
                time: TH0R19_Utils.round(time, 5),
                value: value,
                inInterpolation: "LINEAR",
                outInterpolation: "LINEAR"
            };

            try {
                keyframe.inInterpolation = _interpToString(property.keyInInterpolationType(i));
                keyframe.outInterpolation = _interpToString(property.keyOutInterpolationType(i));
            } catch (e) {
                // some property types (e.g. shape path) do not support
                // interpolation type queries the same way; default stays LINEAR
            }

            keyframes.push(keyframe);
        }

        return keyframes;
    }

    // _extractBakedKeyframes: samples property.valueAtTime() once per
    // composition frame from the first to the last keyframe. Because
    // the sample already contains AE's fully evaluated interpolation
    // (Easy Ease, custom Bezier graph, expressions, hold, etc.), the
    // baked points themselves only need LINEAR interpolation on the
    // Blender side to reproduce the original curve shape.
    function _extractBakedKeyframes(property, mapper, comp) {
        var frameRate = comp.frameRate;
        if (!frameRate || frameRate <= 0) return null;

        var frameDuration = 1 / frameRate;
        var startTime = property.keyTime(1);
        var endTime = property.keyTime(property.numKeys);

        if (endTime <= startTime) return null;

        var totalFrames = Math.round((endTime - startTime) / frameDuration);
        if (totalFrames < 1) totalFrames = 1;

        var keyframes = [];
        var idx = 0;

        for (var f = 0; f <= totalFrames; f++) {
            var t = (f === totalFrames) ? endTime : (startTime + f * frameDuration);

            var sampled;
            try {
                sampled = property.valueAtTime(t, false);
            } catch (e) {
                // if sampling ever fails for a given frame, skip it
                // rather than aborting the whole bake
                continue;
            }

            idx++;
            keyframes.push({
                index: idx,
                time: TH0R19_Utils.round(t, 5),
                value: mapper(sampled),
                inInterpolation: BAKE_INTERPOLATION,
                outInterpolation: BAKE_INTERPOLATION
            });
        }

        return (keyframes.length > 0) ? keyframes : null;
    }

    // extractProperty: reads either the static value or the full
    // set of keyframes from an AE Property, running each raw
    // value through `mapper` so callers control the output shape.
    function extractProperty(property, mapper) {
        var result = {
            animated: false,
            value: null,
            keyframes: []
        };

        if (!property) return result;

        var animated = isAnimated(property);
        result.animated = animated;

        if (!animated) {
            try {
                result.value = mapper(property.value);
            } catch (e) {
                result.value = null;
            }
            return result;
        }

        // Baking needs an interpolated span between at least 2 keys.
        if (property.numKeys < 2) {
            result.keyframes = _extractRawKeyframes(property, mapper);
            return result;
        }

        var comp = _findContainingComp(property);
        var baked = comp ? _extractBakedKeyframes(property, mapper, comp) : null;

        result.keyframes = baked ? baked : _extractRawKeyframes(property, mapper);

        return result;
    }

    return {
        isAnimated: isAnimated,
        extractProperty: extractProperty
    };

})();
