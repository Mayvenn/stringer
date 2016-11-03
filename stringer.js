(function (window, undefined) {
  var self = {
    serverURI: "http://localhost:8080",
    device: {},
    queue: [],
    debug: true
  };

  var publicCommands = {};

  self.load = function () {
    if (window.hasOwnProperty("stringer") &&
        Array.isArray(window.stringer)) {
      log("load", window.stringer);

      window.stringer.forEach(function(e) {
        self.queue.push(e);
      }, self);

      var rng = initRandom(window);

      self.push = function() {
        for (var i in arguments) {
          var event = arguments[i];
          var commandName = event[0];
          var args = event[1];
          args.uuid = uuid(rng);
          args.ts = Date.now();
          var cmd = publicCommands[commandName];
          if (cmd) {
            log("invoke", commandName, args);
            cmd.call(null, args);
          } else {
            log("invalid command", commandName);
          }
        }
        return arguments.length;
      };

      self.device = captureDevice();

      self.push.apply(self, self.queue);
      delete self.queue;
    }

    return self;
  };

  publicCommands.config = function (config = {}) {
    Object.assign(self, config);
  };

  publicCommands.track = function (args) {
    if (args["eventName"]) {
      send(Object.assign({},
                         args,
                         self.device,
                         {sourceSite: self.sourceSite,
                          pageURI: window.location.href,
                          pageTitle: window.document.title,
                          referrer: window.document.referrer}));
    }
  };

  function captureDevice() {
    return {
      userAgent: window.navigator.userAgent,
      screenHeight: window.screen.height,
      screenWidth: window.screen.width,
      screenPixelRatio: window.devicePixelRatio
    };
  }

  function log() {
    if (self.debug &&
        'undefined' !== typeof console &&
        console.log) {
      console.log.apply(null, arguments);
    }
  }

  function send(payload) {
    log("send", self.serverURI, payload);
    xhr = new XMLHttpRequest();
    xhr.open("POST", self.serverURI);
    xhr.setRequestHeader("Content-Type", "text/plain");
    xhr.send(JSON.stringify(payload));
  }

  function initRandom(window) {
    var _rng;
    var _crypto = window.crypto || window.msCrypto;

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

  function uuid(rng) {
    var rnds = rng();
    rnds[6] = (rnds[6] & 0x0f) | 0x40;
    rnds[8] = (rnds[8] & 0x3f) | 0x80;

    var i = 0,
        bth = [];

    for (var j = 0; j < 256; j++) {
      bth[j] = (j + 0x100).toString(16).substr(1);
    }

    return bth[rnds[i++]] + bth[rnds[i++]] +
        bth[rnds[i++]] + bth[rnds[i++]] + '-' +
        bth[rnds[i++]] + bth[rnds[i++]] + '-' +
        bth[rnds[i++]] + bth[rnds[i++]] + '-' +
        bth[rnds[i++]] + bth[rnds[i++]] + '-' +
        bth[rnds[i++]] + bth[rnds[i++]] +
        bth[rnds[i++]] + bth[rnds[i++]] +
        bth[rnds[i++]] + bth[rnds[i++]];
  }

  // -- Polyfills --

  if (typeof Object.assign != 'function') {
    (function () {
      Object.assign = function (target) {
        'use strict';
        // We must check against these specific cases.
        if (target === undefined || target === null) {
          throw new TypeError('Cannot convert undefined or null to object');
        }

        var output = Object(target);
        for (var index = 1; index < arguments.length; index++) {
          var source = arguments[index];
          if (source !== undefined && source !== null) {
            for (var nextKey in source) {
              if (source.hasOwnProperty(nextKey)) {
                output[nextKey] = source[nextKey];
              }
            }
          }
        }
        return output;
      };
    })();
  }

  window.stringer = self.load();
})(window);
