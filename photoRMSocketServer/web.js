// web.js
var express = require("express");
var logfmt = require("logfmt");
var app = express();

var client = require('redis-url').connect(process.env.REDISTOGO_URL);

app.use(logfmt.requestLogger());


app.get('/set/:key/:value', function(req, res) {
	var fieldname = 'resource';
	console.log('Set Key: '+ req.param('key'));
	client.hset(req.param('key'), req.param('value') , req.param('value'));

	res.send(req.param('key')+" successfully set with value " + req.param('value'));

  
 });

app.get('/get/:key', function(req, res) {

	console.log('Get Key: '+ req.param('key'));
	
	var vals = [];

	client.hkeys(req.param('key'), 
				function (err, replies) {
					if (err){
						console.log(err);
					}
					else{
		    			console.log(replies.length + " replies:\n");
		    			replies.forEach(function (reply, i) {
		    				vals.push(reply);
		    				console.log("    " + i + ": " + reply);
	    			});
		    		res.send(vals);
//		 			client.quit();

				}
	});


 });

var port = Number(process.env.PORT || 5000);

app.listen(port, function() {
	console.log("Listening on " + port);
    });


//-----------------
//Socket Application
//-----------------

// var app = require('express')()
//   , server = require('http').createServer(app)
//   , io = require('socket.io').listen(server);

// var port = Number(process.env.PORT || 5000);

// server.listen(port, function() {
// 	console.log("Listening on " + port);
//     });

// app.get('/', function (req, res) {
//   res.sendfile(__dirname + '/index.html');
// });

// io.sockets.on('connection', function (socket) {
//   socket.emit('news', { hello: 'world' });
//   socket.on('my other event', function (data) {
//     console.log(data);
//   });
// });