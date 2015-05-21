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
    ,cp = require('child_process')
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

// build the exec string
// var smb = cp.exec('sudo mount //'+ip+'/'+share+' '+mnt+' -o guest', function(err, stdout, stderr) {
// 	if (err) {
// 	     console.log(err.stack);
// 	     console.log('Error code: '+err.code);
// 	     console.log('Signal received: '+err.signal);
// 	   }
// 	   console.log('Child Process STDOUT: '+stdout);
// 	   console.log('Child Process STDERR: '+stderr);
// });
// smb.on('exit', function(code) {
// 	console.log('Child process exited with exit code '+code);

// 	if (code === 0) {
// 		console.log("share successfully mounted. listing directory contents now.");
// 		fs.readdir('/mnt/public', function(err, files) {
// 			if (err) {
// 				console.log('err: ' + err);
// 			}
// 			else {
// 				files.forEach(function(f) {
// 					console.log("files: " + f);
// 				});

// 				console.log("writing a test file to the share");
// 				fs.write('/mnt/public/test.txt', 'lorem ipsum', function(err) {
// 					if (err) { 
// 						console.log("err: " + err);
// 					}
// 					else {
// 						console.log("wrote text.txt to smb share");
// 					}
// 				});
// 			}
// 		});
// 	}
// });

var cmd = cp.spawn('sudo mount //'+ip+'/'+share+' '+mnt+' -o guest');
cmd.stdout.on('data', function(data) {
	console.log("stdout: " + data);
});
cmd.stderr.on('data', function(data) {
	console.log("stderr: " + data);
});
cmd.on('exit', function(code) {
	console.log('Child process exited with exit code '+code);

	if (code === 0) {
		console.log("share successfully mounted. listing directory contents now.");
		fs.readdir('/mnt/public', function(err, files) {
			if (err) {
				console.log('err: ' + err);
			}
			else {
				files.forEach(function(f) {
					console.log("files: " + f);
				});

				console.log("writing a test file to the share");
				fs.write('/mnt/public/test.txt', 'lorem ipsum', function(err) {
					if (err) { 
						console.log("err: " + err);
					}
					else {
						console.log("wrote text.txt to smb share");
					}
				});
			}
		});
	}
});


// ----------------------
// Set up our HTTP server
// ----------------------
http.listen(config.http.port);
console.log('subnodes-fileshare is running at: http://localhost:' + config.http.port + '.');