//RUN WITH NODE AFTER CHANGING TEST PARAMETERS
//TEST WILL GATHER REAL TIME RULED TWEETS FOR 5 SECONDS OR SAMPLED TWEETS FOR 5 MORE SECONDS
//RESULTS ARE THEN PRINTED IN OUTPUT FILE

const twitter_api = require('../twitter_api.js')

//expression, tag format
const rule1 = ['#BLM','black lives matter'];
const rule2 = ['to:realdonaldtrump covid','tweets to trump about covid'];
const rule3 = ['#memes','dank memes'];


(async() => {
    //RULED STREAM TEST
    await twitter_api.removeAllRules();
    await twitter_api.setFilter(rule1[0], rule1[1]);
    await twitter_api.setFilter(rule2[0], rule2[1]);
    await twitter_api.setFilter(rule3[0], rule3[1]);
    await twitter_api.ruledStream();
    setTimeout(function() {
        twitter_api.closeStream();
        twitter_api.saveStreamToJson();
    }, 5000);
    //SAMPLED STREAM TEST
    /*
    twitter_api.stdStream();
    setTimeout(function() {
        twitter_api.closeStream();
        twitter_api.saveStreamToJson();
    }, 5000);
    */
})();
