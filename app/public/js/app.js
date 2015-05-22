// Application Controller

var config = require('clientconfig')
    ,domReady = require('domready')
    ,$dataTable;

// exports
module.exports = {

    // this is the whole app init
    init: function () {

        var self = window.app = this;

        // wait for document ready to render our main view
        domReady(function () {

            // hook up the UI
            var $bDisconnect = $('#bDisconnect')
                ,$bServer = $('#bServer')
                ,$bClient = $('#bClient')
                ,$bCreateServer = $('#bCreateServer')
                ,$bConnect = $('#bConnect')
                ,$bRefresh = $('#bRefresh')
                ,$createServer = $('#create-server')
                ,$createClient = $('#create-client')
                ,$directory = $('#directory')
                ,$serverAddr = $('#serverAddr')
                ,$shareAddr = $('#shareAddr')
                ,$mountPt = $('#mountPt');

            $dataTable = $('#dataTable');

            // init input fields with info from config, if they exist
            var sPath = config.smbServer.path;
            var ip = config.smbClient.ip;
            var share = config.smbClient.share;
            var mnt = config.smbClient.mount;
            var data = [];

            $serverAddr.val( sPath ? sPath : '' );
            $shareAddr.val( ip && share ? '//'+config.smbClient.ip+'/'+config.smbClient.share : '' );
            $mountPt.val( mnt ? mnt : '' );

            // set UI handlers
            $bServer.on('click', function() {
                $createClient.fadeOut();
                $createServer.fadeIn();
            });

            $bClient.on('click', function() {
                $createServer.fadeOut();
                $createClient.fadeIn();
            });

            $bCreateServer.on('click', function() {
                // create the server 
                data = {"dir": $serverAddr.val()};
                module.exports.createServer(data);
            });

            $bConnect.on('click', function() {
                $directory.fadeIn();
                $bDisconnect.fadeIn();
                // mount drive
                data = [{"share": $shareAddr.val()}, {"mount": $mountPt.val()}];
                module.exports.connect(data);
            });

            $bRefresh.on('click', function() {
                // refresh the file contents
                data = data.length > 0 ? data : [{"share": $shareAddr.val()}, {"mount": $mountPt.val()}];
                module.exports.updateDataTable(data, '/files', null);
            });

            $bDisconnect.on('click', function() {
                $bDisconnect.fadeOut();
                $directory.fadeOut();
                // unmount
                data = data.length > 0 ? data : [{"share": $shareAddr.val()}, {"mount": $mountPt.val()}];
                module.exports.disconnect(data);
            });

            // // init our main view
            // var mainView = self.view = new MainView({
            //     model: self.login,
            //     el: document.body
            // });

            // // ...and render it
            // mainView.render();

            // we have what we need, we can now start our router and show the appropriate page
            //self.router.history.start({pushState: true, root: '/'});
        });
    },

    createServer: function(data) {
        console.log("createServer");
        $.ajax({
            type: 'POST',
            data: JSON.stringify(data),
            contentType: "application/json",
            dataType: 'json',
            url: '/createServer',                      
            success: function(res) {
                console.log(JSON.stringify(res));   
                console.log("server creation status: " + res.status);                       
            },
            error: function(error) {
                console.log("There was an error creating the server share... " + error);
             }
        });
    },

    disconnect: function(data) {
        $.ajax({
            type: 'POST',
            data: JSON.stringify(data),
            contentType: "application/json",
            dataType: 'json',
            url: '/disconnect',                      
            success: function(res) {
                console.log(JSON.stringify(res));   
                console.log("disconnected status: " + res.status);  
                $dataTable.fnClearTable();                        
            },
            error: function(error) {
                console.log("There was an error connecting to the file share... " + error);
             }
        });
        // $.get('/disconnect').then(function(res){
        //     console.log("disconnect status: " + res.status);
        // });
    },

    connect: function(data) {
        $.ajax({
            type: 'POST',
            data: JSON.stringify(data),
            contentType: "application/json",
            dataType: 'json',
            url: '/connect',                      
            success: function(res) {
                console.log(JSON.stringify(res));   
                console.log("connected status: " + res.status);
                module.exports.initDataTable();
                module.exports.updateDataTable(data, '/files', null);                            
            },
            error: function(error) {
                console.log("There was an error connecting to the file share... " + error);
             }

        });
        // $.get('/connect').then(function(data){
        //     console.log("connected status: " + data.status);
        //     module.exports.initDataTable();
        //     module.exports.updateDataTable('/files', null);
        // });
    },

    initDataTable: function(data) {

        // currentPath needs to be define somewhere accessible for many methods
        // currentPath = null;

        var opts = {
                "bProcessing": true,
                "bServerSide": false,
                "bPaginate": false,
                "bAutoWidth": false,
                "bFilter": false,
                "sScrollY":"250px",
                "fnCreatedRow" :  function( nRow, aData, iDataIndex ) {
                    if (!aData.isDir) return;
                    var path = aData.path;
                    $(nRow).on("click", function(e){
                        module.exports.updateDataTable(data, '/files?path='+path, path);
                        e.preventDefault();
                    });
                },
                "aoColumns": [
                    { "sTitle": "", "mData": null, "bSortable": false, "sClass": "head0", "sWidth": "55px",
                        "render": function (data, type, row, meta) {
                            if (data.isDir) {
                                return "<a href='#' target='_blank'><i class='fa fa-folder'></i>&nbsp;" + data.name +"</a>";
                            } else {
                                return "<a href='/" + data.path + "' target='_blank'><i class='fa " + module.exports.getFileIcon(data.ext) + "'></i>&nbsp;" + data.name +"</a>";
                            }
                        }
                    }
                ]
        };

        // initialize dataTable
        if ( ! $.fn.DataTable.isDataTable( $dataTable ) ) {
            $dataTable.dataTable(opts);
        }
        
        // $(".up").on("click", function(e){
        //     if (!currentPath) return;
        //     var idx = currentPath.lastIndexOf("/");
        //     var path =currentPath.substr(0, idx);
        //     $.get('/files?path='+ path).then(function(data){
        //         table.fnClearTable();
        //         table.fnAddData(data);
        //         currentPath = path;
        //     });
        // });
    },

    updateDataTable: function(data, endPoint, path) {
        $.ajax({
            type: 'POST',
            data: JSON.stringify(data),
            contentType: "application/json",
            dataType: 'json',
            url: endPoint,                      
            success: function(res) {
                console.log(JSON.stringify(res));     

                $dataTable.fnClearTable();
                $dataTable.fnAddData(res);                        
            },
            error: function(error) {
                console.log("There was an error updating the data table... " + error);
             }

        });

        // $.get(endPoint).then(function(data){
        //     $dataTable.fnClearTable();
        //     $dataTable.fnAddData(data);
        //     // currentPath = path;
        // });
    },

    getFileIcon: function(ext) {
        extensionsMap = {
            ".zip" : "fa-file-archive-o",         
            ".gz" : "fa-file-archive-o",         
            ".bz2" : "fa-file-archive-o",         
            ".xz" : "fa-file-archive-o",         
            ".rar" : "fa-file-archive-o",         
            ".tar" : "fa-file-archive-o",         
            ".tgz" : "fa-file-archive-o",         
            ".tbz2" : "fa-file-archive-o",         
            ".z" : "fa-file-archive-o",         
            ".7z" : "fa-file-archive-o",         
            ".mp3" : "fa-file-audio-o",         
            ".cs" : "fa-file-code-o",         
            ".c++" : "fa-file-code-o",         
            ".cpp" : "fa-file-code-o",         
            ".js" : "fa-file-code-o",         
            ".xls" : "fa-file-excel-o",         
            ".xlsx" : "fa-file-excel-o",         
            ".png" : "fa-file-image-o",         
            ".jpg" : "fa-file-image-o",         
            ".jpeg" : "fa-file-image-o",         
            ".gif" : "fa-file-image-o",         
            ".mpeg" : "fa-file-movie-o",         
            ".pdf" : "fa-file-pdf-o",         
            ".ppt" : "fa-file-powerpoint-o",         
            ".pptx" : "fa-file-powerpoint-o",         
            ".txt" : "fa-file-text-o",         
            ".log" : "fa-file-text-o",         
            ".doc" : "fa-file-word-o",         
            ".docx" : "fa-file-word-o",         
        };
        return ( ext && extensionsMap[ext.toLowerCase()]) || 'fa-file-o';
    },

};

// run it
module.exports.init();