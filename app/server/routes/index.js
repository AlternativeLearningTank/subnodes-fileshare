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
	// Set up our mount point and connect to shared drive
	// ---------------------------------------------------------
	router.get('/connect', function(req, res) {

		// console.log("/connect called");
		
		var json = sharedDrive.connect(function(data) {
			res.json(data);
		});
	});

	// -------------------------------------------------------
	// Return files in shared drive
	// -------------------------------------------------------
	router.get('/files', function(req, res) {

		console.log("/files called");

		sharedDrive.readFiles(function(data) {
			res.json(data);
		});
	});

	// -------------------------------------------------------
	// Disconnect from the share drive
	// -------------------------------------------------------
	router.get('/disconnect', function(req, res) {

		console.log("/disconnect called");

		var json = sharedDrive.disconnect(function(data) {
			res.json(data);
		});
	});

	module.exports = router;

}());