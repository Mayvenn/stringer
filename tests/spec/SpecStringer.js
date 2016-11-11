describe("test stringer", function() {

  beforeEach(function() {
    if (window.navigator.sendBeacon) {
      spyOn(window.navigator, "sendBeacon");
    }
    jasmine.Ajax.install();
  });

  afterEach(function() {
    jasmine.Ajax.uninstall();
  });

  it("makes correct request when tracked after stringer has loaded", function() {
    var serverURI = "http://ticker-tape.diva-acceptance.com/api/track",
        sourceSite = "test",
        request, sendBeaconArgs, params, tsStart, tsEnd;
    window.stringer.init({serverURI: serverURI,
                          sourceSite: sourceSite});

    // Get estimated timestamp range for the request
    tsStart = Date.now();
    window.stringer.track('add-to-bag', { "hello": true });
    tsEnd = Date.now();

    if (window.navigator.sendBeacon) {
      expect(window.navigator.sendBeacon).toHaveBeenCalled();
      sendBeaconArgs = window.navigator.sendBeacon.calls.argsFor(0);
      expect(sendBeaconArgs[0]).toEqual(serverURI);
      params = JSON.parse(sendBeaconArgs[1]);
    } else {
      request = jasmine.Ajax.requests.mostRecent();

      expect({
        url: request.url,
        method: request.method,
        requestHeaders: request.requestHeaders
      }).toEqual({
        url: serverURI,
        method: "POST",
        requestHeaders: {"Content-Type": "text/plain"}
      });

      params = JSON.parse(request.params);
    }

    expect(params.id).toMatch(
        /[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}/);

    expect(params.ts).not.toBeLessThan(tsStart);
    expect(params.ts).not.toBeGreaterThan(tsEnd);

    expect(params.name).toEqual('add-to-bag');
    expect(params.source).toEqual(sourceSite);

    expect(params.device).toBeDefined();
    expect(params.device.screen_height).toBeDefined();
    expect(params.device.screen_width).toBeDefined();
    expect(params.device.pixel_ratio).toBeDefined();
    expect(params.device.vendor).toBeDefined();

    expect(params.page).toBeDefined();
    expect(params.page.url).toBeDefined();
    expect(params.page.title).toBeDefined();
    expect(params.page.referrer).toBeDefined();

    expect(params.properties).toEqual({"hello": true});

    expect(params.visitor).toEqual({});
  });
});
