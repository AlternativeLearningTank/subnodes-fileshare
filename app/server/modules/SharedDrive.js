(function() {
    'use strict';

    var SharedDrive = function() {

        var _ = require('underscore')
        ,path = require('path')
        ,config = require('getconfig')
        ,su = require('sudo')
        ,fs = require('fs')
        ,chokidar = require('chokidar')
        ,dirContents = []
        ,watcher;

        var connect = function(cb) {

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
                        //start watching the share for changes; update display if any.
                        watcher = chokidar.watch(mnt, {
                              ignored: /[\/\\]\./,
                              persistent: true,
                              ignoreInitial: true,
                              usePolling: true,
                              depth: 3
                            });
                            // watcher handlers
                            watcher
                                .on('add', function(p) { module.exports.readFiles(); })
                                .on('change', function(p) { module.exports.readFiles(); })
                                .on('unlink', function(p) { module.exports.readFiles(); })
                                .on('addDir', function(p) { module.exports.readFiles(); })
                                .on('unlinkDir', function(p) { module.exports.readFiles(); })
                                .on('error', function(err) { console.log('Error while watching file share: ', err); });

                        // get initial directory reading
                        // getFiles(mnt, res);
                        //res.json( {"status": "success"} );
                        var status = {"status": "success"};
                        cb(status);
                    break;
                    case 1:
                        // res.json( {"status": "error"} );
                        var status = {"status": "error"};
                        cb(status);
                        console.log("exit code 1, error while mounting file share.");
                    break;
                }
            });
        }

        var readFiles = function(cb) {

            var mnt = config.smbClient.mount;

            // reset dirContents array
            dirContents = [];

            fs.readdir(mnt, function(err, files) {
                if (err) {
                    console.log('error reading the share directory: ' + err);
                }
                else {
                    // get list of files in current directory
                    files.forEach(function(f) {
                        try {
                            //
                            // identify directories
                            var isDir = fs.statSync(path.join(mnt,f)).isDirectory();
                            if (isDir) {
                                dirContents.push({ name : f, isDir: true, path : path.join(mnt, f)  });
                            //
                            } else {
                                // do not display files beginning with a dot
                                if ( f.indexOf('.') > 0 ) {
                                    var ext = path.extname(f);    
                                    dirContents.push({ name : f, ext : ext, isDir: false, path : path.join(mnt, f) });
                                }
                            }
                        } catch(e) {
                            console.log("error looping through directory files: " + e);
                        }
                    });

                    dirContents = _.sortBy(dirContents, function(file) { return file.name });
                    // print out files found for debugging
                    console.log("directory listing found! " + dirContents.length + " files found.");
                    // return json in the response
                    var json = JSON.stringify( dirContents );
                    cb( json );
                }
            });
        }

        var disconnect = function(cb) {

            // get params from 1)config file or 2)user input
            var mnt = config.smbClient.mount
                ,params = ['umount', mnt ];

            // call umount  
            var cmd = su( params );
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
                        console.log("exit code 0, success disconnecting file share.");
                        // stop watching the drive // TO-DO should check if watcher is open before closing...
                        if ( watcher ) watcher.close();

                        // return status
                        var status = {"status": "success"};
                        cb(status);
                    break;

                    case 1:
                        var status = {"status": "error"};
                        cb(status);
                        console.log("exit code 1, error while disconnecting file share.");
                    break;
                }   
            });
        }

        return {
            connect: connect
           ,readFiles: readFiles
           ,disconnect: disconnect
        }
    }();

    module.exports = SharedDrive;
}());