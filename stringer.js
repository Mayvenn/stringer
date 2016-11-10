"use strict";

(function (window, undefined) {
  var self = {},
      rng = initRandom(window),
      device = captureDevice(),
      visitor = {},
      sourceSite = "default",
      serverURI = "http://localhost:8080",
      debug = true; // Change before going prod

  // Only public functions/vars should be on self, otherwise leave them in the closure!

  self.init = function (config) {
    setCookie("stringer_id", device.id);
    serverURI = config["serverURI"] || serverURI;
    sourceSite = config["sourceSite"] || sourceSite;
    debug = config["debug"] || debug;
    return self;
  };

  self.track = function (eventName, args) {
    var blockRe = /(google web preview|baiduspider|yandexbot|bingbot|googlebot|yahoo! slurp)/i;

    if (eventName && !blockRe.test(window.navigator.userAgent)) {
      send({
        ts: Date.now(),
        id: uuid(rng),
        name: eventName,
        source: sourceSite,
        device: device,
        page: {
          uri: window.location.href,
          title: window.document.title,
          referrer: window.document.referrer
        },
        properties: args,
        visitor: visitor
      });
    }
    return self;
  };

  self.identify = function (email, user_id) {
    visitor = {
      email: email,
      user_id: user_id
    };
    self.track("identify");
    return self;
  };

  self.clear = function() {
    visitor = {};
    self.track("clear_identify");
    return self;
  };

  function processQueue() {
    if (Array.isArray(window.stringer)) {
      var queue = window.stringer;
      log("processing queue", queue);

      queue.forEach(function(args) {
        var cmdName = args.shift(1),
            cmd = self[cmdName];
        if (cmd) {
          log("invoke", cmdName, args);
          cmd.apply(null, args);
        } else {
          log("invalid command", cmdName);
        }
      });
    }
  }

  function captureDevice() {
    return {
      id: readCookie("stringer_id") || uuid(rng),
      screen_height: window.screen.height,
      screen_width: window.screen.width,
      pixel_ratio: window.devicePixelRatio,
      vendor: window.navigator.vendor
    };
  }

  function readCookie(key) {
    var cookies = document.cookie.split(";");
    var cookieRe = RegExp("^\\s*"+key+"=\\s*(.*?)\\s*$");
    for (var i = 0; i < cookies.length; i++) {
      var cookie = cookies[i];
      var found = cookie.match(cookieRe);
      if (found) {
        return found[1];
      }
    }
    return null;
  }

  function setCookie(key, value) {
    window.document.cookie = key + "=" + value + "; path=/";
  }

  function log() {
    if (debug && 'undefined' !== typeof console && console.log) {
      console.log.apply(null, arguments);
    }
  }

  function send(payload) {
    log("send", serverURI, payload);
    var xhr = new XMLHttpRequest();
    xhr.open("POST", serverURI);
    xhr.setRequestHeader("Content-Type", "text/plain");
    xhr.send(JSON.stringify(payload));
  }

  // from https://github.com/broofa/node-uuid
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

  processQueue();
  window.stringer = self;
})(window);

