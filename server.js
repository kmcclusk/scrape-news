//Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");

var PORT = 3000;

//Models
var Article = require("./models/Article.js");
var Note = require("./models/Notes.js");

var request = require("request");
var cheerio = require("cheerio");

mongoose.Promise = Promise;

var app = express();

app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(express.static("public"));

mongoose.connect("mongodb://heroku_ffbx2g5d:784lv6b0jh5d9glut655kvoniv@ds061076.mlab.com:61076/heroku_ffbx2g5d", { useMongoClient: true });
var db = mongoose.connection;

db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

db.once("open", function() {
  console.log("Connection successful.");
});


//setup express handlebars
var exphbs = require("express-handlebars");
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");


// Get Request
app.get("/scrape", function(req, res) {
  
  request("http://www.theonion.com/", function(error, response, html) {
    
    var $ = cheerio.load(html);
   
    $("article").each(function(i, element) {

      var result = {};

      
      result.title = $(element).find("h2.headline").text();
      result.link = $(element).find("a.link").attr("href");

     
      var entry = new Article(result);

      console.log(result);
      
      // Save to database
      entry.save(function(err, result) {
       
        if (err) {
          console.log(err);
        }
        
        else {
          console.log(result);
        }
      });

    });
  });
  res.send("Scrape Complete");
});


app.get("/articles", function(req, res) {
  
  Article.find({}, function(error, result) {
    
    if (error) {
      console.log(error);
    } else {
      res.send(result);
    }
  });
});


app.get("/articles/:id", function(req, res) {
  
  Article.findOne({ "_id": req.params.id })
  
  .populate("note")
  
  .exec(function(error, result) {
 
    if (error) {
      console.log(error);
    } else {
      res.json(result);
    }
  });
});


app.post("/articles/:id", function(req, res) {
  
  var newNote = new Note(req.body);

  
  newNote.save(function(error, result) {
  
    if (error) {
      console.log(error);
    } else {
      
      Article.findOneAndUpdate({ "_id": req.params.id }, { "note": result._id })
      
      .exec(function(err, result) {
        
        if (err) {
          console.log(err);
        } else {

          res.send(result);
        }
      });
    }
  });
});


// Listen on port 3000
app.listen(3000, function() {
  console.log("App running on port 3000!");
});