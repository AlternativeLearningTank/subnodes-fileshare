/* global console */
var path = require('path')
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

// get from user input
var ip = "192.168.3.1";
var share = "anonymous";
var mnt = "/mnt/public";
var guest = true;

function mountShare() {
	var cmd = su(['mount', '//'+ip+'/'+share, mnt, '-o', 'guest']);
	cmd.stdout.on('data', function(data) {
		console.log("stdout: " + data);
	});
	cmd.stderr.on('data', function(data) {
		console.log("stderr: " + data);
	});
	cmd.on('exit', function(code) {
		console.log('Child process exited with exit code '+code);

		switch (code) {
			case 0:
				console.log("share successfully mounted, listing directory contents...");
			case 32:
				console.log("share is already mounted, attempting to list contents...");
				// start watching the share for changes; update display if any.
				var log = console.log.bind(console);
				var watcher = chokidar.watch('file, dir, or glob', {
					  ignored: /[\/\\]\./,
					  persistent: true
					});

					// watcher handlers
					watcher
						.on('add', function(path) { log('File', path, 'has been added'); })
						.on('change', function(path) { log('File', path, 'has been changed'); })
				 		.on('unlink', function(path) { log('File', path, 'has been removed'); })
						.on('addDir', function(path) { log('Directory', path, 'has been added'); })
						.on('unlinkDir', function(path) { log('Directory', path, 'has been removed'); })
						.on('error', function(error) { log('Error happened', error); });
				// update the directory listing
				updateDisplay();
			break;
		}
	});
}
mountShare();

function updateDisplay() {
	fs.readdir(mnt, function(err, files) {
		if (err) {
			console.log('err: ' + err);
		}
		else {
			// get list of files in current directory
			files.forEach(function(f) {
				if ( f.indexOf('.') > 0 ) console.log("files: " + f);
			});
		}
	});
}


// ----------------------
// Set up our HTTP server
// ----------------------
http.listen(config.http.port);
console.log('subnodes-fileshare is running at: http://localhost:' + config.http.port + '.');