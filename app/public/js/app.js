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
                ,$dataTable = $('#dataTable');

            $bServer.on('click', function() {
                $createClient.fadeOut();
                $createServer.fadeIn();
            });

            $bClient.on('click', function() {
                $createServer.fadeOut();
                $createClient.fadeIn();
            });

            $bConnect.on('click', function() {
                $directory.fadeIn();
                $bDisconnect.fadeIn();
                // mount drive
                module.exports.connect();
            });

            $bRefresh.on('click', function() {
                // refresh the file contents
                module.exports.updateDataTable();
            });

            $bDisconnect.on('click', function() {
                $bDisconnect.fadeOut();
                $directory.fadeOut();
                // unmount
                module.exports.disconnect();
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

    disconnect: function() {
        $.get('/disconnect').then(function(data){
            console.log("disconnect status: " + data.status);
        });
    },

    connect: function() {
        $.get('/connect').then(function(data){
            console.log("connected status: " + data.status);
            console.log("in connect, $dataTable.size(): " + $dataTable.size());
            module.exports.initDataTable();
            module.exports.updateDataTable('/files', null);
        });
    },

    initDataTable: function() {

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
                        updateDataTable('/files?path='+path, path);
                        e.preventDefault();
                    });
                },
                "aoColumns": [
                    { "sTitle": "", "mData": null, "bSortable": false, "sClass": "head0", "sWidth": "55px",
                        "render": function (data, type, row, meta) {
                            if (data.isDir) {
                                return "<a href='#' target='_blank'><i class='fa fa-folder'></i>&nbsp;" + data.name +"</a>";
                            } else {
                                return "<a href='/" + data.path + "' target='_blank'><i class='fa " + getFileIcon(data.ext) + "'></i>&nbsp;" + data.name +"</a>";
                            }
                        }
                    }
                ]
        };

        // initialize dataTable
        console.log("in initDataTable, $dataTable.size(): " + $dataTable.size());
        $dataTable.dataTable(opts);

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

    updateDataTable: function(endPoint, path) {
        console.log("updating data table...");
        // $.get('/files').then(function(data){
        $.get(path).then(function(data){

            console.log("in updateDataTable, $dataTable.size(): " + $dataTable.size());
            $dataTable.fnClearTable();
            $dataTable.fnAddData(data);
            // currentPath = path;
        });
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