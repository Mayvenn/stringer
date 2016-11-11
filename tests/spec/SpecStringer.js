describe("test stringer", function() {

  beforeEach(function() {
    jasmine.Ajax.install();
  });

  afterEach(function() {
    jasmine.Ajax.uninstall();
  });

  it("makes correct request when tracked after stringer has loaded", function() {
    var serverURI = "http://ticker-tape.diva-acceptance.com/api/track";
    var sourceSite = "test";
    window.stringer.init({serverURI: serverURI,
                          sourceSite: sourceSite});

    // Get estimated timestamp range for the request
    var tsStart = Date.now();
    window.stringer.track('add-to-bag', { "hello": true });
    var tsEnd = Date.now();

    var request = jasmine.Ajax.requests.mostRecent();
    expect({
      url: request.url,
      method: request.method,
      requestHeaders: request.requestHeaders
    }).toEqual({
      url: serverURI,
      method: "POST",
      requestHeaders: {"Content-Type": "text/plain"}
    });

    var params = JSON.parse(request.params);
    expect(params.id).toMatch(
        /[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}/);

    expect(params.ts).not.toBeLessThan(tsStart);
    expect(params.ts).not.toBeGreaterThan(tsEnd);

    expect(params.name).toEqual('add-to-bag');
    expect(params.source).toEqual(sourceSite);

    var device = params.device;
    expect(device).toBeDefined();
    expect(device.screen_height).toBeDefined();
    expect(device.screen_width).toBeDefined();
    expect(device.pixel_ratio).toBeDefined();
    expect(device.vendor).toBeDefined();

    var page = params.page;
    expect(page).toBeDefined();
    expect(page.url).toBeDefined();
    expect(page.title).toBeDefined();
    expect(page.referrer).toBeDefined();

    expect(params.properties).toEqual({"hello": true});

    expect(params.visitor).toEqual({});
  });
});
