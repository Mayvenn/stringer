(function (global, undefined) {
  var self = {
    serverURI: "http://localhost:8080",
    queue: [],
    debug: false
  };

  self.load = function () {
    if (global.hasOwnProperty("stringer") &&
        Array.isArray(global.stringer)) {
      log("load", global.stringer);
      global.stringer.forEach(function(e) {
        self.queue.push(e);
      }, self);
    }

    return self;
  };

  self.init = function (config = {}) {
    var rng = getRng(global);

    for (var k in self) {
      if (self.hasOwnProperty(k) &&
          "function" != typeof self[k]) {
        self[k] = config[k] || self[k];
      }
    }

    log("init", self);

    self.push = function() {
      for (var i in arguments) {
        var event = arguments[i];
        log("push", event, self.serverURI);
        event.uuid = uuid(rng);
        event.ts = Date.now();
        send(event);
      }
      return arguments.length;
    };

    self.push.apply(self, self.queue);
    delete self.queue;

    return self;
  };

  function log() {
    if (self.debug &&
        'undefined' !== typeof console &&
        console.log) {
      console.log.apply(null, arguments);
    }
  }

  function getRng(global) {
    // Allow for MSIE11 msCrypto
    var _rng;
    var _crypto = global.crypto || global.msCrypto;

    if (!_rng && _crypto && _crypto.getRandomValues) {
      try {
        var _rnds8 = new Uint8Array(16);
        _rng = function () {
          _crypto.getRandomValues(_rnds8);
          return _rnds8;
        };
        _rng();
      } catch(e) {}
    }

    if (!_rng) {
      var  _rnds = new Array(16);
      _rng = function() {
        for (var i = 0, r; i < 16; i++) {
          if ((i & 0x03) === 0) { r = Math.random() * 0x100000000; }
          _rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
        }
        return _rnds;
      };
    }
    return _rng;
  }

  function send(payload) {
    log("send", self.serverURI, payload);
    xhr = new XMLHttpRequest();
    xhr.open("POST", self.serverURI);
    xhr.setRequestHeader("Content-Type", "text/plain");
    xhr.send(JSON.stringify(payload));
  };

  function unparse(buf) {
    var i = 0,
        bth = [];

    for (var j = 0; j < 256; j++) {
      bth[j] = (j + 0x100).toString(16).substr(1);
    }

    return  bth[buf[i++]] + bth[buf[i++]] +
      bth[buf[i++]] + bth[buf[i++]] + '-' +
      bth[buf[i++]] + bth[buf[i++]] + '-' +
      bth[buf[i++]] + bth[buf[i++]] + '-' +
      bth[buf[i++]] + bth[buf[i++]] + '-' +
      bth[buf[i++]] + bth[buf[i++]] +
      bth[buf[i++]] + bth[buf[i++]] +
      bth[buf[i++]] + bth[buf[i++]];
  }

  function uuid(rng) {
    var i = 0;

    options = {};
    var rnds = rng();

    rnds[6] = (rnds[6] & 0x0f) | 0x40;
    rnds[8] = (rnds[8] & 0x3f) | 0x80;

    return unparse(rnds);
  }

  global.stringer = self.load();
})(window);
