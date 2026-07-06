if (typeof TH0R19 === "undefined") var TH0R19 = {};

TH0R19.Logger = (function () {

    var _editText = null;
    var _lines = [];

    function init(editTextControl) {
        _editText = editTextControl;
        _lines = [];
        if (_editText) _editText.text = "";
    }

    function _append(level, message) {
        var line = TH0R19.Utils.nowTimestamp() + " " + level + " - " + message;
        _lines.push(line);
        if (_editText) {
            _editText.text = _lines.join("\n");
            try {
                _editText.active = true;
            } catch (e) {}
        }
        try {
            $.writeln(line);
        } catch (e2) {}
    }

    function info(message) {
        _append(TH0R19.Constants.LOG_LEVEL_INFO, message);
    }

    function success(message) {
        _append(TH0R19.Constants.LOG_LEVEL_SUCCESS, message);
    }

    function warn(message) {
        _append(TH0R19.Constants.LOG_LEVEL_WARN, message);
    }

    function error(message) {
        _append(TH0R19.Constants.LOG_LEVEL_ERROR, message);
    }

    function clear() {
        _lines = [];
        if (_editText) _editText.text = "";
    }

    return {
        init: init,
        info: info,
        success: success,
        warn: warn,
        error: error,
        clear: clear
    };

})();
