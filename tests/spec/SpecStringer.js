describe("test stringer", function() {

    beforeEach(function() {
        jasmine.Ajax.install();
    });
    afterEach(function() {
        jasmine.Ajax.uninstall();
    });

    it("makes correct request when pushed after stringer has loaded", function() {
        var serverURI = "http://ticker-tape.diva-acceptance.com/api/track";
        var sourceSite = "test";
        window.stringer.push(['config',
                              {serverURI: serverURI,
                               sourceSite: sourceSite}]);

        var data = {
            eventName: 'blah',
            "hello": true
        };

        // Get estimated timestamp range for the request
        var tsStart = Date.now();
        window.stringer.push(["track", data]);
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
        expect(params.uuid).toMatch(
                /[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}/);
        // confirm ts falls between expected ranges
        expect(params.ts).not.toBeLessThan(tsStart);
        expect(params.ts).not.toBeGreaterThan(tsEnd);
        // confirm device attributes are defined
        expect(params.userAgent).toBeDefined();
        expect(params.screenHeight).toBeDefined();
        expect(params.screenWidth).toBeDefined();
        expect(params.screenPixelRatio).toBeDefined();
        // confirm current page information is defined
        expect(params.pageURI).toBeDefined();
        expect(params.pageTitle).toBeDefined();
        expect(params.referrer).toBeDefined();
    });
});
