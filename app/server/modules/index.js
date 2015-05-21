(function() {
	'use strict';
	var _ = require('underscore')
		,path = require('path')
	    ,config = require('getconfig')
	    ,su = require('sudo')
	    ,fs = require('fs')
	    ,chokidar = require('chokidar')
	    ,dirContents = [];

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
					//start watching the share for changes; update display if any.
					var watcher = chokidar.watch(mnt, {
						  ignored: /[\/\\]\./,
						  persistent: true,
						  ignoreInitial: true,
						  usePolling: true,
						  depth: 3
						});
						// watcher handlers
						watcher
							.on('add', function(path) { getFiles(mnt, res); })
							.on('change', function(path) { getFiles(mnt, res); })
					 		.on('unlink', function(path) { getFiles(mnt, res); })
							.on('addDir', function(path) { getFiles(mnt, res); })
							.on('unlinkDir', function(path) { getFiles(mnt, res); })
							.on('error', function(error) { console.log('Error happened', error); });

					// get initial directory reading
					getFiles(mnt, res);
				break;
				case 1:
					console.log("exit code 1, error.");
				break;
			}
		});
}());