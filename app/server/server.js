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
    ,fs = require('fs');


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

		if (code === 0) {
			// success
			console.log("share successfully mounted. listing directory contents now.");
			fs.readdir(mnt, function(err, files) {
				if (err) {
					console.log('err: ' + err);
				}
				else {
					files.forEach(function(f) {
						if ( f.indexOf('.') > 0 ) console.log("files: " + f);
					});

					console.log("writing a test file to the share");
					fs.writeFile(mnt+'/message.txt', 'Hello Node', function (err) {
					  if (err) throw err;
					  console.log('It\'s saved!');
					});

					var mv = su(['mv', 'text.txt', mnt]);
					mv.on('exit', function(code) {
						console.log("mv exited with code " + code);
					});
				}
			});
		}
		else if (code === 32) {
			console.log("share was already mounted, trying again to write file")
			// resource was busy, drive probably needs to be unmounted
			// var umount = su(['unmount', mnt]);
			// umount.on('exit', function(code) {
			// 	if (code === 0) {
			// 		mountShare();
			// 	}
			// })
			fs.readdir(mnt, function(err, files) {
				if (err) {
					console.log('err: ' + err);
				}
				else {
					files.forEach(function(f) {
						if ( f.indexOf('.') > 0 ) console.log("files: " + f);
					});

					console.log("writing a test file to the share");
					fs.writeFile(mnt+'/message.txt', 'Hello Node', function (err) {
					  if (err) throw err;
					  console.log('It\'s saved!');
					});

					var mv = su(['mv', 'text.txt', mnt]);
					mv.on('exit', function(code) {
						console.log("mv exited with code " + code);
					});
				}
			});
		}
	});
}
mountShare();


// ----------------------
// Set up our HTTP server
// ----------------------
http.listen(config.http.port);
console.log('subnodes-fileshare is running at: http://localhost:' + config.http.port + '.');