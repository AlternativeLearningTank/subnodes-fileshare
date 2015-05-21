(function() {
	'use strict';

	var _ = require('underscore')
		,path = require('path')
		,express = require('express')
		,router = express.Router()
	    ,config = require('getconfig')
	    ,su = require('sudo')
	    ,fs = require('fs')
	    ,chokidar = require('chokidar')
	    ,getFileList = require('../modules/GetFileList')
	    ,dirContents = []
	    ,watcher;

	// ---------------------------
	// Create route for index page
	// ---------------------------
	router.get('/', function(req, res) {
		res.render('index');
	});

	// ---------------------------------------------------------
	// Set up our mount point when application requests /connect
	// ---------------------------------------------------------
	router.get('/connect', function(req, res) {

		console.log("/connect called");
		
		var json = getFileList.connect();
		res.end(json);
	});

	// -------------------------------------------------------
	// Return files in shared drive
	// -------------------------------------------------------
	router.get('/files', function(req, res) {

		console.log("/files called");

		var json = getFileList.files();
		res.end(json);

		
	});


	// -------------------------------------------------------
	// Disconnect from the drive
	// -------------------------------------------------------
	router.get('/disconnect', function(req, res) {

		console.log("/disconnect called");

		var json = getFileList.disconnect();
		res.end(json);
	});

	module.exports = router;
}());