"use strict";

(function (window, console, undefined) {
  var self = {},
      rng = initRandom(window),
      device = captureDevice(),
      visitor = fetchVisitor(),
      sourceSite = "default",
      serverURI = "https://t.mayvenn.com/",
      debug = false,
      send;

  // Only public functions/vars should be on self, otherwise leave them in the closure!

  self.init = function (config) {
    setCookie("stringer.distinct_id", device.distinct_id, { domain: rootDomain() });
    serverURI = config.serverURI || serverURI;
    sourceSite = config.sourceSite || sourceSite;
    debug = config.debug || debug;
    return self;
  };

  self.track = function (eventName, args) {
    var blockRe = /(google web preview|baiduspider|yandexbot|bingbot|googlebot|yahoo! slurp)/i;

    if (eventName && !blockRe.test(window.navigator.userAgent)) {
      send({
        client_timestamp: Date.now(),
        id: uuid(rng),
        name: eventName,
        source: sourceSite,
        device: device,
        page: {
          url: window.location.href,
          title: window.document.title,
          referrer: window.document.referrer
        },
        properties: args,
        visitor: visitor
      });
    }
    return self;
  };

  function isNull(value) {
    return (value === null || "undefined" == typeof value);
  }

  self.identify = function (userEmail, userId) {
    visitor = {};
    if (!isNull(userEmail)) {
      visitor.user_email = userEmail;
    }

    if (!isNull(userId)) {
      visitor.user_id = userId;
    }

    setCookie("stringer.user_email", userEmail);
    setCookie("stringer.user_id", userId);
    self.track("identify");
    return self;
  };

  self.clear = function() {
    visitor = {};
    removeCookie("stringer.user_email");
    removeCookie("stringer.user_id");
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
      distinct_id: readCookie("stringer.distinct_id") || uuid(rng),
      screen_height: window.screen.height,
      screen_width: window.screen.width,
      pixel_ratio: window.devicePixelRatio,
      vendor: window.navigator.vendor
    };
  }

  function fetchVisitor() {
    var visitor = {};
    var userEmail = readCookie("stringer.user_email");
    var userId = readCookie("stringer.user_id");

    if (!!userEmail) {
      visitor.user_email = userEmail;
    }
    if (!!userId) {
      visitor.user_id = userId;
    }
    return visitor;
  }

  function readCookie(key) {
    var cookies = document.cookie.split(";");
    var cookieRe = RegExp("^\\s*"+key+"=\\s*(.*?)\\s*$");
    for (var i = 0; i < cookies.length; i++) {
      var cookie = cookies[i];
      var found = cookie.match(cookieRe);
      if (found) {
        return decodeURIComponent(found[1]);
      }
    }
    return null;
  }

  function rootDomain() {
    var domainParts = window.location.hostname.split('.');
    var rootDomainParts = domainParts.slice(Math.max(domainParts.length - 2, 0));
    return rootDomainParts.join('.');
  }

  function setCookie(key, value, options) {
    options = options || {};
    options.domain = options.domain || window.location.hostname;
    var expiresAt = new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 365 * 10);

    if (isNull(value)) {
      expiresAt = new Date(1970, 1 /*Feb*/, 1);
    }
    var cookieStr = key + "=" + encodeURIComponent(value) + "; domain=" + options.domain + "; path=/; expires=" + expiresAt.toUTCString();
    window.document.cookie = cookieStr;
  }

  function removeCookie(key, domain) {
    setCookie(key, null, {domain : domain});
  }

  function log() {
    if (debug && 'undefined' !== typeof console && console.log) {
      console.log.apply(console, arguments);
    }
  }

  if (window.navigator.sendBeacon) {
    send = function send(payload) {
      log("send", serverURI, payload);
      window.navigator.sendBeacon(serverURI, JSON.stringify(payload));
    };
  } else {
    send = function send(payload) {
      log("send", serverURI, payload);
      var xhr = new XMLHttpRequest();
      xhr.open("POST", serverURI);
      xhr.setRequestHeader("Content-Type", "text/plain");
      xhr.send(JSON.stringify(payload));
    };
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
})(window, console);
