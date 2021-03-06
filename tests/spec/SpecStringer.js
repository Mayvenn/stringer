describe("test stringer", function() {

  beforeEach(function() {
    jasmine.Ajax.install();
  });

  afterEach(function() {
    jasmine.Ajax.uninstall();
  });

  it("makes correct request when tracked after stringer has loaded", function() {
    var serverURI = "http://localhost:3013",
        sourceSite = "test",
        request, params, tsStart, tsEnd;
    window.stringer.init({environment: "development",
                          sourceSite: sourceSite});

    window.stringer.identify("anything@example.com", 42);

    // Get estimated timestamp range for the request
    tsStart = Date.now();
    window.stringer.track('add-to-bag', { "hello": true });
    tsEnd = Date.now();

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

    expect(params.id).toMatch(
        /[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}/);
    expect(params.resource.client.ts).toBeDefined();
    expect(params.resource.client.ts).not.toBeLessThan(tsStart);
    expect(params.resource.client.ts).not.toBeGreaterThan(tsEnd);

    expect(params.name).toEqual('add-to-bag');
    expect(params.source).toEqual(sourceSite);

    expect(params.resource.device).toBeDefined();
    expect(params.resource.device.height).toBeDefined();
    expect(params.resource.device.width).toBeDefined();
    expect(params.resource.device.pixel_ratio).toBeDefined();

    expect(params.resource.browser).toBeDefined();
    expect(params.resource.browser.distinct_id).toBeDefined();
    expect(params.resource.browser.vendor).toBeDefined();
    expect(params.resource.browser.width).toBeDefined();
    expect(params.resource.browser.height).toBeDefined();

    expect(params.resource.page).toBeDefined();
    expect(params.resource.page.url).toBeDefined();
    expect(params.resource.page.title).toBeDefined();
    expect(params.resource.page.referrer).toBeDefined();

    expect(params.resource.visitor).toEqual({"user_email": "anything@example.com",
                                             "user_id": 42});

    expect(params.data).toEqual({"hello": true});
  });
});
