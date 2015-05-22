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

        var create = function(cData, cb) {
            console.log("shareddrive, create");
            var dir = cData.dir;
            // first make sure the directory exists
            var spawn = require('child_process').spawn,
                ls = spawn('ls', [dir]);
            // ls.stderr.on('data', function(data){
            //     var d = String(data);
            //     console.log("ls stderr: " + d);
            // });
            ls.on('close', function(code) {
                console.log('LS process exited with exit code ' + code);

                switch (code) {
                    case 0:
                        console.log("Directory exists, proceed with initing Samba...");
                        module.exports.cfgSamba(cData, cb);
                    break;

                    case 1:
                        console.log("Error, directory may not exist.");
                    break;

                    case 2:
                        console.log("Error, directory does not exist. Creating directory...");
                        var mkdir = su ( ['mkdir', '-p', dir] );
                        mkdir.on('exit', function(code) {
                            console.log("MKDIR process exited with code " + code);

                            switch (code) {
                                case 0:
                                    console.log("Directory successfully created. Initing Samba now...");
                                    module.exports.cfgSamba(cData, cb);
                                break;
                            }
                        });
                    break;
                }
            });
        }

        var cfgSamba = function(cData, cb) {
            console.log("cfgSamba");
            //chmod -R nobody:nogroup
            var mkdir = su ( ['chmod', '-R', 'nobody:nogroup'] );
                mkdir.on('exit', function(code) {
                console.log("CHMOD process exited with code " + code);

                switch (code) {
                    case 0:
                        console.log("Changed group ownership successfully...");
                        // edit /etc/samba/smb.conf
                        // sudo service samba restart
                    break;
                }
            });
        }

        var connect = function(cData, cb) {
            console.log("connect");

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

            var mnt = cData[1].mount;
            
            console.log("Attempting to connect to " + cData[0].share + " mounted at " + mnt);

            // first make sure the mount point exists by trying to ls it
            var spawn = require('child_process').spawn,
                ls = spawn('ls', [mnt]);
            // ls.stderr.on('data', function(data){
            //     var d = String(data);
            //     console.log("ls stderr: " + d);
            // });
            ls.on('close', function(code) {
                console.log('LS process exited with exit code ' + code);

                switch (code) {
                    case 0:
                        console.log("Mount point exists, proceed with loading share...");
                        module.exports.mountShare(cData, cb);
                    break;

                    case 1:
                        console.log("Error, mount point may not exist.");
                    break;

                    case 2:
                        console.log("Error, mount point does not exist. Creating the mount point...");
                        var mkdir = su ( ['mkdir', '-p', mnt] );
                        mkdir.on('exit', function(code) {
                            console.log("MKDIR process exited with code " + code);

                            switch (code) {
                                case 0:
                                    console.log("Mount point successfully created. mounting the share now...");
                                    module.exports.mountShare(cData, cb);
                                break;
                            }
                        });
                    break;
                }
            });
        }

        var mountShare = function(cData, cb) {
            var share = cData[0].share
                ,mnt = cData[1].mount
                ,opts = config.smbClient.options
                ,params = ['mount',
                            share,
                            mnt,
                            opts.length>0?'-o':'',
                            opts[0]
                           ];

            // mount the share drive + watch for changes
            var mount = su( params );
            mount.stderr.on('data', function(data) {
                var d = String(data);
                console.log("mount stderr: " + d);
                                        
                // handle errors
                if ( d.indexOf( "No such device or address" ) > -1 ) {
                    console.log("NO SUCH ADDRESS. LET FRONT-END KNOW");
                    return;
                }
            });
            mount.on('exit', function(code) {
                console.log('MOUNT process exited with exit code '+code);

                // handle exit codes
                switch (code) {
                    case 32:
                        console.log("Share is already mounted, disconnecting...");
                        module.exports.disconnect(cData, function(data) { 
                            console.log("unmount status: " + data.status );
                            if ( data.status === "success" ) {
                                // try to connect again
                                console.log("Attempting to connect again...");
                                module.exports.connect(cData, cb);
                            }
                        });
                        break;
                    case 0:
                        console.log("Share successfully mounted, listing directory contents...");
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
                                    .on('add', function(p) { module.exports.readFiles(cData, function(data){ /* need to send to front-end somehow */ }); })
                                    .on('change', function(p) { module.exports.readFiles(cData, function(data){ /* need to send to front-end somehow */ }); })
                                    .on('unlink', function(p) { module.exports.readFiles(cData, function(data){ /* need to send to front-end somehow */ }); })
                                    .on('addDir', function(p) { module.exports.readFiles(cData, function(data){ /* need to send to front-end somehow */ }); })
                                    .on('unlinkDir', function(p) { module.exports.readFiles(cData, function(data){ /* need to send to front-end somehow */ }); })
                                    .on('error', function(err) { console.log('Error while watching file share: ', err); });

                                    var status = {"status": "success"};
                                    cb(status);
                        break;
                    case 1:
                        var status = {"status": "error"};
                        cb(status);
                        console.log("exit code 1, error while mounting file share.");
                        break;
                }
            });
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
            create: create
           ,cfgSamba: cfgSamba
           ,connect: connect
           ,mountShare: mountShare
           ,readFiles: readFiles
           ,disconnect: disconnect
        }
    }();

    module.exports = SharedDrive;
}());