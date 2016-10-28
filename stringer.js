(function (global, undefined) {
    var analyticsTracker = {};
    analyticsTracker.push = function(event) {
        // currently expecting event to be an object of more or less
        // of the following form
        // {"type": "add-to-bag"
        //  "data": {}
        // }
        event.UUID = uuid.v1();
        event.ts = Date.now();
        // TODO send the data to the server
    }
    window.stringer = analyticsTracker;
})(window);
