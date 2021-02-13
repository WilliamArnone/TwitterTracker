# Group 16 Documentation
Basic documentation on TwitterAnalytics' project code for the 20/21 Software Engineering Course @Unibo.

# API WRAPPER
The project makes use of early access 2.0 Twitter API. A wrapper for the API was written to abstract the making of possibly huge HTTP requests required
## Real Time Tweets Streaming
The API offers two possibilites for real time tweets: the first one is **Sampled Stream**, which gets you unfiltered real time tweets, the other one is **Ruled Stream**, which gets you filtered (according to a given query) real time tweets.
### removeAllRules()
This function removes the current rules set on the in-use Twitter development account.
### setFilters(expression,name)
This function sets one set of rules according to the given query **expression** (see [here](https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/integrate/build-a-rule)) and names it **name**.
### stdStream()
This function starts a Sampled Stream.
### ruledStream()
This function starts a Ruled Stream (which is gonna use the rules set with the **setFilters** function).
### closeStream()
This function closes all ongoing streams.
### saveStreamToJson([path)
This function saves the stream array  to **path** (which by default is *./tweet_dump.txt*).
## Search Recent Tweets
The API lets you gather recent tweets in a timeframe of 7 days maximum with a cap of 100 tweets per search. Just as with ruled streams, tweets are filtered according to a given query.
### recentSearch(expression, number, [path)
This function searches for **number** tweets by the given query **expression** and writes the result in **path** (which by default is *./search_dump.txt*).
### saveSearchToJson([path)
This function saves the search array to **path** (which by default is *./search_dump.txt*).
