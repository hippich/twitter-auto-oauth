var _ = require('lodash');
var Promise = require('bluebird');
var Browser = require('zombie');
var http = require('http');
var url = require('url');
var oauth = require('oauth');
var portfinder = require('portfinder');
var debug = require('debug')('twitter-auto-oauth');

var TAuth = function(options) {
    var that = this;

    that.options = _.merge({
        remoteOptions: {
            desiredCapabilities: {}
        }
    }, options);

    this.browser = new Browser();

    var authPromise = new Promise(function(resolve, reject) {
        portfinder.getPort(function(err, port) {
            if (err) {
                return reject(err);
            }

            debug('Using port %s', port);

            that.port = port;
            that.server = http.createServer(that.handleRequest.bind(that));
            that.server.listen(that.port, function(e) {
                return reject(e);
            });

            resolve();
        });
    });

    if (! that.options.noAuto) {
        debug('Launching browser.');
        authPromise = authPromise.then(this.startAuthentication.bind(this));
    }

    // Make sure to close server on success or if something fails
    authPromise.then(function() {
        that.server.close();
    }).catch(function() {
        that.server.close();
    });

    return authPromise;
};

TAuth.prototype.startAuthentication = function() {
    var that = this;

    var flow = new Promise(function(resolve/*, reject*/) {
        var url = 'http://127.0.0.1:' + that.port + '/start';

        debug('Visiting %s', url);

        that.browser.visit(url, function() {
            debug('Openned /start');
            that.browser.fill('session[username_or_email]', that.options.username)
                        .fill('session[password]', that.options.password)
                        .pressButton('Authorize app', resolve);
        });
    });

    flow = flow.then(function() {
        var data = that.browser.html().replace(/^.+?\{/, '{')
                                      .replace(/\}.+?$/, '}');

        try {
            data = JSON.parse(data);
        }
        catch (e) {
            return Promise.reject(e);
        }

        return Promise.resolve(data);
    });

    return flow;
};

TAuth.prototype.handleRequest = function(req, res) {
    debug('Server hit: %s', req.url);

    var path = url.parse(req.url).pathname;

    switch(path) {
        case '/start':
            return this.beginOauth(req, res);
        case '/callback':
            return this.oauthCallback(req, res);
    }

    res.statusCode = 404;
    res.statusMessage = 'Not found';
    res.end();
};

TAuth.prototype.beginOauth = function(req, res) {
    var that = this;
    var callbackURL = 'http://127.0.0.1:' + this.port + '/callback';

    this.oauthClient = new oauth.OAuth(
        "https://twitter.com/oauth/request_token",
        "https://twitter.com/oauth/access_token",
        this.options.consumerKey,
        this.options.consumerSecret,
        "1.0A",
        callbackURL,
        "HMAC-SHA1"
    );

    this.oauthClient.getOAuthRequestToken(function(error, oauthToken, oauthTokenSecret/*, results*/) {
        if (error) {
            res.statusCode = 500;
            res.statusMessage = error;
            return res.end();
        }

        that.oauthToken = oauthToken;
        that.oauthTokenSecret = oauthTokenSecret;

        res.writeHead(302, {
            'Location': 'https://twitter.com/oauth/authorize?oauth_token=' + oauthToken
        });
        res.end();
    });
};

TAuth.prototype.oauthCallback = function(req, res) {
    var query = url.parse(req.url, true).query;

    debug('Using oauth_verifier = %s', query.oauth_verifier);

    this.oauthClient.getOAuthAccessToken(
        this.oauthToken,
        this.oauthTokenSecret,
        query.oauth_verifier,
        function(error, oauth_access_token, oauth_access_token_secret, results) {
            if (error) {
                res.statusCode = 500;
                res.statusMessage = error;
                return res.end();
            }

            results.oauth_access_token = oauth_access_token;
            results.oauth_access_token_secret = oauth_access_token_secret;

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(results));
        }
    );
};

module.exports = TAuth;
