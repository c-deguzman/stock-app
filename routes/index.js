module.exports = {

	home(app){

		var React = require('react');
		var ReactDOM = require('react-dom/server');

		require('babel-core/register');

		app.get('/', function(request, response) {
		  var Home_App = require(process.env.ROOT + "/src/Home.js").default;
		  var Home_html = require(process.env.ROOT + "/src/home_template").default;

		  var Comp_Fact = React.createFactory(Home_App);
		  const Home_string = ReactDOM.renderToString(Comp_Fact());
		  
		  response.send(Home_html({
		    body: Home_string,
		    title: "Home Page"
		  }));
		});
	},

	get_start(app){

		app.post("/get_info", function(request, response){

			var MongoClient = require('mongodb').MongoClient;

		  	MongoClient.connect(process.env.MONGO_CONNECT, function (err, db){
			    if (err){
			      throw err;
			      return;
			    }

			    db.collection("stock_list", function (err, collection){

			      if (err){
			        throw err;
			        return;
			      } 

			      collection.find({}).toArray(function (err, documents) {

			        if (err){
			          throw err;
			          return;
			        }

			       	response.send({
			       		origin: request.get("origin"),
			       		stock_list: documents
			       	});
			      });   
			    });
		  	});
		});
	},

	get_stock(app){
		var _request = require("request");

		// Provide clients with stock information, based on passed ticker
		app.post("/get_stock", function(request, response){

			var url = "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=" + request.body.ticker + "&outputsize=full&apikey=" + process.env.ALPHA;

			_request(url, function(error, res, body){
				response.send(body);
			});
		});
	},

	add_stock(app, wss){
		var _request = require("request");
		var MongoClient = require('mongodb').MongoClient;

		app.post("/add_stock", function(request, response){

			var url = "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=" + request.body.ticker + "&apikey=" + process.env.ALPHA;


			_request(url, function(error, res, body){
				if (JSON.parse(body).hasOwnProperty("Error Message")){

					response.send({"result": "error",
								   "error": "Invalid stock ticker."});
					return;
				} else {
					MongoClient.connect(process.env.MONGO_CONNECT, function (err, db){
					    if (err){
					      throw err;
					      return;
					    }

					    db.collection("stock_list", function (err, collection){

				        	if (err){
			        			throw err;
				        		return;
			      			}

		        			collection.insert({ticker: request.body.ticker}, function (err, docs_added) {

						        if (err){
						        	response.send({"result": "error",
					        					   "error": "Already following stock."});
						          return;
						        }

					        	collection.find({}).toArray(function (err, documents) {

							        if (err){
							          throw err;
							          return;
							        }

							        for (var i in wss.clients){
							        	wss.clients[i].send(JSON.stringify({stock_list: documents}));
							        }
						        

							       	response.send({
						       			"result": "success"
						       		});
						    	}); 
			        		}); 
					    });
				  	});
				}
			});
		});
	},

	rm_stock(app, wss){
		var MongoClient = require('mongodb').MongoClient;

		app.post("/rm_stock", function(request, response){

			MongoClient.connect(process.env.MONGO_CONNECT, function (err, db){
			    if (err){
			      throw err;
			      return;
			    }

			    db.collection("stock_list", function (err, collection){

		        	if (err){
	        			throw err;
		        		return;
	      			}

	      			collection.remove({ticker: request.body.ticker}, function(err, res){
	      				if (err){
	      					response.send({"result": "error",
	      								   "error": "Error encountered in removing. Item may have been already removed by anothe user."});
	      				}

	      				collection.find({}).toArray(function (err, documents) {

					        if (err){
					          throw err;
					          return;
					        }

					        for (var i in wss.clients){
					        	wss.clients[i].send(JSON.stringify({stock_list: documents}));
					        }
				        

					       	response.send({
				       			"result": "success"
				       		});
				    	}); 
	      			});
	      		});
			 });
		});     			
	}
}