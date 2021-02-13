//RUN WITH NODE AFTER CHANGING TEST PARAMETERS
//RESULTS ARE PRINTED IN OUTPUT FILE

const twitter_api = require('../twitter_api.js');

(async() => {
    await twitter_api.recentSearch("#lockdown", 100);
    twitter_api.saveSearchToJson();
})();

