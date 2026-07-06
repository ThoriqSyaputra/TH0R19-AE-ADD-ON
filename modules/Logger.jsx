// =============================================================
// TH0R19 AE - modules/Logger.jsx
// Logger: writes timestamped log lines into the STATUS panel.
// =============================================================

var TH0R19_Logger = (function () {

    var _target = null; // ScriptUI multiline EditText
    var _buffer = [];
    var _maxLines = 800;

    function init(editTextControl) {
        _target = editTextControl;
        _buffer = [];
    }

    function _write(level, message) {
        var line = "[" + TH0R19_Utils.timestamp() + "] [" + level + "] " + message;
        _buffer.push(line);

        if (_buffer.length > _maxLines) {
            _buffer.shift();
        }

        if (_target) {
            _target.text = _buffer.join("\n");
            try {
                // scroll to bottom by reselecting
                _target.active = true;
                _target.active = false;
            } catch (e) {
                // ignore, not critical
            }
        }
    }

    function info(message) { _write("INFO", message); }
    function warn(message) { _write("WARN", message); }
    function error(message) { _write("ERROR", message); }
    function success(message) { _write("OK", message); }

    function clear() {
        _buffer = [];
        if (_target) _target.text = "";
    }

    function getLog() {
        return _buffer.join("\n");
    }

    return {
        init: init,
        info: info,
        warn: warn,
        error: error,
        success: success,
        clear: clear,
        getLog: getLog
    };

})();
