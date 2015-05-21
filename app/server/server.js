(function() {
  'use strict';
	var _ = require('underscore')
		,path = require('path')
	    ,config = require('getconfig')
	    ,express = require('express')
	    ,app = express()
	    ,cookieParser = require('cookie-parser')
	    ,bodyParser = require('body-parser')
	    ,routes = require('./routes/index');

	// -----------------
	// Configure express
	// -----------------
	app.set('views', path.join(__dirname, 'views'));
	app.engine('html', require('ejs').renderFile);
	app.set('view engine', 'html');
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(cookieParser());
	app.use(express.static(path.join(__dirname, '../spublic')));
	app.use('/', routes);
	app.set('port', config.http.port || 8080);

	// ----------------------------
	// Set our client config cookie
	// ----------------------------
	app.use(function (req, res, next) {
	    res.cookie('config', JSON.stringify(config.client));
	    next();
	});

	// ----------------------
	// Set up our HTTP server
	// ----------------------
	var server = app.listen(app.get('port'), function() {
		console.log("Express server listening on port " + server.address().port);
	});

	module.exports = app;

}());