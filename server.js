/**
 * Created by ryanhoyda on 9/3/17.
 */
// Dependencies
/**
 * Created by ryanhoyda on 9/3/17.
 */
// Dependencies
var fs = require('fs');
var express = require("express");
var mongojs = require("mongojs");
// Require request and cheerio. This makes the scraping possible
var request = require("request");
var cheerio = require("cheerio");
var mongoose = require('mongoose');
mongoose.Promise = Promise;

// Initialize Express
var app = express();
app.use(express.static("public"));

// Database configuration
var databaseUrl = "mongodb://localhost:27017/news_sites";
mongoose.connect(databaseUrl);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));


//db schema ----------------------------------
db.once('open', function () {
    var wsjSchema = mongoose.Schema({
        title: String,
        link: String,
        summary: String
    });

    var WsjModel = mongoose.model('WSJ-Model', wsjSchema);

//------------------------------------------


    // Main route
    app.get("/", function (req, res) {
        res.redirect('index.html');
    });

    // Retrieve data from the db
    //processing http get request
    //function name all - endpoint, function
    //and then retrieving all info from database
    app.get("/all", function (req, res) {
        // Find all results from the scrapedData collection in the db
        db.scrapedData.find({}, function (error, found) {
            // Throw any errors to the console
            if (error) {
                console.log(error);
            }
            // If there are no errors, send the data to the browser as json
            else {
                res.json(found);
            }
        });
    });

    // Scrape data from one site and place it into the mongodb db
    //scrape is endpoint, function
    //processes on this endpoint when it receives a get request.
    app.get("/scrape", function (req, res) {
        // Make a request for the news section of WSJ
        request("https://www.wsj.com/", function (error, response, html) {
            //json has 2 props count and articles
            var json = {
                count: 0,
                articles: []
            };
            //The web scraping is an asyn process so we need
            //to wrap it in a Promise
            var promise = new Promise(function(resolve, reject){

                //All new articles are stored here
                var articles = [];

                //This will contain query promises to the db
                //for each article. That way they are still unique
                var findPromises = [];

                // Load the html body from request into cheerio
                var $ = cheerio.load(html);
                // For each element with a "title" class
                $("h3.wsj-headline").each(function (i, element) {
                    // Save the text and href of each link enclosed in the current element
                    var title = $(element).children().text();
                    var summary = $(element)
                        .siblings('.wsj-card-body')
                        .children('.wsj-summary')
                        .children('span')
                        .text();
                    var link = $(element).children().attr("href");

                    //Fall back if the first approach did not grab a summary
                    if (summary === '') {
                        summary = $(element)
                            .siblings('.wsj-summary')
                            .children('span')
                            .text();
                    }

                    // If this found element had both a title and a link
                    if (title && link && summary) {
                        var article = new WsjModel({
                            title: title,
                            link: link,
                            summary: summary
                        });

                        //Create a new promise for each article
                        //The query to the db is async so each query
                        //has to be wrapped in a Promise
                        var findPromise = new Promise(function(resolve, reject){
                            //Perform a db query
                            WsjModel.find({
                                'title': title,
                                'link': link,
                                'summary': summary
                            }).exec(function(err, results){
                                var count = results.length;
                                if(count === 0){
                                    //This is a new article so pass it to
                                    //the resolve function
                                    resolve(article);
                                } else {
                                    //This article exists so just pass
                                    //undefined to the resolve function
                                    resolve(undefined);
                                }
                            });
                        });
                        //Now execute all db queries
                        findPromises.push(findPromise);
                    }
                });


                Promise.all(findPromises).then(function(results){
                    var savePromises = [];
                    results.forEach(function(elem){
                        if(elem){
                            savePromises.push(elem.save());
                        }
                    });
                    Promise.all(savePromises).then(function(models){
                        models.forEach(function(elem){
                            articles.push(elem);
                        });
                        resolve(articles);
                    });
                });
            });
            promise.then(function(articles){
                json.count = articles.length;
                json.articles = articles;
                res.json(json);
            });
        });
    });

    //TODO: add a saved article endpoint
    //add saved article endpoint
    app.get("/articles", function (req, res) {
        //Return every article in the db see example lines 90-99
        WsjModel.find({}, function(error, doc) {
            // Log any errors
            if (error) {
                console.log(error);
            }
            // Or send the doc to the browser as a json object
            else {
                res.json(doc);
            }
        });
    });


    //
    app.post('/articles/delete/:id', function(req, res){
        WsjModel
            .deleteOne({'_id': req.params.id})
            .exec(function(err, doc){
                if(err){
                    res.json(err);
                } else {
                    res.json('Deleted');
                }
            });
    });


// Listen on port 3000
    app.listen(3000, function () {
        console.log("App running on port 3000!");
    });
});
