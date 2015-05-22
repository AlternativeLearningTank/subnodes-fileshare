(function() {
	'use strict';

	var router = require('express').Router()
		,sharedDrive = require('../modules/SharedDrive');

	// ---------------------------
	// Create route for index page
	// ---------------------------
	router.get('/', function(req, res) {
		res.render('index');
	});

	// ---------------------------------------------------------
	// Create a server from which we will share files
	// ---------------------------------------------------------
	router.post('/createServer', function(req, res) {
		console.log("createServer on serverside");
		var json = sharedDrive.create(req.body, function(data) {
			res.json(data);
		});
	});

	// ---------------------------------------------------------
	// Set up our mount point and connect to shared drive
	// ---------------------------------------------------------
	router.post('/connect', function(req, res) {

		var json = sharedDrive.connect(req.body, function(data) {
			res.json(data);
		});
	});

	// -------------------------------------------------------
	// Return files in shared drive
	// -------------------------------------------------------
	router.post('/files', function(req, res) {

		sharedDrive.readFiles(req.body, function(data) {
			res.json(data);
		});
	});

	// -------------------------------------------------------
	// Disconnect from the share drive
	// -------------------------------------------------------
	router.post('/disconnect', function(req, res) {

		var json = sharedDrive.disconnect(req.body, function(data) {
			res.json(data);
		});
	});

	module.exports = router;

}());