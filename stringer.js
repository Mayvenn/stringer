"use strict";

(function (window, console, oldStringer, undefined) {
  var self = {},
      rng = initRandom(window),
      device = captureDevice(),
      browser = captureBrowser(),
      visitor = fetchVisitor(),
      sourceSite = "default",
      environments = {production: "https://t.mayvenn.com/",
                      acceptance: "https://t.diva-acceptance.com/",
                      development: "http://localhost:3013"},
      debug = false,
      serverURI,
      send;

  function init(config) {
    setCookie("stringer.distinct_id", browser.distinct_id, { domain: rootDomain() });
    serverURI = environments[config.environment];
    sourceSite = config.sourceSite || sourceSite;
    debug = config.debug || debug;

    if (!serverURI) {
      log("Invalid Environment", config.environment);
    }
  };

  function track (eventName, args) {
    var blockRe = /(google web preview|baiduspider|yandexbot|bingbot|googlebot|yahoo! slurp)/i;

    if (eventName && !blockRe.test(window.navigator.userAgent)) {
      send({
        id: uuid(rng),
        name: eventName,
        source: sourceSite,
        resource:{
          device: device,
          browser: browser,
          page: {
            url: window.location.href,
            title: window.document.title,
            referrer: window.document.referrer
          },
          visitor: visitor,
          client: {
            ts: Date.now()
          }
        },
        data: args
      });
    }
  };

  function identify (userEmail, userId) {
    visitor = {
      user_email: userEmail,
      user_id: userId
    };

    setCookie("stringer.user_email", userEmail);
    setCookie("stringer.user_id", userId);
  };

  function clear () {
    visitor = {};
    removeCookie("stringer.user_email");
    removeCookie("stringer.user_id");
  };

  function isNull(value) {
    return (value === null || "undefined" == typeof value);
  }

  function processQueue(queue) {
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

    queue.length = 0;
  }

  function captureDevice() {
    return {
      height: window.screen.height,
      width: window.screen.width,
      pixel_ratio: window.devicePixelRatio
    };
  }

  function captureBrowser() {
    return {
      distinct_id: readCookie("stringer.distinct_id") || makeid(24),
      height: document.documentElement.clientHeight,
      width: document.documentElement.clientWidth,
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
    if (window.location.protocol === "https:") {
      cookieStr = cookieStr + ";secure";
    }

    window.document.cookie = cookieStr;
  }

  function removeCookie(key, domain) {
    setCookie(key, null, {domain : domain});
  }

  function log() {
    try {
      if (debug && 'undefined' !== typeof console && console.log) {
        console.log.apply(console, Array.prototype.concat.apply(["stringer"], arguments));
      }
    } catch (e) {}
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

  /* Gives strings with 62 ^ n bits of entropy
     NOTE: this is not a particularly FAST generator. It should only be called
     infrequently, unlike the UUID generation code which can more efficiently
     generate randomness. */
  function makeid(n) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i=0; i < n; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
  }

  function addPublicFn(name, f) {
    self[name] = function() {
      try {
        f.apply(self, arguments);
      } catch (e) {
        log("error in " + name, e);
      }
      return self;
    };
  }

  // These should be the only public functions/vars that are exposed through self,
  // otherwise leave them in the closure!
  self.loaded = true;
  addPublicFn("init", init);
  addPublicFn("track", track);
  addPublicFn("identify", identify);
  addPublicFn("clear", clear);
  self.get_browser_id = function() {
      return browser.distinct_id;
  };

  window.stringer = self;
  if (Array.isArray(oldStringer)) {
    processQueue(oldStringer);
  }
})(window, console, window.stringer);
