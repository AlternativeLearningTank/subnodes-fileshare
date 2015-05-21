/* global console */
var _ = require('underscore')
	,path = require('path')
    ,config = require('getconfig')
    ,app = require('express')()
    ,compress = require('compression')
    ,serveStatic = require('serve-static')
    ,cookieParser = require('cookie-parser')
    ,bodyParser = require('body-parser')
    ,http = require('http').createServer(app)
    // ,smb2 = require('smb2');
    ,su = require('sudo')
    ,fs = require('fs')
    ,chokidar = require('chokidar');


// -----------------
// Configure express
// -----------------
app.use(compress());
app.use(serveStatic(path.resolve(path.normalize('public'))));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use Jade for template engine
app.set('view engine', 'jade');

// ----------------------------
// Set our client config cookie
// ----------------------------
app.use(function (req, res, next) {
    res.cookie('config', JSON.stringify(config.client));
    next();
});

// ----------------------------
// Create an SMB2 instance
// ----------------------------
// var smb2Client = new smb2({
//   share:'\\\\192.168.3.1\\anonymous'
// , domain:'WORKGROUP'
// , username:''
// , password:''
// , debug: true
// , autoCloseTimeout: 0
// });

// smb2Client.readdir('\\', function(err, files){
// 	if(err) {
//         console.log("Error (readdir):\n", err);
//         console.log("files", files);
//     } else {
//         console.log("Connection made.");
//         console.log(files); 
//     }
// });

// ---------------------------
// Create route for index page
// ---------------------------
app.get('/', function(req, res) {
	res.redirect('template.html');
});

// ----------------------------------------------------
// Set up our mount point when user navigates to /files
// ----------------------------------------------------
app.get('/files', function(req, res) {
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
				   ]
		,dirContents = [];

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
				var log = console.log.bind(console);
				var watcher = chokidar.watch(mnt, {
					  ignored: /[\/\\]\./,
					  persistent: true,
					  ignoreInitial: true,
					  usePolling: true,
					  depth: 3
					});

					// watcher handlers
					watcher
						.on('add change unlink addDir unlinkDir', function(path) {
							// get directory listing
							getFiles();

							console.log("updating the file display list!")
							// display based on dirContents
							for (var i=0; i<dirContents.length; i++) {
								console.log(dirContents[i].name);
							}

							// return json in the response
							res.json(dirContents);
						})
						.on('error', function(err) {
							console.log("error happened: " + err);
						});
						// .on('add', function(path) { log('File', path, 'has been added'); getFiles(res); })
						// .on('change', function(path) { log('File', path, 'has been changed'); updateFileList(path); })
				 		// .on('unlink', function(path) { log('File', path, 'has been removed'); getFiles(res); })
						// .on('addDir', function(path) { log('Directory', path, 'has been added'); getFiles(res); })
						// .on('unlinkDir', function(path) { log('Directory', path, 'has been removed'); getFiles(res); })
						// .on('error', function(error) { log('Error happened', error); });
				// get initial directory reading
				getFiles();

				console.log("updating the file display list!")
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

// function updateDisplay(res) {

// 	console.log("updating the file display list!")
// 	// display based on dirContents
// 	for (var i=0; i<dirContents.length; i++) {
// 		console.log(dirContents[i].name);
// 	}

// 	// return json in the response
// 	res.json(dirContents);
// }

// would be faster to just deal w/individual files, but no time to implement correctly
// TO-DO: need efficient way to remove items from the dirContents array
// function updateFileList(action, file) {

// 	var start = file.lastIndexOf('/')+1;
// 	var f = file.substring(start, file.length);
// 	console.log("f: " + f);

// 	switch(action) {
// 		case 'add':
// 			// make note of directories
// 			var isDir = fs.statSync(file).isDirectory();
// 			if (isDir) {
// 				dirContents.push({ name : f, isDir: true, path : file });
// 			//
// 			} else {
// 			// make note of files
// 				// do not display files beginning with a dot
// 				if ( f.indexOf('.') > 0 ) {
// 					var ext = path.extname(f);    
// 					dirContents.push({ name : f, ext : ext, isDir: false, path : file });
// 				}
// 			}
// 		break;

// 		case 'del':
// 		break;
// 	}
	

// 	dirContents = _.sortBy(dirContents, function(file) { return file.name });
// 	// res.json(dirContents);
// 	console.log("initial directory listing found! " + dirContents.length + " files found.");

// 	// update the display
// 	updateDisplay();
// }

function getFiles() {

	var cwd = mnt;
	dirContents = [];

	fs.readdir(cwd, function(err, files) {
		if (err) {
			console.log('err: ' + err);
		}
		else {
			// get list of files in current directory
			files.forEach(function(f) {
				try {
					//
					// make note of directories
	               	var isDir = fs.statSync(path.join(cwd,f)).isDirectory();
		            if (isDir) {
		            	dirContents.push({ name : f, isDir: true, path : path.join(cwd, f)  });
		            //
		            } else {
		            // make note of files
				      	// do not display files beginning with a dot
						if ( f.indexOf('.') > 0 ) {
		                 	var ext = path.extname(f);    
		                  	dirContents.push({ name : f, ext : ext, isDir: false, path : path.join(cwd, f) });
		                }
		            }
			    } catch(e) {
			    	console.log("caught error! " + e);
		    	}
			});
		}

		dirContents = _.sortBy(dirContents, function(file) { return file.name });
		console.log("initial directory listing found! " + dirContents.length + " files found.");

		// update the display
		//updateDisplay(res);
	});
}

//watcher.close(); needed when program exits


// ----------------------
// Set up our HTTP server
// ----------------------
http.listen(config.http.port);
console.log('subnodes-fileshare is running at: http://localhost:' + config.http.port + '.');