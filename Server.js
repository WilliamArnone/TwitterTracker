const express = require('express');
const bodyParser = require("body-parser");
const newapi = require('./tweeter_api.js');
const watch = require('./watch.js');
const fs = require('fs');
const https = require('https');

var app = express();

app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(bodyParser.json());


app.get("/", function (req, res) {
    res.render("index");
});

//###TWITTER API###

app.post("/tweet", async function (req, res) {
    if(req.body.params){
        if(!req.body.params.status) return res.status(400).send("'status' parameter is mandatory.");
        let tweet = await newapi.postTweet(req.body.params);
        if(tweet){
            res.setHeader('Content-Type', 'application/json');  
            return res.status(200).send(tweet);
        } else return res.status(500).send("Could not post your tweet.");
    } else return res.status(400).send("Provide parameters for your tweet.");
});


app.get("/user", async function (req, res) {
    let user = await newapi.getUser(req.query);
    res.setHeader('Content-Type', 'application/json');  
    if(user) return res.status(200).send(user)
    else return res.status(404).send("Could not find user.");
});

app.post("/media", async function (req, res) {
    if(req.body.imgdata){
        let media_key = await newapi.uploadMedia(req.body.imgdata);
        if(media_key){
            res.setHeader('Content-Type', 'application/json');  
            return res.status(200).send(media_key);
        } else return res.status(500).send("Could not upload image.");
    } else return res.status(400).send("Provide image base64 data in your request.");
});

/* vd https://developer.twitter.com/en/docs/twitter-api/v1/tweets/search/api-reference/get-search-tweets per parametri da passare a search
 * passate uno per uno quelli che volete usare nella query e la funzione fa parsing e li mette in un oggetto params*/
app.get("/search", async function (req, res) {
    let params = {};
    for(let field in req.query){
        params[field] = req.query[field];
    }
    let arr = await newapi.recentSearch(params);
    if(arr) {
        if(arr.length > 0){
            res.setHeader('Content-Type', 'application/json');  
            return res.status(200).send(arr);
        } 
        else return res.status(404).send("Nessun tweet corrisponde alla ricerca.");
    }
    else return res.status(500).send("Errore in search.");
});

/* vd https://developer.twitter.com/en/docs/twitter-api/v1/tweets/filter-realtime/api-reference/post-statuses-filter per parametri da passare a search
 * passate uno per uno quelli che volete usare nella query e la funzione fa parsing e li mette in un oggetto params*/
app.post("/stream/start", async function (req, res) {
    console.log("in stream");
    let params = {};
    for(let field in req.query){
        params[field] = req.query[field];
    }
    try {
        newapi.startStream(params);
        return res.status(200).send("Stream started.");
    } catch(err) {
        console.log(err);
        return res.status(500).send("Whoops @ stream");
    }
});

//ferma lo stream
app.post("/stream/stop", async function(req, res) {
    try{
        await newapi.closeStream();
        return res.status(200).send("Stream stopped.");
    } catch(err){
        console.log(err);
        return res.status(500).send("Very very bad");
    }
});

//svuota il buffer dello stream e lo restituisce
app.get("/stream", function (req,res) {
    let arr = newapi.stream_arr.slice();
    newapi.stream_arr = [];
    res.setHeader('Content-Type', 'application/json');  
    return res.status(200).send(arr);
});


/*WATCH METHODS*/

//mette in azione un nuovo watcher con nome name, che fa una search di tweets con parametri
//params ogni timer millisecondi
app.post("/watch/start", async function (req, res) {
    if(req.body.name && req.body.params && req.body.timer){
        req.body.name;
        req.body.params;
        req.body.timer;
        if(await watch.addWatcher(req.body.name, req.body.timer, req.body.params) < 0)
            return res.status(400).send("Watcher name already in use.");
        return res.status(200).send("New watcher added.");
    }
    else return res.status(400).send("Invalid or missing parameters in request");
});

//ferma e rimuove il watcher con nome name
app.post("/watch/stop", function (req, res) {
    if(req.query.name){
        watch.removeWatcher(req.query.name);
        return res.status(200).send("Removed watcher.");
    }
    else return res.status(400).send("Invalid query, watcher name needed.");
});

//ritorna nome e status(nuovi tweets?) di ogni watcher in un oggetto {name: nome, new: boolean}
app.get("/watch", function (req, res) {
    return res.status(200).send(watch.listWatchers());
});

//prende namelist=list_of_names come parametro di query, ritorna una lista di dati di quei watcher
app.get("/watch/data", function (req, res) {
    if(req.query.namelist){
        let data = watch.getWatchersData(req.query.namelist);
        return res.status(200).send(data);
    }
    else return res.status(400).send("List of watcher names needed.");
});


app.listen(8000, () => {
    console.log(`app listening at http://localhost:8000`);
});

