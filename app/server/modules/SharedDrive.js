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

        var connect = function(cData, cb) {

            // get params from 1)config file or 2)user input
            // var ip = config.smbClient.ip
            //     ,share = config.smbClient.share
            //     ,mnt = config.smbClient.mount
                // ,opts = config.smbClient.options
                // ,params = ['mount',
                //             '//'+ip+'/'+share,
                //             mnt,
                //             opts.length>0?'-o':'',
                //             opts[0]
                //            ];

            var share = cData[0].share
                ,mnt = cData[1].mount
                ,opts = config.smbClient.options
                ,params = ['mount',
                            share,
                            mnt,
                            opts.length>0?'-o':'',
                            opts[0]
                           ];
            
            console.log("connecting to " + share + " mounted at " + mnt);

            // first make sure the mount point exists
            // if [ ! -d "$DIRECTORY" ]; then
            //   # Control will enter here if $DIRECTORY doesn't exist.
            // fi
            var cd = su( ['cd', mnt]);
            cd.stderr.on('data', function(data){
                var d = String(data);
                console.log("cd stderr: " + d);
            });
            cd.on('exit', function(code) {
                console.log('CD process exited with exit code '+code);

                switch (code) {
                    case 0:
                        console.log("mount point exists, proceed with loading share...");
                    break;

                    case 1:
                        console.log("error, mount point may not exist. Create the mount point.");
                    break;
                }
            });

            // // mount the share drive + watch for changes
            // var mount = su( params );
            // mount.stdout.on('data', function(data) {
            //     console.log("stdout: " + data);
            // });
            // mount.stderr.on('data', function(data) {

            //     var d = String(data);

            //     console.log("mount stderr: " + d);

            //     // handle errors
            //     if ( d.indexOf( "No such file or directory" ) > -1 ) {
            //         console.log("MOUNT POINT DOES NOT EXIST. TRY TO CREATE?");
            //     }
            //     else if ( d.indexOf( "No such device or address" ) > -1 ) {
            //         console.log("THERE IS NO SUCH ADDRESS. LET FRONT-END KNOW");
            //         return;
            //     }
            // });
            // mount.on('exit', function(code) {
            //     console.log('MOUNT process exited with exit code '+code);

            //     // handle exit codes
            //     switch (code) {
            //         case 32:
            //             console.log("share is already mounted, disconnecting...");
            //             module.exports.disconnect(cData, function(data) { 
            //                 console.log("unmount status: " + data.status );
            //                 if ( data.status === "success" ) {
            //                     // try to connect again
            //                     console.log("attempting to connect again...");
            //                     module.exports.connect(cData, cb);
            //                 }
            //             });
            //             break;
            //         case 0:
            //             console.log("share successfully mounted, listing directory contents...");
            //             //start watching the share for changes; update display if any.
            //             watcher = chokidar.watch(mnt, {
            //                   ignored: /[\/\\]\./,
            //                   persistent: true,
            //                   ignoreInitial: true,
            //                   usePolling: true,
            //                   depth: 3
            //                 });
            //                 // watcher handlers
            //                 watcher
            //                     .on('add', function(p) { module.exports.readFiles(cData, function(data){ /* need to send to front-end somehow */ }); })
            //                     .on('change', function(p) { module.exports.readFiles(cData, function(data){ /* need to send to front-end somehow */ }); })
            //                     .on('unlink', function(p) { module.exports.readFiles(cData, function(data){ /* need to send to front-end somehow */ }); })
            //                     .on('addDir', function(p) { module.exports.readFiles(cData, function(data){ /* need to send to front-end somehow */ }); })
            //                     .on('unlinkDir', function(p) { module.exports.readFiles(cData, function(data){ /* need to send to front-end somehow */ }); })
            //                     .on('error', function(err) { console.log('Error while watching file share: ', err); });

            //             var status = {"status": "success"};
            //             cb(status);
            //         break;
            //         case 1:
            //             var status = {"status": "error"};
            //             cb(status);
            //             console.log("exit code 1, error while mounting file share.");
            //         break;
            //     }
            // });
        }

        var readFiles = function(cData, cb) {

            // var mnt = config.smbClient.mount;
            var mnt = cData[1].mount;

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
                    // return the array
                    cb( dirContents );
                }
            });
        }

        var disconnect = function(cData, cb) {

            // get params from 1)config file or 2)user input
            // var mnt = config.smbClient.mount
            //     ,params = ['umount', mnt ];
            var mnt = cData[1].mount
                ,params = ['umount', mnt ];

            // call umount  
            var umount = su( params );
            umount.stdout.on('data', function(data) {
                console.log("stdout: " + data);
            });
            umount.stderr.on('data', function(data) {
                console.log("stderr: " + data);
            });
            umount.on('exit', function(code) {
                console.log('UMOUNT process exited with exit code '+code);

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