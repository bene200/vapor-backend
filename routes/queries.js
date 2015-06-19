var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'), //mongo connection
    bodyParser = require('body-parser'), //parses information from POST
    methodOverride = require('method-override'); //used to manipulate POST

router.use(bodyParser.urlencoded({ extended: true }));
router.use(methodOverride(function(req, res){
      if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        var method = req.body._method;
        delete req.body._method;
        return method;
      }
}));

//build the REST operations at the base for queries
//this will be accessible from http://127.0.0.1:3000/queries if the default route for / is left unchanged
router.route('/')
    //GET all blobs
    .get(function(req, res, next) {
        //CORS headers
        res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        res.header('Access-Control-Allow-Credentials', 'true');
        console.log(res.header());
        //retrieve all blobs from Monogo
        mongoose.model('Query').find({}, function (err, queries) {
              if (err) {
                  return console.error(err);
              } else {
                  //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
                  res.format({
                    //HTML response will show all queries in JSON format
                    html: function(){
                        res.json(queries);
                    },
                    //JSON response will show all queries in JSON format
                    json: function(){
                        res.json(queries);
                    }
                });
              }     
        });
    })
    //POST a new query
    .post(function(req, res) {
        //CORS headers
        res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        res.header('Access-Control-Allow-Credentials', 'true');
        // Get values from POST request. These can be done through forms or REST calls. These rely on the "name" attributes for forms
        var anno = req.body.anno;
        var interactions = req.body.interactions;
        var msa = req.body.msa;
        var phylotree = req.body.phylotree;
        //call the create function for our database
        mongoose.model('Query').create({
            anno: anno,
            interactions: interactions,
            msa: msa,
            phylotree: phylotree
        }, function (err, query) {
              if (err) {
                  res.send("There was a problem adding the information to the database.");
              } else {
                  //Blob has been created
                  console.log('POST creating new query with ID: ' + query.id);
                  res.format({
                    //HTML response will set the location and redirect back to the home page. You could also create a 'success' page if that's your thing
                    html: function(){
                        res.json(query);
                    },
                    //JSON response will show the newly created blob
                    json: function(){
                        res.json(query);
                    }
                });
              }
        })
    });

// route middleware to validate :id
router.param('id', function(req, res, next, id) {
    //CORS headers
    res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Credentials', 'true');
    //console.log('validating ' + id + ' exists');
    //find the ID in the Database
    mongoose.model('Query').findById(id, function (err, query) {
        //if it isn't found, we are going to repond with 404
        if (err) {
            console.log(id + ' was not found');
            res.status(404)
            var err = new Error('Not Found');
            err.status = 404;
            res.format({
                html: function(){
                    next(err);
                 },
                json: function(){
                       res.json({message : err.status  + ' ' + err});
                 }
            });
        //if it is found we continue on
        } else {
            //uncomment this next line if you want to see every JSON document response for every GET/PUT/DELETE call
            //console.log(blob);
            // once validation is done save the new item in the req
            req.id = id;
            // go to the next thing
            next(); 
        } 
    });
});

router.route('/:id')
  .get(function(req, res) {
    //CORS headers
    res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Credentials', 'true');
    mongoose.model('Query').findById(req.id, function (err, query) {
      if (err) {
        console.log('GET Error: There was a problem retrieving: ' + err);
      } else {
        console.log('GET Retrieving ID: ' + query._id);
        res.format({
          html: function(){
              res.json(query);
          },
          json: function(){
              res.json(query);
          }
        });
      }
    });
  });

module.exports = router;
