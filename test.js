var assert = require('assert'),
    XboxMusic = require('./xboxmusic');

var client_id= process.env.XBOXMUSIC_CLIENT_ID,
    client_secret = process.env.XBOXMUSIC_CLIENT_SECRET;

describe('XboxMusic', function() {
    describe('constructor', function() {
        it("should fail if consumer_key and consumer_secret are missing", function() {
            assert.throws(
                function() {
                    new XboxMusic()
                }
            );
        });
        it('should not fail when consumer_key and consumer_secret are provided', function() {
            assert.doesNotThrow(
                function() {
                    new XboxMusic({
                        client_id: client_id,
                        client_secret: client_secret
                    });
                }
            );
        });
    });
    describe('icon', function() {
        it('should return an url', function() {
            var service = new XboxMusic({
                client_id: client_id,
                client_secret: client_secret
            });
            assert(service.getServiceIconUrl());
        })
    })
    describe('query', function() {
        var service;
        before(function() {
            service = new XboxMusic({
                client_id: client_id,
                client_secret: client_secret
            });
        })
        describe("search artist", function() {
            it("should return a not empty an array of objects", function(done) {
                this.timeout(10000);
                service.search("artist", "Daft Punk", function(results) {
                    assert.notEqual(results.length, 0);
                    done();
                });
            });
        });

        describe("get albums for artist", function() {
            var results;
            before(function(done) {
                this.timeout(10000);
                service.getArtistAlbums("music.C61C0000-0200-11DB-89CA-0019B92A3933", function(r) {
                    results = r;
                    done();
                });
            });
            it("should return a not empty an array of objects", function() {
                assert.notEqual(results.length, 0);
            });
            it("should contain a title", function() {
                assert.ok("title" in results[0]);
            });
            it("should contain an href", function() {
                assert.ok("href" in results[0]);
            });
            it("should contain an id", function() {
                assert.ok("id" in results[0]);
            });
            it("should contain a cover", function() {
                assert.ok("cover" in results[0]);
            });
            it("should contain a release_date", function() {
                assert.ok("release_date" in results[0]);
            });
        });

        describe("get artist", function() {
            var result;
            before(function(done) {
                this.timeout(10000);
                service.get("artist", "music.C61C0000-0200-11DB-89CA-0019B92A3933", function(r) {
                    result = r;
                    done();
                });
            });
            it("should contain a name", function() {
                assert.ok("name" in result);
            });
            it("should be Daft Punk", function() {
                assert.equal("Daft Punk", result.name);
            });
            it("should contain an href", function() {
                assert.ok("href" in result);
            });
            it("should contain an id", function() {
                assert.ok("id" in result);
            });
            it("should contain an icon", function() {
                assert.ok("icon" in result);
            });
        });
    });
});
