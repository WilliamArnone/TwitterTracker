const Twitter = require('twitter-lite');
require('dotenv').config();

const BEARER_TOKEN = process.env.BEARER_TOKEN;
const CONSUMER_KEY = process.env.CONSUMER_KEY;
const CONSUMER_SECRET = process.env.CONSUMER_SECRET;
const ACCESS_TOKEN_KEY = process.env.ACCESS_TOKEN_KEY;
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

//api.twitter
const app = new Twitter({
    bearer_token: BEARER_TOKEN
});

//api.twitter
const usr = new Twitter({
    consumer_key: CONSUMER_KEY,
    consumer_secret: CONSUMER_SECRET,
    access_token_key: ACCESS_TOKEN_KEY,
    access_token_secret: ACCESS_TOKEN_SECRET
});

//upload.twitter
const upl = new Twitter({
    subdomain: 'upload',
    consumer_key: CONSUMER_KEY,
    consumer_secret: CONSUMER_SECRET,
    access_token_key: ACCESS_TOKEN_KEY,
    access_token_secret: ACCESS_TOKEN_SECRET
});

module.exports = {

    stream: null,
    stream_arr: [],

    recentSearch: async function(params){
        try{
            let res = await app.get('search/tweets', params);
            return res.statuses;
        }
        catch(err){
            console.log(err);
            return null;
        }
    },

    startStream: async function(params){
        this.stream = usr.stream("statuses/filter", params)
            .on("start", response => console.log("start"))
            .on("data", tweet => {
                this.stream_arr.push(tweet);
          })
            .on("error", error => console.log("error", error))
            .on("end", response => console.log("end"));
    },

    closeStream: async function(){
        this.stream.destroy();
    },
    
    //given a twitter user screen_name, returns a user data object
    getUser: async function(query){
        try {
            let res = await app.get('users/show', query);
            return res;
        }
        catch (err) {
            console.log(err);
            return null;
        }
    },
    
    //tweets on fede's account
    //vd. https://developer.twitter.com/en/docs/twitter-api/v1/tweets/post-and-engage/api-reference/post-statuses-update
    postTweet: async function(params){
        try {
            console.log(params);
            let res = await usr.post('statuses/update', params);
            console.log(res);
            return res;
        }
        catch (err) {
            console.log(err);
            return null;
        }

    },
    
    //given a base64 image url, uploads the image to twitter and returns the media_key object
    //vd. https://developer.twitter.com/en/docs/twitter-api/v1/media/upload-media/api-reference/post-media-upload
    uploadMedia: async function(imgdata){
        try {
            console.log(imgdata);
            let res = await upl.post('media/upload', { "media_data": imgdata, "media_category": "tweet_image" });
            return res;
        }
        catch (err) {
            console.log(err);
            return null;
        }
    }
}
