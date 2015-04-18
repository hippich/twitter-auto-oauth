Username and password Twitter API authentication
================================================

This is pretty backwards, but I need to be able to use my app with different
twitter accounts using Twitter API. Before I spent some steps fetching
`oauth_access` and `oauth_access_secret` manually which was quite boring.

Now using <a href="http://zombie.js.org/">Zombie.js</a> I can automate whole
process of obtaining authentication token. I made this into separate package
to be easily re-used across my and other's apps.

Usage
=====

```javascript
var TAuth = require('twitter-auto-oauth');

var auth = new TAuth({
    username       : process.env.TWITTER_USERNAME,
    password       : process.env.TWITTER_PASSWORD,
    consumerKey    : process.env.CONSUMER_KEY,
    consumerSecret : process.env.CONSUMER_SECRET
});

auth.then(function(result) {
    /*
      result will contain something like this:

      {
          "user_id": "1234567",
          "screen_name": "twituser",
          "oauth_access_token": "12345678-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          "oauth_access_token_secret": "rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr"
      }
    */
}).catch(function(err) {
    throw err;
});
```

Tests
=====

Right now there is only one test. You need to suply your own twitter username/password as well as
consumer key/secret to run it. Consumer key/secret has to be obtained in developer panel on twitter.com.

```
TWITTER_USERNAME=username TWITTER_PASSWORD=password CONSUMER_KEY=kkkkkkkkkkkkkkkkkkkkkk CONSUMER_SECRET=ssssssssssssssssssssssssssssssssssssssssss npm test
```
