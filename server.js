/**
 * Created by ryanhoyda on 9/3/17.
 */
// Dependencies
/**
 * Created by ryanhoyda on 9/3/17.
 */
// Dependencies
var fs = require('fs');
var bodyParser = require("body-parser");
var logger = require("morgan");
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

// Use morgan and body parser with our app
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));


// Database configuration
//Use this for local
//var databaseUrl = "mongodb://localhost:27017/news_sites";

//This one is for heroku
var databaseUrl = "mongodb://heroku_cpnh1z9z:ef4lfp7cq064cqu2ld3q2ee4ga@ds141474.mlab.com:41474/heroku_cpnh1z9z";
mongoose.connect(databaseUrl);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));


//db schema ----------------------------------
db.once('open', function () {

    var NoteSchema = mongoose.Schema({
        title: {
            type: String
        },

        body: {
            type: String
        }
    });

    var wsjSchema = mongoose.Schema({
        title: String,
        link: String,
        summary: String,
        note: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Note"
        }
    });

    var Note = mongoose.model('Note', NoteSchema);
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


                //takes promises array (find promises) .all in funct executing
                //chained to .then function which gives us results array
                //and executes each promise in order
                //then function
                Promise.all(findPromises).then(function(results){
                    var savePromises = [];
                    //create save promises array
                    results.forEach(function(elem){
                        //go through each element in results array
                        if(elem){
                            //wsj value.  either undefined or instance of model
                            savePromises.push(elem.save());
                            //we call save which returns a promise and store in savePromises array
                        }
                    });
                    Promise.all(savePromises).then(function(models){
                        //similar to first
                        //except they are now saved to the db as models.
                        models.forEach(function(elem){
                            articles.push(elem);
                            //pushed into articles array
                        });
                        resolve(articles);
                        //call the function in order to resolve the promises from line 104
                        //lots of nested promises
                    });
                });
            });
            promise.then(function(articles){
                //this is the promise from line 104, but doesn't run until the .then on 198
                //articles is an array that comes from resolve on 192
                json.count = articles.length;
                //declared on 98
                json.articles = articles;
                res.json(json);
                //express sending json back to web browser
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


    //fired by delete button on articles page
    // :id is path parameter and corresponds to mongo id assigned to documber
    app.post('/articles/delete/:id', function(req, res){
        //fires and makes ajax call to this endpoint on the server from browser
        WsjModel
            .deleteOne({'_id': req.params.id})
            //how it knows to look up which article to delete
            .exec(function(err, doc){
                //this executes the delete
                if(err){
                    res.json(err);
                } else {
                    res.json('Deleted');
                }
            });
    });

    //used when note page loads
    //jquery get json
    //get doc id from ajax call
    app.get('/articles/find/:id', function(req, res){
        WsjModel.findOne({'_id': req.params.id})
            //matching doc ids
            .populate('note')
            //populate note tab on wsj-model
            .exec(function(err, doc){
                //executes the function
                if(err){
                    res.json(err);
                } else {
                    res.json(doc);
                }
            })
    });


    //2 cases here
    //1 - no note on article yet
    //2 - is a note on article and must be updated
    app.post('/articles/comment/update/:id', function(req, res){
        var note = new Note({title: req.body.title,
            //create a new note in case we need it
            body: req.body.body});
        WsjModel.findOne({'_id': req.params.id})
            .populate('note')
            .exec(function(err, wsjDoc){
                if(err){
                    console.error(err);
                    res.json(err);
                } else {
                    if(wsjDoc.note){
                        //Either will be undefined or have note doc
                        Note.findOneAndUpdate({'_id': wsjDoc.note._id}, {'body': req.body.body})
                            //corresponds with case 2 where has to find a note and update it
                            //grabbed from text box
                            .exec(function(err, doc){
                                if(err){
                                    res.json(err);
                                } else {
                                    res.json(doc);
                                }
                            });
                    } else {
                        note.save(function(err, noteDoc){
                            //case 1 if we don't have a new note
                            // call note.save to save note
                            if(err){
                                res.json(err);
                            } else {
                                wsjDoc.update({'note': noteDoc._id})
                                    //updates the note property on wsj document
                                    .exec(function(err, doc){
                                        if(err){
                                            res.json(err);
                                        } else {
                                            res.json(doc);
                                        }
                                    })
                            }
                        })
                    }
                }
            });
    });

// Listen on port 3000
    app.listen(3000, function () {
        console.log("App running on port 3000!");
    });
});
