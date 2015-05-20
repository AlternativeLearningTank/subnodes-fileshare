/* global console */
var path = require('path')
    ,config = require('getconfig')
    ,app = require('express')()
    ,compress = require('compression')
    ,serveStatic = require('serve-static')
    ,cookieParser = require('cookie-parser')
    ,bodyParser = require('body-parser')
    ,http = require('http').createServer(app)
    ,smb2 = require('smb2');


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
var smb2Client = new smb2({
  share:'\\\\192.168.3.1\\anonymous'
, domain:'WORKGROUP'
, username:''
, password:''
, debug: true,
, autoCloseTimeout: 0
});

smb2Client.readdir('\\', function(err, files){
	if(err) {
        console.log("Error (readdir):\n", err);
        console.log("files", files);
    } else {
        console.log("Connection made.");
        console.log(files); 
    }
});


// ----------------------
// Set up our HTTP server
// ----------------------
http.listen(config.http.port);
console.log('subnodes-fileshare is running at: http://localhost:' + config.http.port + '.');