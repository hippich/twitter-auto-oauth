/* eslint no-unused-expressions:0 */
/* eslint-env mocha */

var chai = require('chai');
var expect = chai.expect;

var TAuth = require('../');

if (!process.env.TWITTER_USERNAME || !process.env.TWITTER_PASSWORD) {
    throw new Error('TWITTER_USERNAME and TWITTER_PASSWORD env variables are required.');
}

if (!process.env.CONSUMER_KEY || !process.env.CONSUMER_SECRET) {
    throw new Error('CONSUMER_KEY and CONSUMER_SECRET env variables are required.');
}

describe('Twitter OAuth Authentication', function() {

    it('should successfuly get access and access_secret tokens', function(done) {
        this.timeout(60000);

        var tauth = new TAuth({
            username       : process.env.TWITTER_USERNAME,
            password       : process.env.TWITTER_PASSWORD,
            consumerKey    : process.env.CONSUMER_KEY,
            consumerSecret : process.env.CONSUMER_SECRET
        });

        tauth.then(function(result) {
            expect(result.oauth_access_token).to.be.not.empty;
            expect(result.oauth_access_token_secret).to.be.not.empty;
            expect(result.user_id).to.be.not.empty;
            expect(result.screen_name).to.equal(process.env.TWITTER_USERNAME);
            done();
        }).catch(function(err) {
            throw err;
        });
    });
});
