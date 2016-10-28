(function (global, undefined) {
    // TODO change me!
    var serverUrl = "http://localhost:8080";

    function sendEvent(event) {
        xhr = new XMLHttpRequest();
        xhr.open("POST", serverUrl);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify(event));
    }

    function init() {
        var analyticsTracker = {};
        analyticsTracker.push = function(event) {
            event.UUID = uuid.v1();
            event.ts = Date.now();
            sendEvent(event);
        }
        // expecting analyticsTracker to be an array before script was loaded
        // backfill
        if ("number" === typeof window.stringer.length ? window.stringer.length : 0) {
            window.stringer.forEach(analyticsTracker.push);
        }
        window.stringer = analyticsTracker;
    }
    init();

})(window);
