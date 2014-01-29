var request = require('request'),
    oauth = require('oauth'),
    querystring= require('querystring'),
    serviceurl = "https://datamarket.accesscontrol.windows.net/v2/",
    baseurl = "https://music.xboxlive.com/1",
    iconurl = "http://music-cache.xbox.com/Content/images/favicon-v0.1.ico",
    type_mapping = {
        artist: "Artists",
        album: "Albums",
        track: "track"
    };



function parse(type, object) {
    if (type === "album") {
        return {
            title: object.Name,
            id: object.Id,
            href: object.Link,
            release_date: 'object.release_date',
            cover: object.ImageUrl
        };
    }
    if (type === "artist") {
        return {
            name: object.Name,
            id: object.Id,
            href: object.Link,
            icon: object.ImageUrl
        }
    }
    if (type === "track") {
        return {
            // title: object.title,
            // id: object.id,
            // href: object.link,
            // release_date: object.release_date
        };
    }
}

function removeBOM(str) {
    if (/^\uFEFF/.test(str)) {
        return str.replace(/^\uFEFF/, '');
    }
    return str;
}

var XboxMusic = function XboxMusic(options) {
    var OAuth2 = oauth.OAuth2;
    this.oauth2 = new OAuth2(
        options.client_id,
        options.client_secret,
        serviceurl,
        "OAuth2-13",
        "OAuth2-13",
        null
    );
    this.oauth2.setAccessTokenName('accessToken');
}

XboxMusic.prototype.getServiceIconUrl = function() {
    return iconurl;
};

XboxMusic.prototype.search = function xbox_search(type, query, callback) {
    var that = this;
    this.oauth2.getOAuthAccessToken(
        null,
        {
            'grant_type':'client_credentials',
            "scope": "http://music.xboxlive.com"
        },
        function(e, access_token, refresh_token, results) {
            that.oauth2.get(
                baseurl + "/content/music/search?" + querystring.stringify({
                    q: "'" + query + "'",
                    filters: type_mapping[type]
                }),
                that.oauth2.buildAuthHeader(access_token),
                function(error, body, response) {
                    var answer = JSON.parse(removeBOM(body)),
                        results = answer[type_mapping[type]].Items.map(function(item, key, list) {
                            return parse(type, item);
                        });
                    callback(results, query);
                }
            );
        }
    );
};

XboxMusic.prototype.get = function xbox_get(type, id, callback) {
    var self = this;
    this.oauth2.getOAuthAccessToken(
        null,
        {
            'grant_type':'client_credentials',
            "scope": "http://music.xboxlive.com"
        },
        function(error, access_token, refresh_token, results) {
            request.get(
                {
                    url: baseurl + "/content/" + id + "/lookup",
                    qs: {
                        accessToken: self.oauth2.buildAuthHeader(access_token)
                    }
                },
                function(error, response, body) {
                    var answer = JSON.parse(removeBOM(body)),
                        result = parse(type, answer[type_mapping[type]].Items[0]);
                    callback(result, id);
                }
            );

        }
    )
};


function _getArtistAlbums(access_token, artistid, albums, continuationToken, callback) {
    var qs = {};
    if (continuationToken) {
        qs = {
            accessToken: access_token,
            continuationToken: continuationToken
        };
    } else {
        qs = {
            accessToken: access_token,
            extras: "albums"
        };
    }
    albums = albums || [];
    request.get(
        {
            url: baseurl + "/content/" + artistid + "/lookup",
            qs: qs
        },
        function(error, response, body) {
            var answer = JSON.parse(removeBOM(body));
            albums.push.apply(albums, answer.Artists.Items[0].Albums.Items.map(function(item) {
                return parse("album", item);
            }));
            if (answer.Artists.Items[0].Albums.ContinuationToken) {
                _getArtistAlbums(access_token, artistid, albums, answer.Artists.Items[0].Albums.ContinuationToken, callback);
            } else {
                callback(albums, artistid);
            }
        }
    );
}

XboxMusic.prototype.getArtistAlbums = function(artistid, callback, availableAlbums, continuationToken) {
    var self = this;
    if (availableAlbums === undefined) {
        availableAlbums = [];
    }
    this.oauth2.getOAuthAccessToken(
        null,
        {
            'grant_type':'client_credentials',
            "scope": "http://music.xboxlive.com"
        },
        function(e, access_token, refresh_token, results) {
            _getArtistAlbums(self.oauth2.buildAuthHeader(access_token), artistid, null, null, callback);
        }
    );
};

module.exports = XboxMusic;