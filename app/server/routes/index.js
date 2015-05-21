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
	    ,dirContents = [];

	// ---------------------------
	// Create route for index page
	// ---------------------------
	router.get('/', function(req, res) {
		res.render('index');
	});

	// -------------------------------------------------------
	// Set up our mount point when application requests /files
	// -------------------------------------------------------
	router.get('/files', function(req, res) {
		
		// get params from 1)config file or 2)user input
		var ip = config.smbClient.ip
			,share = config.smbClient.share
			,mnt = config.smbClient.mount
			,opts = config.smbClient.options
			,params = ['mount',
						'//'+ip+'/'+share,
						mnt,
						opts.length>0?'-o':'',
						opts[0]
					   ];
			// ,dirContents = [];

		// mount the share drive + watch for changes
		var cmd = su( params );
		cmd.stdout.on('data', function(data) {
			console.log("stdout: " + data);
		});
		cmd.stderr.on('data', function(data) {
			console.log("stderr: " + data);
		});
		cmd.on('exit', function(code) {
			console.log('Child process exited with exit code '+code);

			// handle exit codes
			switch (code) {
				case 0:
					console.log("share successfully mounted, listing directory contents...");
				case 32:
					console.log("share is already mounted, attempting to list contents...");
					// start watching the share for changes; update display if any.
					// var watcher = chokidar.watch(mnt, {
					// 	  ignored: /[\/\\]\./,
					// 	  persistent: true,
					// 	  ignoreInitial: true,
					// 	  usePolling: true,
					// 	  depth: 3
					// 	});

					// 	// watcher handlers
					// 	watcher
					// 		.on('add', function(path) { 
					// 			// get directory listing
					// 			getFiles(mnt);
					// 			// return json in the response
					// 			res.json(dirContents);
					// 		})
					// 		// .on('change', function(path) { 
					// 		// 	// get directory listing
					// 		// 	//getFiles(mnt);
					// 		// 	// return json in the response
					// 		// 	//res.json(dirContents);
					// 		// })
					//  		.on('unlink', function(path) { 
					// 			// get directory listing
					// 			getFiles(mnt);
					// 			// return json in the response
					// 			res.json(dirContents);
					// 		})
					// 		.on('addDir', function(path) { 
					// 			// get directory listing
					// 			getFiles(mnt);
					// 			// return json in the response
					// 			res.json(dirContents);
					// 		})
					// 		.on('unlinkDir', function(path) { 
					// 			// get directory listing
					// 			getFiles(mnt);
					// 			// return json in the response
					// 			res.json(dirContents);
					// 		})
					// 		.on('error', function(error) { console.log('Error happened', error); });

					// get initial directory reading
					getFiles(mnt);

					// print out files found for debugging
					console.log("directory listing found! " + dirContents.length + " files found.");
					// display based on dirContents
					for (var i=0; i<dirContents.length; i++) {
						console.log(dirContents[i].name);
					}

					// return json in the response
					res.json(dirContents);
				break;
				case 1:
					console.log("exit code 1, error.");
				break;
			}
		});
	});

	function getFiles(mnt) {

		// reset dirContents array
		dirContents = [];

		fs.readdir(mnt, function(err, files) {
			if (err) {
				console.log('err: ' + err);
			}
			else {
				// get list of files in current directory
				files.forEach(function(f) {
					try {
						//
						// make note of directories
		               	var isDir = fs.statSync(path.join(mnt,f)).isDirectory();
			            if (isDir) {
			            	dirContents.push({ name : f, isDir: true, path : path.join(mnt, f)  });
			            //
			            } else {
			            // make note of files
					      	// do not display files beginning with a dot
							if ( f.indexOf('.') > 0 ) {
			                 	var ext = path.extname(f);    
			                  	dirContents.push({ name : f, ext : ext, isDir: false, path : path.join(mnt, f) });
			                }
			            }
				    } catch(e) {
				    	console.log("caught error! " + e);
			    	}
				});
			}

			dirContents = _.sortBy(dirContents, function(file) { return file.name });
			console.log("in getFiles, dirContents.length: " + dirContents.length);
		});
	}

	//watcher.close(); needed when program exits

	module.exports = router;
}());