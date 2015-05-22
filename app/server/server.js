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
	//
	// set where our front-end pages live + how to render them (with HTML)
	//
	app.set('views', path.join(__dirname, 'views'));
	app.engine('html', require('ejs').renderFile);
	app.set('view engine', 'html');
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));
	//
	// Set our client config cookie
	//
	app.use(cookieParser());
	app.use(function (req, res, next) {
	    res.cookie('config', JSON.stringify(config.client));
	    next();
	});
	//
	// set where our static files will live (js/css/img/fonts/etc)
	//
	app.use(express.static(path.join(__dirname, '../public')));
	app.use('/share', express.static(config.smbClient.mount)); // but mount location can change... need to fix this
	//
	// where our routing rules will live
	app.use('/', routes);
	//
	// Set up our port and HTTP server
	//
	app.set('port', config.http.port || 8080);
	var server = app.listen(app.get('port'), function() {
		console.log("Express server listening on port " + server.address().port);
	});
	//
	// makes `app` publically available
	//
	module.exports = app;
	//
}());